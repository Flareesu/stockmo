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

// ─── Stage resolution ────────────────────────────────────────────────────────

/**
 * Converts a raw inventory status string (e.g. "In-Transit", "Available for Delivery")
 * into a pipeline_stages slug. If the slug doesn't exist in the DB, a new stage row
 * is created automatically. Returns a Map<rawStatusLower → slug>.
 */
async function resolveVehicleStages(rawStatuses) {
  // Normalise a raw label → URL-safe slug
  const toSlug = str =>
    str.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  // Build unique slug → original label map
  const needed = new Map(); // slug → display name (title-cased)
  for (const raw of rawStatuses) {
    if (!raw) continue;
    const slug = toSlug(raw);
    if (!needed.has(slug)) {
      // Title-case the raw label for the display name
      const name = raw.trim().replace(/\b\w/g, c => c.toUpperCase());
      needed.set(slug, name);
    }
  }

  // Fetch all existing pipeline_stages
  const { data: existing } = await sb.from('pipeline_stages').select('slug, ord');
  const existingSlugs = new Set((existing || []).map(s => s.slug));
  const maxOrd = (existing || []).reduce((m, s) => Math.max(m, s.ord || 0), 0);

  // Create missing stages
  const missing = [...needed.entries()].filter(([slug]) => !existingSlugs.has(slug));
  if (missing.length > 0) {
    const DEFAULT_COLORS = ['#6b7280','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EF4444','#059669','#EC4899'];
    const newRows = missing.map(([slug, name], i) => ({
      slug,
      name,
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      ord:   maxOrd + i + 1,
      active: true,
    }));
    const { error } = await sb.from('pipeline_stages').insert(newRows);
    if (error) console.error('Auto-create pipeline_stages error:', error);
    else console.log(`Auto-created ${newRows.length} pipeline stage(s):`, newRows.map(r => r.slug).join(', '));
  }

  // Return lookup: rawStatusLower → slug
  const lookup = new Map();
  for (const raw of rawStatuses) {
    if (!raw) continue;
    lookup.set(raw.trim().toLowerCase(), toSlug(raw));
  }
  return lookup;
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

    // 4b. Resolve inventory status → pipeline_stages slug (auto-create missing stages)
    const rawStages = vehicles.map(v => v.stage).filter(Boolean);
    const stageSlugMap = rawStages.length > 0 ? await resolveVehicleStages(rawStages) : new Map();

    // Fallback slug for vehicles with no inventory status column in the sheet
    let fallbackSlug = null;
    if (vehicles.some(v => !v.stage)) {
      const { data: firstStage } = await sb
        .from('pipeline_stages').select('slug').eq('active', true).order('ord').limit(1).single();
      fallbackSlug = firstStage?.slug || null;
    }

    // Apply resolved slugs back to vehicles
    for (const v of vehicles) {
      if (v.stage) {
        v.stage = stageSlugMap.get(v.stage.trim().toLowerCase()) || v.stage;
      } else {
        v.stage = fallbackSlug;
      }
    }

    // 5. Deduplicate: split parsed vehicles into new (INSERT) vs existing (UPDATE)
    const allVins = vehicles.map(v => v.vin).filter(Boolean);
    let existingByVin = {};
    if (allVins.length > 0) {
      // Fetch in chunks to avoid query length limits
      for (let ci = 0; ci < allVins.length; ci += 100) {
        const { data: chunk } = await sb
          .from('vehicles')
          .select('id,vin,model,variant,color,engine,fuel,lot,dealer,notes,extra_fields')
          .in('vin', allVins.slice(ci, ci + 100));
        (chunk || []).forEach(r => { existingByVin[r.vin] = r; });
      }
    }

    const UPDATABLE_FIELDS = ['model', 'variant', 'color', 'engine', 'fuel', 'lot', 'dealer', 'notes', 'extra_fields'];
    const toInsert = [];
    const toUpdate = []; // { id, changes }

    for (const v of vehicles) {
      const existing = existingByVin[v.vin];
      if (!existing) {
        toInsert.push(v);
      } else {
        const changes = {};
        for (const f of UPDATABLE_FIELDS) {
          if (v[f] !== undefined && String(v[f] ?? '') !== String(existing[f] ?? '')) {
            changes[f] = v[f];
          }
        }
        if (Object.keys(changes).length > 0) {
          toUpdate.push({ id: existing.id, changes });
        } else {
          skipped++; // identical row — skip
        }
      }
    }

    console.log(`Dedup: ${toInsert.length} new, ${toUpdate.length} changed, ${skipped} identical`);

    // 6a. Batch insert new vehicles + seed templates
    let importedCount = 0;

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);

      const { error } = await sb.from('vehicles').insert(batch);
      if (error) {
        console.error(`Batch insert error at offset ${i}:`, error);
        errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: error.message });
        continue;
      }

      importedCount += batch.length;

      // Seed templates only for newly inserted vehicles
      await Promise.all(batch.map(v => seedTemplates(v.id).catch(err => {
        console.error(`Template seed error for ${v.id}:`, err);
        errors.push({ vehicleId: v.id, error: `Template seed failed: ${err.message}` });
      })));
    }

    // 6b. Update changed vehicles (no template re-seed — existing check rows preserved)
    let updatedCount = 0;
    await Promise.all(toUpdate.map(({ id, changes }) =>
      sb.from('vehicles').update(changes).eq('id', id)
        .then(({ error }) => {
          if (!error) {
            updatedCount++;
          } else {
            console.error(`Update error for ${id}:`, error);
            errors.push({ vehicleId: id, error: `Update failed: ${error.message}` });
          }
        })
    ));

    console.log(`Import done: ${importedCount} inserted, ${updatedCount} updated`);

    // 7. Update import log
    await updateImportLog(logId, {
      status: 'done',
      total_rows: rawData.length - 1,
      imported: importedCount,
      skipped,
      extra_columns: extraColumnNames,
      error_log: errors.length > 0 ? { errors, updated: updatedCount } : { updated: updatedCount },
    });

    // 8. Tag S3 object as processed
    await tagS3Object(bucket, key, {
      'import-status':  'done',
      'import-count':   String(importedCount),
      'import-updated': String(updatedCount),
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
