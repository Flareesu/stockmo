import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Repair Table Page (Admin) ─────────────────────────────────────────────────
// Shows all vehicles with open issues, linked to admin_alerts.
// Admin can create/edit repair entries: person responsible, contact, status.
// Status dropdown: Repairing | Done | Hold

interface RepairRow {
  id:                 string;
  alert_id:           string;
  vehicle_id:         string;
  person_responsible: string;
  contact:            string;
  status:             'Repairing' | 'Done' | 'Hold';
  notes:              string;
  created_at:         string;
  updated_at:         string;
  admin_alerts: {
    source:     string;
    check_name: string;
    note:       string;
    resolved:   boolean;
    created_at: string;
  };
}

interface UnlinkedAlert {
  id:           string;
  vehicle_id:   string;
  source:       string;
  check_name:   string;
  note:         string;
  created_at:   string;
}

type StatusFilter = 'All' | 'Repairing' | 'Done' | 'Hold';

const STATUS_COLORS: Record<string, string> = {
  Repairing: 'bg-amber-100 text-amber-800',
  Done:      'bg-green-100 text-green-800',
  Hold:      'bg-[#F5F5F5] text-[#8A8FA3]',
};

interface Props { onBack: () => void; }

export function RepairTablePage({ onBack }: Props) {
  const [repairs, setRepairs]           = useState<RepairRow[]>([]);
  const [unlinked, setUnlinked]         = useState<UnlinkedAlert[]>([]);
  const [filter, setFilter]             = useState<StatusFilter>('All');
  const [loading, setLoading]           = useState(true);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [newRepairAlertId, setNewRepairAlertId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [repairsRes, alertsRes] = await Promise.all([
      supabase
        .from('repairs')
        .select('*, admin_alerts(source, check_name, note, resolved, created_at)')
        .order('updated_at', { ascending: false }),
      supabase
        .from('admin_alerts')
        .select('id, vehicle_id, source, check_name, note, created_at')
        .eq('resolved', false)
        .order('created_at', { ascending: false }),
    ]);

    const repairs = repairsRes.error ? [] : (repairsRes.data ?? []);
    const alerts  = alertsRes.error  ? [] : (alertsRes.data  ?? []);

    const existingAlertIds = new Set(repairs.map((r: RepairRow) => r.alert_id));
    setRepairs(repairs);
    setUnlinked(alerts.filter((a: UnlinkedAlert) => !existingAlertIds.has(a.id)));
    setLoading(false);
  }

  async function updateStatus(id: string, status: 'Repairing' | 'Done' | 'Hold') {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await supabase.from('repairs').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  }

  const filtered = filter === 'All' ? repairs : repairs.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-[#1A1A2E]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-[#1A1A2E]">Repairs</h1>
          {unlinked.length > 0 && (
            <span className="ml-auto text-xs bg-[#D0112B] text-white px-2 py-1 rounded-full">
              {unlinked.length} new
            </span>
          )}
        </div>
        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['All','Repairing','Done','Hold'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filter === s
                  ? 'bg-[#D0112B] text-white border-[#D0112B]'
                  : 'bg-white text-[#8A8FA3] border-[#E8E8EE]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-8">
        {/* Unlinked alerts — new issues without a repair entry */}
        {unlinked.map(alert => (
          <div key={alert.id} className="bg-red-50 border border-red-200 rounded-[20px] p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-xs font-semibold text-[#D0112B] uppercase tracking-wide">New Issue</p>
                <p className="text-sm font-bold text-[#1A1A2E]">{alert.vehicle_id}</p>
              </div>
              <span className="text-xs bg-[#D0112B] text-white px-2 py-0.5 rounded-full capitalize">{alert.source}</span>
            </div>
            <p className="text-sm text-[#1A1A2E] mb-1">{alert.check_name}</p>
            {alert.note && <p className="text-xs text-[#8A8FA3] mb-3">{alert.note}</p>}
            <button
              onClick={() => setNewRepairAlertId(alert.id)}
              className="text-xs bg-[#D0112B] text-white rounded-full px-4 py-2 font-semibold"
            >
              Create Repair Entry
            </button>
          </div>
        ))}

        {/* Existing repairs */}
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="text-[#8A8FA3] text-sm">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-[#8A8FA3] text-sm">No repairs found.</div>
        ) : (
          filtered.map(repair => (
            <RepairCard
              key={repair.id}
              repair={repair}
              isEditing={editingId === repair.id}
              onEdit={() => setEditingId(repair.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={() => { setEditingId(null); load(); }}
              onStatusChange={(s) => updateStatus(repair.id, s)}
            />
          ))
        )}
      </div>

      {/* New Repair Modal */}
      {newRepairAlertId && (
        <NewRepairModal
          alertId={newRepairAlertId}
          onClose={() => setNewRepairAlertId(null)}
          onSaved={() => { setNewRepairAlertId(null); load(); }}
        />
      )}
    </div>
  );
}

// ── Repair Card ────────────────────────────────────────────────────────────────

function RepairCard({ repair, isEditing, onEdit, onCancelEdit, onSave, onStatusChange }: {
  repair: RepairRow;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onStatusChange: (s: 'Repairing' | 'Done' | 'Hold') => void;
}) {
  const [form, setForm] = useState({
    person_responsible: repair.person_responsible,
    contact:            repair.contact,
    notes:              repair.notes,
  });

  async function save() {
    await supabase.from('repairs').update({
      ...form,
      updated_at: new Date().toISOString(),
    }).eq('id', repair.id);
    onSave();
  }

  const alert = repair.admin_alerts;

  return (
    <div className="bg-white rounded-[20px] p-4 shadow-sm">
      {/* Vehicle + issue info */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs text-[#8A8FA3] capitalize">{alert?.source ?? ''} issue</p>
          <p className="text-base font-bold text-[#1A1A2E]">{repair.vehicle_id}</p>
          <p className="text-sm text-[#1A1A2E]">{alert?.check_name}</p>
          {alert?.note && <p className="text-xs text-[#8A8FA3] mt-0.5">{alert.note}</p>}
        </div>
        {/* Status dropdown */}
        <select
          value={repair.status}
          onChange={e => onStatusChange(e.target.value as 'Repairing' | 'Done' | 'Hold')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${STATUS_COLORS[repair.status]}`}
        >
          <option value="Repairing">Repairing</option>
          <option value="Done">Done</option>
          <option value="Hold">Hold</option>
        </select>
      </div>

      {/* Person responsible + contact */}
      {!isEditing ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[#1A1A2E]">
            <span className="material-symbols-outlined text-base text-[#8A8FA3]">person</span>
            {repair.person_responsible || <span className="text-[#8A8FA3]">Not assigned</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#1A1A2E]">
            <span className="material-symbols-outlined text-base text-[#8A8FA3]">call</span>
            {repair.contact || <span className="text-[#8A8FA3]">No contact</span>}
          </div>
          {repair.notes && <p className="text-xs text-[#8A8FA3] mt-1">{repair.notes}</p>}
          <button onClick={onEdit} className="text-xs text-[#D0112B] font-semibold mt-2">Edit</button>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          <input type="text" value={form.person_responsible}
            onChange={e => setForm(f => ({ ...f, person_responsible: e.target.value }))}
            placeholder="Person responsible" className="w-full border border-[#E8E8EE] rounded-xl px-3 py-2 text-sm" />
          <input type="text" value={form.contact}
            onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
            placeholder="Contact (phone / email)" className="w-full border border-[#E8E8EE] rounded-xl px-3 py-2 text-sm" />
          <textarea value={form.notes} rows={2}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes…" className="w-full border border-[#E8E8EE] rounded-xl px-3 py-2 text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={save} className="text-xs bg-[#D0112B] text-white rounded-full px-4 py-2 font-semibold">Save</button>
            <button onClick={onCancelEdit} className="text-xs text-[#8A8FA3] px-4 py-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Repair Modal ───────────────────────────────────────────────────────────

function NewRepairModal({ alertId, onClose, onSaved }: {
  alertId: string; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ person_responsible: '', contact: '', notes: '', vehicle_id: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('admin_alerts').select('vehicle_id').eq('id', alertId).single()
      .then(({ data }) => { if (data) setForm(f => ({ ...f, vehicle_id: data.vehicle_id })); });
  }, [alertId]);

  async function save() {
    if (!form.person_responsible.trim()) return;
    setLoading(true);
    await supabase.from('repairs').insert({
      alert_id:           alertId,
      vehicle_id:         form.vehicle_id,
      person_responsible: form.person_responsible.trim(),
      contact:            form.contact.trim(),
      notes:              form.notes.trim(),
      status:             'Repairing',
    });
    // Mark alert as part of a repair (not resolved yet)
    setLoading(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-[24px] p-6 space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A2E]">New Repair Entry</h2>
        <input type="text" value={form.person_responsible}
          onChange={e => setForm(f => ({ ...f, person_responsible: e.target.value }))}
          placeholder="Person responsible *" required
          className="w-full border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm" />
        <input type="text" value={form.contact}
          onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
          placeholder="Contact (phone / email)"
          className="w-full border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm" />
        <textarea value={form.notes} rows={2}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Notes…"
          className="w-full border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm resize-none" />
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={loading}
            className="flex-1 bg-[#D0112B] text-white rounded-full py-3 font-semibold text-sm disabled:opacity-50">
            {loading ? 'Saving…' : 'Create Entry'}
          </button>
          <button onClick={onClose} className="px-6 py-3 text-[#8A8FA3] text-sm font-semibold">Cancel</button>
        </div>
      </div>
    </div>
  );
}
