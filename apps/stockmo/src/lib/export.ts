import { supabase } from './supabase';

// ─── Export Reports ───────────────────────────────────────────────────────────
// Generates CSV downloads. Excel export uses SheetJS (loaded from CDN if available).
// All exports are client-side — no server needed.

type Row = Record<string, unknown>;

// ─── CSV utilities ─────────────────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Prefix formula-starting chars to prevent CSV injection in Excel
  const safe = /^[=+\-@\t\r]/.test(str) ? `\t${str}` : str;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function toCSV(rows: Row[], columns: string[]): string {
  const header = columns.join(',');
  const body   = rows.map(r => columns.map(c => escapeCSV(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

function downloadBlob(content: string, filename: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

// ─── Vehicle Report ────────────────────────────────────────────────────────────

export async function exportVehicleReport(): Promise<void> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, vin, make, model, year, color, engine, fuel, lot, location, stage, arrival_date, pdi_date, stock_date, final_date, release_date, dealer, notes, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const cols = ['id','vin','make','model','year','color','engine','fuel','lot','location','stage','arrival_date','pdi_date','stock_date','final_date','release_date','dealer','notes','created_at'];
  downloadBlob(toCSV(data ?? [], cols), `stockmo-vehicles-${today()}.csv`);
}

// ─── Issue / Repair Report ─────────────────────────────────────────────────────

export async function exportIssueReport(): Promise<void> {
  const { data, error } = await supabase
    .from('repairs')
    .select(`
      id,
      status,
      person_responsible,
      contact,
      notes,
      created_at,
      updated_at,
      alert_id,
      admin_alerts (
        vehicle_id, source, check_name, note, resolved, created_at
      ),
      vehicles (id, model, stage)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows: Row[] = (data ?? []).map((r: Record<string, unknown>) => {
    const alert   = (r.admin_alerts as Record<string, unknown> | null) ?? {};
    const vehicle = (r.vehicles    as Record<string, unknown> | null) ?? {};
    return {
      repair_id:          r.id,
      vehicle_id:         alert.vehicle_id,
      vehicle_model:      vehicle.model,
      vehicle_stage:      vehicle.stage,
      issue_source:       alert.source,
      issue_name:         alert.check_name,
      issue_note:         alert.note,
      repair_status:      r.status,
      person_responsible: r.person_responsible,
      contact:            r.contact,
      repair_notes:       r.notes,
      resolved:           alert.resolved,
      issue_created:      alert.created_at,
      repair_updated:     r.updated_at,
    };
  });

  const cols = ['repair_id','vehicle_id','vehicle_model','vehicle_stage','issue_source','issue_name','issue_note','repair_status','person_responsible','contact','repair_notes','resolved','issue_created','repair_updated'];
  downloadBlob(toCSV(rows, cols), `stockmo-issues-${today()}.csv`);
}

// ─── Technician Report ─────────────────────────────────────────────────────────

export async function exportTechnicianReport(): Promise<void> {
  const { data: techs, error } = await supabase
    .from('technicians')
    .select('id, name, initials, role, online, created_at');

  if (error) throw error;

  // Count assignments and history entries per technician
  const { data: assignments } = await supabase
    .from('vehicle_assignments')
    .select('tech_id');

  const { data: history } = await supabase
    .from('vehicle_history')
    .select('actor_id');

  const assignCount: Record<string, number> = {};
  const historyCount: Record<string, number> = {};
  for (const a of assignments ?? []) {
    assignCount[a.tech_id] = (assignCount[a.tech_id] ?? 0) + 1;
  }
  for (const h of history ?? []) {
    if (h.actor_id) historyCount[h.actor_id] = (historyCount[h.actor_id] ?? 0) + 1;
  }

  const rows: Row[] = (techs ?? []).map((t: Row) => ({
    id:               t.id,
    name:             t.name,
    initials:         t.initials,
    role:             t.role,
    online:           t.online,
    vehicles_assigned: assignCount[t.id as string] ?? 0,
    activity_count:   historyCount[t.id as string] ?? 0,
    created_at:       t.created_at,
  }));

  const cols = ['id','name','initials','role','online','vehicles_assigned','activity_count','created_at'];
  downloadBlob(toCSV(rows, cols), `stockmo-technicians-${today()}.csv`);
}

// ─── Statistics Report ────────────────────────────────────────────────────────

export async function exportStatisticsReport(): Promise<void> {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('stage, arrival_date, pdi_date, stock_date, final_date, release_date');

  const stageCounts: Record<string, number> = {};
  const stageDurations: Record<string, number[]> = {};

  for (const v of vehicles ?? []) {
    stageCounts[v.stage] = (stageCounts[v.stage] ?? 0) + 1;

    // Calculate days in PDI stage
    if (v.pdi_date && v.stock_date) {
      const days = daysBetween(v.pdi_date, v.stock_date);
      (stageDurations['pdi'] ??= []).push(days);
    }
    // Days in stockyard
    if (v.stock_date && v.final_date) {
      const days = daysBetween(v.stock_date, v.final_date);
      (stageDurations['stock'] ??= []).push(days);
    }
  }

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const rows: Row[] = [
    ...Object.entries(stageCounts).map(([stage, count]) => ({
      metric: `vehicles_in_${stage}`,
      value: count,
    })),
    { metric: 'avg_days_in_pdi',   value: avg(stageDurations['pdi']   ?? []) },
    { metric: 'avg_days_in_stock', value: avg(stageDurations['stock'] ?? []) },
    { metric: 'total_vehicles',    value: vehicles?.length ?? 0 },
  ];

  downloadBlob(toCSV(rows, ['metric','value']), `stockmo-statistics-${today()}.csv`);
}

// ─── History Report ───────────────────────────────────────────────────────────

export async function exportHistoryReport(): Promise<void> {
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('id, vehicle_id, action, stage_from, stage_to, note, created_at, actor_id')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const cols = ['id','vehicle_id','action','stage_from','stage_to','note','actor_id','created_at'];
  downloadBlob(toCSV(data ?? [], cols), `stockmo-history-${today()}.csv`);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}
