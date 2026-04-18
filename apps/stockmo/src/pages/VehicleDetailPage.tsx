import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useVehicles, type Stage } from '../hooks/useVehicles';
import type { ChecklistType } from './ChecklistPage';

const STAGE_ORDER: Stage[] = ['port', 'pdi', 'stock', 'ready', 'released'];

const STAGE_LABELS: Record<Stage, string> = {
  port: 'Port', pdi: 'PDI', stock: 'Stock',
  ready: 'Ready', released: 'Released', hold: 'Hold',
};

const NEXT_STAGE: Partial<Record<Stage, Stage>> = {
  port:  'pdi',
  pdi:   'stock',
  stock: 'ready',
  ready: 'released',
};

interface HistoryRow {
  id:         string;
  action:     string;
  stage_from: string | null;
  stage_to:   string | null;
  note:       string | null;
  created_at: string;
}

export function VehicleDetailPage({ vehicleId, onBack, onOpenChecklist, isAdmin }: {
  vehicleId:       string;
  onBack:          () => void;
  onOpenChecklist: (type: ChecklistType, vehicleLabel: string) => void;
  isAdmin:         boolean;
}) {
  const { vehicles, advanceStage, updateVehicle, loading: vehiclesLoading } = useVehicles();
  const [history, setHistory]         = useState<HistoryRow[]>([]);
  const [advancing, setAdvancing]     = useState(false);
  const [advanceError, setAdvanceError] = useState('');
  const [location, setLocation]       = useState('');
  const [locationSaving, setLocationSaving] = useState(false);

  const vehicle = vehicles.find(v => v.id === vehicleId);

  // Sync local location state when vehicle loads
  useEffect(() => {
    if (vehicle) setLocation(vehicle.location ?? '');
  }, [vehicle?.location]);

  useEffect(() => {
    supabase
      .from('vehicle_history')
      .select('id, action, stage_from, stage_to, note, created_at')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setHistory(data as HistoryRow[]); });
  }, [vehicleId]);

  async function handleLocationSave() {
    if (!vehicle || location === (vehicle.location ?? '')) return;
    setLocationSaving(true);
    await updateVehicle(vehicleId, { location: location.trim() || null });
    setLocationSaving(false);
  }

  async function handleAdvance() {
    if (!vehicle) return;
    const next = NEXT_STAGE[vehicle.stage];
    if (!next) return;
    setAdvancing(true);
    setAdvanceError('');
    const { error } = await advanceStage(vehicleId, next);
    if (error) setAdvanceError(error);
    setAdvancing(false);
  }

  if (vehiclesLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <span className="text-[#8A8FA3] text-sm">Loading…</span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-[#C4C7D0] text-5xl">directions_car</span>
        <p className="text-[#8A8FA3] text-sm">Vehicle not found.</p>
        <button onClick={onBack} className="text-[#D0112B] text-sm font-semibold">Go Back</button>
      </div>
    );
  }

  const nextStage   = NEXT_STAGE[vehicle.stage];
  const stageIndex  = STAGE_ORDER.indexOf(vehicle.stage as Stage);
  const vehicleLabel = `${vehicle.id} — ${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const details = [
    { label: 'VIN',     value: vehicle.vin },
    { label: 'Lot',     value: vehicle.lot },
    { label: 'Dealer',  value: vehicle.dealer },
    { label: 'Arrival', value: vehicle.arrival_date },
    { label: 'Notes',   value: vehicle.notes },
  ].filter(r => r.value);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Cover photo / hero */}
      <div className="relative">
        <div className="h-52 bg-[#1A1A2E] flex items-center justify-center overflow-hidden">
          {vehicle.cover_photo_url
            ? <img src={vehicle.cover_photo_url} alt={vehicle.model} className="w-full h-full object-cover" />
            : <span className="material-symbols-outlined text-white/10 text-8xl">directions_car</span>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <button
          onClick={onBack}
          className="absolute top-12 left-4 bg-black/40 rounded-full p-2 text-white backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        {/* Identity overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-xs font-bold opacity-60">{vehicle.id}</p>
          <h1 className="text-xl font-bold leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-sm opacity-70">{vehicle.color} · {vehicle.engine} · {vehicle.fuel}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-12">
        {/* Stage + advance */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide">Stage</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              vehicle.stage === 'hold'
                ? 'bg-red-100 text-[#D0112B]'
                : vehicle.stage === 'released'
                ? 'bg-[#F5F5F5] text-[#8A8FA3]'
                : 'bg-[#D0112B]/10 text-[#D0112B]'
            }`}>
              {STAGE_LABELS[vehicle.stage]}
            </span>
          </div>

          {vehicle.stage !== 'hold' && (
            <div className="mb-4">
              <div className="flex gap-1 mb-1.5">
                {STAGE_ORDER.map((s, i) => (
                  <div
                    key={s}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      i <= stageIndex ? 'bg-[#D0112B]' : 'bg-[#E8E8EE]'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between">
                {STAGE_ORDER.map(s => (
                  <span key={s} className={`text-[10px] ${
                    s === vehicle.stage ? 'text-[#D0112B] font-bold' : 'text-[#C4C7D0]'
                  }`}>
                    {STAGE_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isAdmin && nextStage && (
            <>
              {advanceError && (
                <p className="text-xs text-[#D0112B] mb-2">{advanceError}</p>
              )}
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="w-full bg-[#D0112B] text-white rounded-full py-3 text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {advancing ? 'Advancing…' : `Advance to ${STAGE_LABELS[nextStage]}`}
              </button>
            </>
          )}

          {isAdmin && vehicle.stage === 'released' && (
            <p className="text-xs text-center text-[#8A8FA3] pt-1">Vehicle has been released.</p>
          )}
        </div>

        {/* Inspections */}
        <div className="bg-white rounded-[20px] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#F5F5F5]">
            <p className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide">Inspections</p>
          </div>
          {([
            { type: 'pdi'      as ChecklistType, label: 'PDI Checklist',    icon: 'fact_check', color: '#D0112B' },
            { type: 'stockyard'as ChecklistType, label: 'Stockyard Maint.', icon: 'build',      color: '#1A1A2E' },
            { type: 'final'    as ChecklistType, label: 'Final Check',      icon: 'verified',   color: '#2D9E5F' },
          ]).map(({ type, label, icon, color }) => (
            <button
              key={type}
              onClick={() => onOpenChecklist(type, vehicleLabel)}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-[#F5F5F5] last:border-0 active:bg-[#F5F5F5] transition-colors"
            >
              <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
              <span className="flex-1 text-sm font-medium text-[#1A1A2E] text-left">{label}</span>
              <span className="material-symbols-outlined text-[#C4C7D0]">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Location (editable by everyone) */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide mb-2">Location</p>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8A8FA3] text-base">location_on</span>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onBlur={handleLocationSave}
              placeholder="e.g. Row B, Slot 04"
              className="flex-1 text-sm text-[#1A1A2E] bg-transparent outline-none placeholder:text-[#C4C7D0]"
            />
            {locationSaving && (
              <span className="text-xs text-[#8A8FA3]">Saving…</span>
            )}
          </div>
        </div>

        {/* Details */}
        {details.length > 0 && (
          <div className="bg-white rounded-[20px] p-4 shadow-sm">
            <p className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide mb-3">Details</p>
            <div className="space-y-2">
              {details.map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-xs text-[#8A8FA3] w-16 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-xs text-[#1A1A2E] flex-1 break-words">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-[20px] p-4 shadow-sm">
            <p className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide mb-3">History</p>
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D0112B] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#1A1A2E]">
                      {h.stage_from && h.stage_to
                        ? `${STAGE_LABELS[h.stage_from as Stage] ?? h.stage_from} → ${STAGE_LABELS[h.stage_to as Stage] ?? h.stage_to}`
                        : h.action.replace(/_/g, ' ')}
                    </p>
                    {h.note && <p className="text-xs text-[#8A8FA3] mt-0.5">{h.note}</p>}
                    <p className="text-[10px] text-[#C4C7D0] mt-0.5">
                      {new Date(h.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
