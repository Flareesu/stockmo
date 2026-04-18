import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useVehicles } from '../hooks/useVehicles';
import { uploadVehicleCover } from '../lib/storage';

// ─── Add Vehicle Page ─────────────────────────────────────────────────────────
// Dropdowns for model/color/engine/fuel loaded from dropdown_options table.
// Year is a static 2020–2030 dropdown.
// Dates use native <input type="date"> styled as a date wheel.
// Cover photo: optional image upload to Supabase Storage.

interface Props {
  onBack:    () => void;
  onSuccess: () => void;
}

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => 2020 + i);

export function AddVehiclePage({ onBack, onSuccess }: Props) {
  const { addVehicle } = useVehicles();

  const [dropdowns, setDropdowns] = useState<Record<string, string[]>>({
    model: [], color: [], engine: [], fuel: [],
  });
  const [form, setForm] = useState({
    vin:          '',
    model:        '',
    year:         new Date().getFullYear(),
    color:        '',
    engine:       '',
    fuel:         '',
    lot:          '',
    dealer:       '',
    arrival_date: '',
    notes:        '',
  });
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Load dropdown options from DB
  useEffect(() => {
    supabase
      .from('dropdown_options')
      .select('field, label, sort_order')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (!data) return;
        const grouped: Record<string, string[]> = { model: [], color: [], engine: [], fuel: [] };
        for (const row of data) grouped[row.field]?.push(row.label);
        setDropdowns(grouped);
        // Pre-select first option
        setForm(f => ({
          ...f,
          model:  grouped.model[0]  ?? '',
          color:  grouped.color[0]  ?? '',
          engine: grouped.engine[0] ?? '',
          fuel:   grouped.fuel[0]   ?? '',
        }));
      });
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function generateId(): Promise<string> {
    // Query the highest existing STK number and increment
    const { data } = await supabase
      .from('vehicles')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    const match = data?.id?.match(/^STK-(\d+)$/);
    const n = match ? parseInt(match[1], 10) + 1 : 1;
    return `STK-${String(n).padStart(3, '0')}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.vin.trim())   { setError('VIN is required'); return; }
    if (!form.model)        { setError('Model is required'); return; }
    if (!form.color)        { setError('Color is required'); return; }

    setLoading(true);

    const vehicleId = await generateId();
    let coverPhotoUrl: string | null = null;

    // Upload cover photo if selected
    if (photoFile) {
      try {
        const { url } = await uploadVehicleCover(vehicleId, photoFile);
        coverPhotoUrl = url;
      } catch (err) {
        setError(`Photo upload failed: ${String(err)}`);
        setLoading(false);
        return;
      }
    }

    const result = await addVehicle({
      id:              vehicleId,
      vin:             form.vin.trim().toUpperCase(),
      make:            'GAC',
      model:           form.model,
      year:            form.year,
      color:           form.color,
      engine:          form.engine,
      fuel:            form.fuel,
      lot:             form.lot.trim() || null,
      location:        null,
      stage:           'port',
      arrival_date:    form.arrival_date || null,
      pdi_date:        null,
      stock_date:      null,
      final_date:      null,
      release_date:    null,
      dealer:          form.dealer.trim() || null,
      notes:           form.notes.trim() || null,
      cover_photo_url: coverPhotoUrl,
    });

    setLoading(false);
    if (result.error) { setError(result.error); return; }
    onSuccess();
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="text-[#1A1A2E]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-[#1A1A2E]">Add Vehicle</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-24">
        {/* Cover Photo */}
        <div
          className="bg-white rounded-[20px] p-4 flex flex-col items-center justify-center border-2 border-dashed border-[#E8E8EE] cursor-pointer min-h-[140px]"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Cover" className="w-full h-36 object-cover rounded-xl" />
          ) : (
            <>
              <span className="material-symbols-outlined text-4xl text-[#C4C7D0]">add_photo_alternate</span>
              <p className="text-xs text-[#8A8FA3] mt-2">Tap to add cover photo</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handlePhotoChange} />
        </div>

        {/* Vehicle Identity */}
        <Section title="Vehicle Details">
          <TextInput label="VIN" value={form.vin} onChange={v => setForm(f => ({ ...f, vin: v }))}
            placeholder="e.g. LGXCE4BK4RA123456" required />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">Make</label>
              <div className="bg-[#F5F5F5] border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm text-[#8A8FA3]">GAC</div>
            </div>
            <SelectInput label="Model" value={form.model} options={dropdowns.model}
              onChange={v => setForm(f => ({ ...f, model: v }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectInput label="Year" value={String(form.year)}
              options={YEAR_OPTIONS.map(String)}
              onChange={v => setForm(f => ({ ...f, year: Number(v) }))} />
            <SelectInput label="Color" value={form.color} options={dropdowns.color}
              onChange={v => setForm(f => ({ ...f, color: v }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectInput label="Engine" value={form.engine} options={dropdowns.engine}
              onChange={v => setForm(f => ({ ...f, engine: v }))} />
            <SelectInput label="Fuel" value={form.fuel} options={dropdowns.fuel}
              onChange={v => setForm(f => ({ ...f, fuel: v }))} />
          </div>
        </Section>

        {/* Logistics */}
        <Section title="Logistics">
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Lot" value={form.lot} onChange={v => setForm(f => ({ ...f, lot: v }))}
              placeholder="e.g. B-04" />
            <TextInput label="Dealer" value={form.dealer} onChange={v => setForm(f => ({ ...f, dealer: v }))}
              placeholder="Dealer name" />
          </div>
          <DateInput label="Arrival Date" value={form.arrival_date}
            onChange={v => setForm(f => ({ ...f, arrival_date: v }))} />
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Additional notes…"
            rows={3}
            className="w-full border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#D0112B] resize-none"
          />
        </Section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </form>

      {/* Submit — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8EE] px-4 py-4">
        <button
          onClick={handleSubmit as unknown as React.MouseEventHandler}
          disabled={loading}
          className="w-full bg-[#D0112B] text-white rounded-full py-4 font-semibold text-sm disabled:opacity-50"
        >
          {loading ? 'Adding Vehicle…' : 'Add Vehicle'}
        </button>
      </div>
    </div>
  );
}

// ── Shared form components ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] p-4">
      <h3 className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#D0112B] placeholder:text-[#C4C7D0]" />
    </div>
  );
}

function SelectInput({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#D0112B] appearance-none">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function DateInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">{label}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#D0112B]" />
    </div>
  );
}
