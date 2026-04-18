/**
 * StockMo Vehicle Import Lambda
 *
 * Triggered by S3 ObjectCreated events. Downloads the uploaded Excel/CSV file,
 * parses ALL columns, maps known columns to the vehicles table, and stores
 * every extra/unknown column in the extra_fields JSONB column.
 *
 * Known-column mapping is loaded from column-map.json — edit that file to
 * add or rename known columns without touching this code.
 */

import { S3Client, GetObjectCommand, PutObjectTaggingCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ─── Config ──────────────────────────────────────────────────────────────────
const __dirname  = dirname(fileURLToPath(import.meta.url));
const COLUMN_MAP = JSON.parse(readFileSync(join(__dirname, 'column-map.json'), 'utf-8'));
const BATCH_SIZE = 50;

const s3 = new S3Client();
const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ─── Column detection ────────────────────────────────────────────────────────

/**
 * Build a lookup: header string → { key, dbColumn, type?, ... } for known columns.
 * Returns a Map<headerIndex, configEntry> and a list of extra column indices.
 */
function classifyColumns(headers) {
  const known = new Map();       // index → { key, ...config }
  const extra = new Map();       // index → original header string

  // Build a flat alias → config lookup
  const aliasLookup = new Map(); // alias string → { key, ...entry }
  for (const [key, entry] of Object.entries(COLUMN_MAP)) {
    for (const alias of entry.aliases) {
      aliasLookup.set(alias, { key, ...entry });
    }
  }

  for (let i = 0; i < headers.length; i++) {
    const raw = String(headers[i]).trim();
    if (!raw) continue;

    // Exact match first
    if (aliasLookup.has(raw)) {
      known.set(i, aliasLookup.get(raw));
      continue;
    }

    // Case-insensitive fallback
    const lower = raw.toLowerCase();
    let matched = false;
    for (const [alias, cfg] of aliasLookup.entries()) {
      if (alias.toLowerCase() === lower) {
        known.set(i, cfg);
        matched = true;
        break;
      }
    }

    if (!matched) {
      extra.set(i, raw);
    }
  }

  return { known, extra };
}

// ─── Row processing ──────────────────────────────────────────────────────────

function processRow(row, known, extra) {
  const vehicle = {};
  const extraFields = {};

  // Map known columns
  for (const [idx, cfg] of known.entries()) {
    let val = row[idx];
    if (val === undefined || val === null) {
      if (cfg.default !== undefined) val = cfg.default;
      else continue;
    }
    val = String(val).trim();
    if (!val && cfg.default !== undefined) val = cfg.default;

    // Type coercion
    if (cfg.type === 'int') {
      val = parseInt(val, 10);
      if (isNaN(val)) val = cfg.default ?? null;
    }

    // Validate enum values (e.g. stage)
    if (cfg.validValues && !cfg.validValues.includes(String(val).toLowerCase())) {
      val = cfg.default ?? String(val);
    } else if (cfg.validValues) {
      val = String(val).toLowerCase();
    }

    vehicle[cfg.dbColumn] = val;
  }

  // Apply defaults for missing known columns
  for (const [key, cfg] of Object.entries(COLUMN_MAP)) {
    if (vehicle[cfg.dbColumn] === undefined && cfg.default !== undefined) {
      vehicle[cfg.dbColumn] = cfg.default;
    }
  }

  // Collect extra columns
  for (const [idx, header] of extra.entries()) {
    const val = row[idx];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      extraFields[header] = typeof val === 'number' ? val : String(val).trim();
    }
  }

  vehicle.extra_fields = extraFields;
  return vehicle;
}

// ─── ID generation ───────────────────────────────────────────────────────────

async function getNextVehicleNumber() {
  const { data } = await sb
    .from('vehicles')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return 1;

  const match = data[0].id.match(/STK-(\d+)/);
  return match ? parseInt(match[1], 10) + 1 : 1;
}

function makeVehicleId(num) {
  return `STK-${String(num).padStart(3, '0')}`;
}

// ─── Template seeding ────────────────────────────────────────────────────────

