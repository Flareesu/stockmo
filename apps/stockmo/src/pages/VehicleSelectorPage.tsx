import { useState } from 'react';
import { useVehicles, type Stage } from '../hooks/useVehicles';
import type { ChecklistType } from './ChecklistPage';

const STAGE_LABELS: Record<Stage, string> = {
  port: 'Port', pdi: 'PDI', stock: 'Stock',
  ready: 'Ready', released: 'Released', hold: 'Hold',
};

// Stages most relevant for each checklist type
const RELEVANT_STAGES: Record<ChecklistType, Stage[]> = {
  pdi:      ['pdi'],
  stockyard:['stock', 'hold'],
  final:    ['ready'],
};

const CHECKLIST_LABELS: Record<ChecklistType, { title: string; icon: string; color: string }> = {
  pdi:      { title: 'PDI Checklist',    icon: 'fact_check', color: '#D0112B' },
  stockyard:{ title: 'Stockyard Maint.', icon: 'build',      color: '#1A1A2E' },
  final:    { title: 'Final Check',      icon: 'verified',   color: '#2D9E5F' },
};

export function VehicleSelectorPage({ checklistType, onBack, onSelect }: {
  checklistType: ChecklistType;
  onBack:        () => void;
  onSelect:      (vehicleId: string, vehicleLabel: string) => void;
}) {
  const { vehicles, loading } = useVehicles();
  const [search, setSearch]   = useState('');

  const { title, icon, color } = CHECKLIST_LABELS[checklistType];
  const relevantStages = RELEVANT_STAGES[checklistType];

  const filtered = vehicles
    .filter(v => {
      if (!search) return true;
      const q = search.toLowerCase();
      return v.id.toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      // Relevant-stage vehicles float to the top
      const aRel = relevantStages.includes(a.stage) ? 0 : 1;
      const bRel = relevantStages.includes(b.stage) ? 0 : 1;
      return aRel - bRel;
    });

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 text-white" style={{ backgroundColor: '#1A1A2E' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="opacity-70">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
            <div>
              <h1 className="text-base font-bold leading-tight">{title}</h1>
              <p className="text-xs opacity-50">Select a vehicle</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-white/40 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID or model…"
            className="w-full bg-white/10 text-white placeholder:text-white/40 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      {/* Hint */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs text-[#8A8FA3]">
          Highlighted vehicles are in the{' '}
          {relevantStages.map(s => STAGE_LABELS[s]).join(' / ')} stage.
        </p>
      </div>

      {/* Vehicle list */}
      <div className="px-4 py-2 space-y-2 pb-10">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-[#8A8FA3] text-sm">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[#8A8FA3] text-sm">No vehicles found.</div>
        ) : (
          filtered.map(v => {
            const isRelevant = relevantStages.includes(v.stage);
            return (
              <button
                key={v.id}
                onClick={() => onSelect(v.id, `${v.id} — ${v.year} ${v.make} ${v.model}`)}
                className={`w-full bg-white rounded-[20px] p-4 shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-transform ${!isRelevant ? 'opacity-40' : ''}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: isRelevant ? `${color}15` : '#F5F5F5' }}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: isRelevant ? color : '#C4C7D0' }}
                  >
                    directions_car
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#8A8FA3]">{v.id}</p>
                  <p className="text-sm font-bold text-[#1A1A2E] truncate">{v.year} {v.make} {v.model}</p>
                </div>
                <span className="text-xs font-semibold text-[#8A8FA3] bg-[#F5F5F5] px-2 py-1 rounded-full flex-shrink-0">
                  {STAGE_LABELS[v.stage]}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
