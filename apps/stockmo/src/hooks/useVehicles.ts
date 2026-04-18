import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { makePdiChecks } from '../data/pdiTemplate';
import { makeFinalChecks } from '../data/finalTemplate';
import { makeMaintTasks } from '../data/maintTemplate';

// ─── Vehicles Hook ────────────────────────────────────────────────────────────
// Loads vehicles with all related data. Writes go to Supabase when online,
// queued to localStorage when offline.

export type Stage = 'port' | 'pdi' | 'stock' | 'ready' | 'released' | 'hold';

export interface Vehicle {
  id:              string;
  vin:             string;
  make:            string;
  model:           string;
  year:            number;
  color:           string;
  engine:          string;
  fuel:            string;
  lot:             string | null;
  location:        string | null;
  stage:           Stage;
  arrival_date:    string | null;
  pdi_date:        string | null;
  stock_date:      string | null;
  final_date:      string | null;
  release_date:    string | null;
  dealer:          string | null;
  notes:           string | null;
  cover_photo_url: string | null;
  created_at:      string;
  updated_at:      string;
}

const OFFLINE_QUEUE_KEY = 'stockmo_offline_queue_v1';
const VEHICLES_CACHE_KEY = 'stockmo_vehicles_cache_v1';

interface OfflineOp {
  type:      'update' | 'insert';
  table:     string;
  id?:       string;
  changes:   Record<string, unknown>;
  queued_at: number;
}

export function useVehicles() {
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isOnline, setIsOnline]   = useState(navigator.onLine);

  // Track online/offline
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  flushOfflineQueue(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Load on mount
  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    setLoading(true);

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setVehicles(data as Vehicle[]);
        try { localStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(data)); } catch { /* quota */ }
        setLoading(false);
        return;
      }
    }

    // Offline fallback: serve from localStorage cache
    try {
      const cached = localStorage.getItem(VEHICLES_CACHE_KEY);
      if (cached) setVehicles(JSON.parse(cached));
    } catch { /* parse error */ }

    setLoading(false);
  }

  // ── Update a vehicle field ─────────────────────────────────────────────────
  const updateVehicle = useCallback(async (id: string, changes: Partial<Vehicle>) => {
    // Optimistic update
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...changes } : v));

    if (isOnline) {
      const { error } = await supabase.from('vehicles').update(changes).eq('id', id);
      if (error) console.error('Vehicle update failed:', error.message);
    } else {
      enqueueOffline({ type: 'update', table: 'vehicles', id, changes });
    }
  }, [isOnline]);

  // ── Provision a new vehicle with all checklists ────────────────────────────
  const addVehicle = useCallback(async (vehicle: Omit<Vehicle, 'created_at' | 'updated_at'>): Promise<{ error?: string }> => {
    if (!isOnline) return { error: 'Cannot add vehicle while offline' };

    // Insert vehicle
    const { error: vErr } = await supabase.from('vehicles').insert(vehicle);
    if (vErr) return { error: vErr.message };

    // Provision PDI checklist
    const pdiChecks = makePdiChecks(vehicle.id);
    const { error: pdiErr } = await supabase.from('pdi_checks').insert(pdiChecks);
    if (pdiErr) console.error('PDI seed failed:', pdiErr.message);

    // Provision final checklist
    const finalChecks = makeFinalChecks(vehicle.id);
    const { error: finalErr } = await supabase.from('final_checks').insert(finalChecks);
    if (finalErr) console.error('Final seed failed:', finalErr.message);

    // Provision maintenance schedule if starting in stock stage
    if (vehicle.stage === 'stock') {
      const maintTasks = makeMaintTasks(vehicle.id);
      const { error: maintErr } = await supabase.from('stock_maintenance').insert(maintTasks);
      if (maintErr) console.error('Maint seed failed:', maintErr.message);
    }

    // Log history
    await supabase.from('vehicle_history').insert({
      vehicle_id: vehicle.id,
      action:     'vehicle_added',
      stage_from: null,
      stage_to:   vehicle.stage,
      note:       'Vehicle registered in system',
    });

    await loadVehicles();
    return {};
  }, [isOnline]);

  // ── Advance stage ──────────────────────────────────────────────────────────
  const advanceStage = useCallback(async (vehicleId: string, newStage: Stage, _note = ''): Promise<{ error?: string }> => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return { error: 'Vehicle not found' };

    const dateField: Partial<Record<Stage, keyof Vehicle>> = {
      pdi:      'pdi_date',
      stock:    'stock_date',
      ready:    'final_date',
      released: 'release_date',
    };

    const updates: Partial<Vehicle> = { stage: newStage };
    const df = dateField[newStage];
    if (df) updates[df] = new Date().toISOString().split('T')[0] as never;

    // Provision maintenance schedule on entering stock stage
    if (newStage === 'stock') {
      const existing = await supabase
        .from('stock_maintenance')
        .select('task_id', { count: 'exact', head: true })
        .eq('vehicle_id', vehicleId);
      if ((existing.count ?? 0) === 0) {
        const tasks = makeMaintTasks(vehicleId);
        await supabase.from('stock_maintenance').insert(tasks);
      }
    }

    await updateVehicle(vehicleId, updates);
    return {};
  }, [vehicles, updateVehicle]);

  // ── Offline queue helpers ──────────────────────────────────────────────────
  function enqueueOffline(op: Omit<OfflineOp, 'queued_at'>) {
    try {
      const queue: OfflineOp[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? '[]');
      queue.push({ ...op, queued_at: Date.now() });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch { /* quota */ }
  }

  async function flushOfflineQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return;
      const queue: OfflineOp[] = JSON.parse(raw);
      if (queue.length === 0) return;

      for (const op of queue) {
        if (op.type === 'update' && op.id) {
          await supabase.from(op.table).update(op.changes).eq('id', op.id);
        } else if (op.type === 'insert') {
          await supabase.from(op.table).insert(op.changes);
        }
      }

      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      await loadVehicles();
    } catch (err) {
      console.error('Offline flush failed:', err);
    }
  }

  return { vehicles, loading, isOnline, loadVehicles, updateVehicle, addVehicle, advanceStage };
}
