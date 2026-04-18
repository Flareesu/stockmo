import { supabase } from './supabase';

// ─── localStorage → Supabase Migration ────────────────────────────────────────
// Runs once on the first authenticated session.
// Reads stockmo_v4 key, maps camelCase → snake_case, upserts all data.
// Migrated 'na' states become 'pending' (na state is removed from schema).

const MIGRATED_KEY = 'stockmo_migrated_at';
const SOURCE_KEY   = 'stockmo_v4';

interface LocalVehicle {
  id:           string;
  vin?:         string;
  make?:        string;
  model?:       string;
  year?:        number;
  color?:       string;
  engine?:      string;
  fuel?:        string;
  lot?:         string;
  stage:        string;
  arrivalDate?: string;
  pdiDate?:     string;
  stockDate?:   string;
  finalDate?:   string;
  releaseDate?: string;
  dealer?:      string;
  notes?:       string;
  assignedTech?: string;
  pdiChecks?:   LocalCheck[];
  stockMaint?:  LocalMaint[];
  finalChecks?: LocalCheck[];
  history?:     string[];
}

interface LocalCheck {
  id:       string;
  section?: string;
  name?:    string;
  priority?: string;
  state?:   string;
  note?:    string;
}

interface LocalMaint {
  id:        string;
  name?:     string;
  freq?:     number;
  priority?: string;
  lastDone?: string;
  nextDue?:  string;
  note?:     string;
}

/** Map old 'na' state to 'pending'. */
function mapState(s?: string): 'pending' | 'done' | 'issue' {
  if (s === 'done')  return 'done';
  if (s === 'issue') return 'issue';
  return 'pending'; // covers undefined, 'pending', and old 'na'
}

function mapPriority(p?: string): 'high' | 'med' | 'low' {
  if (p === 'high') return 'high';
  if (p === 'med')  return 'med';
  return 'low';
}

export function hasMigrated(): boolean {
  return !!localStorage.getItem(MIGRATED_KEY);
}

export function hasLocalData(): boolean {
  return !!localStorage.getItem(SOURCE_KEY);
}

export async function migrateLocalStorageToSupabase(): Promise<{
  migrated: boolean;
  count:    number;
  errors:   string[];
}> {
  const raw = localStorage.getItem(SOURCE_KEY);
  if (!raw) return { migrated: false, count: 0, errors: [] };

  let localVehicles: LocalVehicle[];
  try {
    localVehicles = JSON.parse(raw);
  } catch {
    return { migrated: false, count: 0, errors: ['Failed to parse localStorage data'] };
  }

  const errors: string[] = [];
  let count = 0;

  for (const lv of localVehicles) {
    try {
      // ── Upsert vehicle ─────────────────────────────────────────────────────
      const { error: vErr } = await supabase.from('vehicles').upsert({
        id:           lv.id,
        vin:          lv.vin          ?? '',
        make:         lv.make         ?? 'GAC',
        model:        lv.model        ?? 'Unknown',
        year:         lv.year         ?? 2024,
        color:        lv.color        ?? 'Unknown',
        engine:       lv.engine       ?? '1.5T',
        fuel:         lv.fuel         ?? 'Gasoline',
        lot:          lv.lot          ?? null,
        stage:        lv.stage        ?? 'port',
        arrival_date: lv.arrivalDate  ?? null,
        pdi_date:     lv.pdiDate      ?? null,
        stock_date:   lv.stockDate    ?? null,
        final_date:   lv.finalDate    ?? null,
        release_date: lv.releaseDate  ?? null,
        dealer:       lv.dealer       ?? null,
        notes:        lv.notes        ?? null,
      }, { onConflict: 'id', ignoreDuplicates: true });

      if (vErr) { errors.push(`Vehicle ${lv.id}: ${vErr.message}`); continue; }

      // ── Upsert PDI checks ─────────────────────────────────────────────────
      if (lv.pdiChecks?.length) {
        const rows = lv.pdiChecks.map(c => ({
          vehicle_id: lv.id,
          item_id:    c.id,
          section:    c.section ?? 'Uncategorized',
          name:       c.name    ?? c.id,
          priority:   mapPriority(c.priority),
          state:      mapState(c.state),
          note:       c.note   ?? '',
        }));
        const { error } = await supabase.from('pdi_checks').upsert(rows,
          { onConflict: 'vehicle_id,item_id', ignoreDuplicates: true });
        if (error) errors.push(`PDI ${lv.id}: ${error.message}`);
      }

      // ── Upsert stock maintenance ───────────────────────────────────────────
      if (lv.stockMaint?.length) {
        const rows = lv.stockMaint.map(m => ({
          vehicle_id: lv.id,
          task_id:    m.id,
          name:       m.name     ?? m.id,
          freq_days:  m.freq     ?? 7,
          priority:   mapPriority(m.priority),
          state:      mapState(),   // maintenance doesn't have state in old schema
          last_done:  m.lastDone ?? null,
          next_due:   m.nextDue  ?? new Date().toISOString().split('T')[0],
          note:       m.note     ?? '',
        }));
        const { error } = await supabase.from('stock_maintenance').upsert(rows,
          { onConflict: 'vehicle_id,task_id', ignoreDuplicates: true });
        if (error) errors.push(`Maint ${lv.id}: ${error.message}`);
      }

      // ── Upsert final checks ───────────────────────────────────────────────
      if (lv.finalChecks?.length) {
        const rows = lv.finalChecks.map(c => ({
          vehicle_id: lv.id,
          item_id:    c.id,
          section:    c.section ?? 'Uncategorized',
          name:       c.name    ?? c.id,
          priority:   mapPriority(c.priority),
          state:      mapState(c.state),
          note:       c.note   ?? '',
        }));
        const { error } = await supabase.from('final_checks').upsert(rows,
          { onConflict: 'vehicle_id,item_id', ignoreDuplicates: true });
        if (error) errors.push(`Final ${lv.id}: ${error.message}`);
      }

      // ── Migrate history strings as history entries ─────────────────────────
      if (lv.history?.length) {
        const histRows = lv.history.map(entry => ({
          vehicle_id: lv.id,
          action:     'migrated_note',
          note:       entry,
        }));
        await supabase.from('vehicle_history').insert(histRows);
      }

      count++;
    } catch (err) {
      errors.push(`Vehicle ${lv.id}: ${String(err)}`);
    }
  }

  // Mark migration complete
  localStorage.setItem(MIGRATED_KEY, new Date().toISOString());

  return { migrated: true, count, errors };
}