async function seedTemplates(vehicleId) {
  const today = new Date().toISOString().split('T')[0];

  // Seed PDI checks from templates
  const { data: pdiTemplates } = await sb
    .from('pdi_item_templates')
    .select('*')
    .order('ord');

  if (pdiTemplates?.length) {
    const pdiRows = pdiTemplates.map(t => ({
      vehicle_id: vehicleId,
      item_id:    t.id,
      section:    t.section,
      name:       t.name,
      priority:   t.priority,
      state:      'pending',
    }));
    await sb.from('pdi_checks').upsert(pdiRows, { onConflict: 'vehicle_id,item_id' });
  }

  // Seed final checks from templates
  const { data: finalTemplates } = await sb
    .from('final_check_templates')
    .select('*')
    .order('ord');

  if (finalTemplates?.length) {
    const finalRows = finalTemplates.map(t => ({
      vehicle_id: vehicleId,
      item_id:    t.id,
      section:    t.section,
      name:       t.name,
      priority:   t.priority,
      state:      'pending',
    }));
    await sb.from('final_checks').upsert(finalRows, { onConflict: 'vehicle_id,item_id' });
  }

  // Seed maintenance tasks from templates
  const { data: maintTemplates } = await sb
    .from('maint_task_templates')
    .select('*')
    .order('ord');

  if (maintTemplates?.length) {
    const maintRows = maintTemplates.map(t => ({
      vehicle_id: vehicleId,
      task_id:    t.id,
      name:       t.name,
      freq_days:  t.freq_days,
      priority:   t.priority,
      state:      'pending',
      last_done:  today,
      next_due:   addDays(today, t.freq_days),
    }));
    await sb.from('stock_maintenance').upsert(maintRows, { onConflict: 'vehicle_id,task_id' });
  }
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── S3 helpers ──────────────────────────────────────────────────────────────

async function downloadFromS3(bucket, key) {
  const resp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks = [];
  for await (const chunk of resp.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function tagS3Object(bucket, key, tags) {
  await s3.send(new PutObjectTaggingCommand({
    Bucket: bucket,
    Key: key,
    Tagging: { TagSet: Object.entries(tags).map(([Key, Value]) => ({ Key, Value })) },
  }));
}

// ─── Import log ──────────────────────────────────────────────────────────────

async function createImportLog(fileName) {
  const { data } = await sb
    .from('vehicle_imports')
    .insert({ file_name: fileName, source: 's3', status: 'processing' })
    .select('id')
    .single();
  return data?.id;
}

async function updateImportLog(logId, updates) {
  await sb.from('vehicle_imports').update(updates).eq('id', logId);
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function handler(event) {
  console.log('Event received:', JSON.stringify(event, null, 2));

  // Extract S3 info from event
  const record   = event.Records?.[0];
  if (!record?.s3) {
    return { statusCode: 400, body: 'No S3 record in event' };
  }

  const bucket   = record.s3.bucket.name;
  const key      = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const fileName = key.split('/').pop();

  console.log(`Processing file: s3://${bucket}/${key}`);

  // Create import log entry
  const logId = await createImportLog(fileName);

  try {
    // 1. Download file from S3
    const fileBuffer = await downloadFromS3(bucket, key);
    console.log(`Downloaded ${fileBuffer.length} bytes`);

    // 2. Parse Excel/CSV
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawData.length < 2) {
      await updateImportLog(logId, { status: 'error', error_log: { message: 'File is empty or has no data rows' } });
      await tagS3Object(bucket, key, { 'import-status': 'error', 'import-error': 'empty-file' });
      return { statusCode: 400, body: 'File is empty or has no data rows' };
    }

    // 3. Classify columns
    const headers = rawData[0].map(h => String(h).trim());
    const { known, extra } = classifyColumns(headers);
    const extraColumnNames = [...extra.values()];

    console.log(`Headers: ${headers.join(', ')}`);
    console.log(`Known columns mapped: ${[...known.values()].map(c => c.dbColumn).join(', ')}`);
    console.log(`Extra columns found: ${extraColumnNames.join(', ') || '(none)'}`);

    // Check required columns are present
    const mappedDbColumns = new Set([...known.values()].map(c => c.dbColumn));
    const requiredMissing = Object.entries(COLUMN_MAP)
      .filter(([_, cfg]) => cfg.required && !mappedDbColumns.has(cfg.dbColumn))
      .map(([key]) => key);

    if (requiredMissing.length > 0) {
      const msg = `Missing required columns: ${requiredMissing.join(', ')}`;
      await updateImportLog(logId, { status: 'error', error_log: { message: msg } });
      await tagS3Object(bucket, key, { 'import-status': 'error', 'import-error': 'missing-columns' });
      return { statusCode: 400, body: msg };
    }

    // 4. Process rows
    let nextNum = await getNextVehicleNumber();
    const today = new Date().toISOString().split('T')[0];
    const vehicles = [];
    let skipped = 0;
    const errors = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const vehicle = processRow(row, known, extra);

      // Validate required fields
      const vin = String(vehicle.vin ?? '').trim();
      const model = String(vehicle.model ?? '').trim();

      if (!vin || vin.length < 10 || !model) {
        skipped++;
        errors.push({ row: i + 1, reason: !vin || vin.length < 10 ? 'VIN missing or < 10 chars' : 'Model missing' });
        continue;
      }

      vehicle.id           = makeVehicleId(nextNum++);
      vehicle.arrival_date = vehicle.arrival_date || today;
      vehicles.push(vehicle);
    }

    console.log(`Parsed ${vehicles.length} valid vehicles, ${skipped} skipped`);

    // 5. Batch insert into Supabase
    let importedCount = 0;

    for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
      const batch = vehicles.slice(i, i + BATCH_SIZE);

      const { error } = await sb.from('vehicles').insert(batch);
      if (error) {
        console.error(`Batch insert error at offset ${i}:`, error);
        errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: error.message });
        continue;
      }

      importedCount += batch.length;

      // Seed templates for each vehicle in the batch
      await Promise.all(batch.map(v => seedTemplates(v.id).catch(err => {
        console.error(`Template seed error for ${v.id}:`, err);
        errors.push({ vehicleId: v.id, error: `Template seed failed: ${err.message}` });
      })));
    }

    // 6. Update import log
    await updateImportLog(logId, {
      status: 'done',
      total_rows: rawData.length - 1,
      imported: importedCount,
      skipped,
      extra_columns: extraColumnNames,
      error_log: errors.length > 0 ? errors : null,
    });

    // 7. Tag S3 object as processed
    await tagS3Object(bucket, key, {
      'import-status':  'done',
      'import-count':   String(importedCount),
      'import-skipped': String(skipped),
      'import-log-id':  logId || '',
    });

    console.log(`Import complete: ${importedCount} imported, ${skipped} skipped`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        importId:     logId,
        imported:     importedCount,
        skipped,
        extraColumns: extraColumnNames,
        errors:       errors.length > 0 ? errors : undefined,
      }),
    };

  } catch (err) {
    console.error('Import failed:', err);
    await updateImportLog(logId, {
      status: 'error',
      error_log: { message: err.message, stack: err.stack },
    });
    await tagS3Object(bucket, key, { 'import-status': 'error', 'import-error': err.message.slice(0, 200) });

    return { statusCode: 500, body: `Import failed: ${err.message}` };
  }
}
