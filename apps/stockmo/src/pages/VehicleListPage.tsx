import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Stage } from '../hooks/useVehicles';

interface VehicleSummary {
  id:              string;
  make:            string;
  model:           string;
  year:            number;
  color:           string;
  stage:           Stage;
  arrival_date:    string | null;
  cover_photo_url: string | null;
}

const STAGE_LABELS: Record<Stage, string> = {
  port: 'Port', pdi: 'PDI', stock: 'Stock',
  ready: 'Ready', released: 'Released', hold: 'Hold',
};

const STAGE_COLORS: Record<Stage, string> = {
  port:     'bg-blue-100 text-blue-700',
  pdi:      'bg-amber-100 text-amber-700',
  stock:    'bg-purple-100 text-purple-700',
  ready:    'bg-green-100 text-green-700',
  released: 'bg-[#F5F5F5] text-[#8A8FA3]',
  hold:     'bg-red-100 text-[#D0112B]',
};

type StageFilter = Stage | 'all';
const STAGE_FILTERS: StageFilter[] = ['all', 'port', 'pdi', 'stock', 'ready', 'released', 'hold'];

export function VehicleListPage({ onBack, onSelect, onAdd }: {
  onBack:   () => void;
  onSelect: (vehicleId: string, vehicleLabel: string) => void;
  onAdd:    () => void;
}) {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<StageFilter>('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('id, make, model, year, color, stage, arrival_date, cover_photo_url')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setVehicles(data as VehicleSummary[]);
        setLoading(false);
      });
  }, []);

  const counts: Partial<Record<StageFilter, number>> = { all: vehicles.length };
  for (const v of vehicles) counts[v.stage] = (counts[v.stage] ?? 0) + 1;

  const filtered = vehicles.filter(v => {
    if (filter !== 'all' && v.stage !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return v.id.toLowerCase().includes(q) ||
             v.model.toLowerCase().includes(q) ||
             v.color.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Header */}
      <div className="bg-[#D0112B] px-4 pt-12 pb-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="opacity-80">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold flex-1">Fleet</h1>
          <button onClick={onAdd} className="bg-white/20 rounded-full p-2 active:bg-white/30">
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-white/60 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ID, model, color…"
            className="w-full bg-white/20 text-white placeholder:text-white/60 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      {/* Stage filter pills */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {STAGE_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              filter === s
                ? 'bg-[#D0112B] text-white border-[#D0112B]'
                : 'bg-white text-[#8A8FA3] border-[#E8E8EE]'
            }`}
          >
            {s === 'all' ? 'All' : STAGE_LABELS[s]}
            {counts[s] ? ` (${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Vehicle list */}
      <div className="flex-1 px-4 pb-8 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-[#8A8FA3] text-sm">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="material-symbols-outlined text-[#C4C7D0] text-5xl">garage</span>
            <p className="text-[#8A8FA3] text-sm">
              {search ? 'No vehicles match your search.' : 'No vehicles yet.'}
            </p>
            {!search && (
              <button
                onClick={onAdd}
                className="mt-2 bg-[#D0112B] text-white rounded-full px-6 py-2.5 text-sm font-semibold"
              >
                Add First Vehicle
              </button>
            )}
          </div>
        ) : (
          filtered.map(v => (
            <button
              key={v.id}
              onClick={() => onSelect(v.id, `${v.id} — ${v.year} ${v.make} ${v.model}`)}
              className="w-full bg-white rounded-[20px] p-4 shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            >
              {/* Cover photo or placeholder */}
              <div className="w-14 h-14 rounded-xl bg-[#F5F5F5] flex-shrink-0 overflow-hidden flex items-center justify-center">
                {v.cover_photo_url
                  ? <img src={v.cover_photo_url} alt={v.model} className="w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-[#C4C7D0] text-2xl">directions_car</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-[#8A8FA3]">{v.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STAGE_COLORS[v.stage]}`}>
                    {STAGE_LABELS[v.stage]}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#1A1A2E] truncate">{v.year} {v.make} {v.model}</p>
                <p className="text-xs text-[#8A8FA3]">{v.color}</p>
              </div>
              <span className="material-symbols-outlined text-[#C4C7D0]">chevron_right</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
