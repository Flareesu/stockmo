import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Dropdown Config Page (Admin) ──────────────────────────────────────────────
// Admins can add, edit (label, sort order), and deactivate options
// for the vehicle add form dropdowns: Model, Color, Engine, Fuel.
// Changes are reflected immediately in the Add Vehicle form.

interface Option {
  id:         string;
  field:      string;
  label:      string;
  sort_order: number;
  active:     boolean;
}

type FieldType = 'model' | 'color' | 'engine' | 'fuel';

const FIELDS: { key: FieldType; label: string }[] = [
  { key: 'model',  label: 'Model'  },
  { key: 'color',  label: 'Color'  },
  { key: 'engine', label: 'Engine' },
  { key: 'fuel',   label: 'Fuel'   },
];

interface Props { onBack: () => void; }

export function DropdownConfigPage({ onBack }: Props) {
  const [options, setOptions]   = useState<Option[]>([]);
  const [activeField, setActiveField] = useState<FieldType>('model');
  const [loading, setLoading]   = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase
      .from('dropdown_options')
      .select('*')
      .order('field')
      .order('sort_order');
    setOptions(data ?? []);
    setLoading(false);
  }

  const fieldOptions = options.filter(o => o.field === activeField);

  async function toggleActive(opt: Option) {
    setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, active: !o.active } : o));
    await supabase.from('dropdown_options').update({ active: !opt.active }).eq('id', opt.id);
  }

  async function saveLabel(id: string, label: string) {
    if (!label.trim()) return;
    setOptions(prev => prev.map(o => o.id === id ? { ...o, label: label.trim() } : o));
    await supabase.from('dropdown_options').update({ label: label.trim() }).eq('id', id);
    setEditingId(null);
  }

  async function addOption() {
    if (!newLabel.trim()) return;
    const maxOrder = Math.max(0, ...fieldOptions.map(o => o.sort_order));
    const { data } = await supabase
      .from('dropdown_options')
      .insert({ field: activeField, label: newLabel.trim(), sort_order: maxOrder + 1, active: true })
      .select()
      .single();
    if (data) setOptions(prev => [...prev, data]);
    setNewLabel('');
    setAddingNew(false);
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-[#1A1A2E]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-[#1A1A2E]">Form Options</h1>
        </div>
        {/* Field tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FIELDS.map(f => (
            <button
              key={f.key}
              onClick={() => { setActiveField(f.key); setEditingId(null); setAddingNew(false); }}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                activeField === f.key
                  ? 'bg-[#D0112B] text-white'
                  : 'bg-[#F5F5F5] text-[#8A8FA3] border border-[#E8E8EE]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-2 pb-8">
        {loading ? (
          <div className="text-center py-8 text-[#8A8FA3] text-sm">Loading…</div>
        ) : (
          <>
            {fieldOptions.map((opt, i) => (
              <div
                key={opt.id}
                className={`bg-white rounded-2xl px-4 py-3 flex items-center gap-3 ${!opt.active ? 'opacity-40' : ''}`}
              >
                <span className="text-xs text-[#C4C7D0] w-5 text-right">{i + 1}</span>

                {editingId === opt.id ? (
                  <input
                    autoFocus
                    defaultValue={opt.label}
                    onBlur={e => saveLabel(opt.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveLabel(opt.id, (e.target as HTMLInputElement).value); }}
                    className="flex-1 border-b border-[#D0112B] text-sm text-[#1A1A2E] bg-transparent outline-none py-0.5"
                  />
                ) : (
                  <span
                    className="flex-1 text-sm font-medium text-[#1A1A2E] cursor-pointer"
                    onClick={() => setEditingId(opt.id)}
                  >
                    {opt.label}
                  </span>
                )}

                {/* Active toggle */}
                <button onClick={() => toggleActive(opt)} className="ml-auto">
                  <div className={`w-10 h-6 rounded-full transition-all relative ${opt.active ? 'bg-[#D0112B]' : 'bg-[#E8E8EE]'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${opt.active ? 'left-5' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            ))}

            {/* Add new option */}
            {addingNew ? (
              <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-[#C4C7D0] w-5 text-right">{fieldOptions.length + 1}</span>
                <input
                  autoFocus
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addOption(); }}
                  placeholder={`New ${FIELDS.find(f => f.key === activeField)?.label} option`}
                  className="flex-1 border-b border-[#D0112B] text-sm text-[#1A1A2E] bg-transparent outline-none py-0.5"
                />
                <button onClick={addOption} className="text-xs font-semibold text-[#D0112B]">Add</button>
                <button onClick={() => setAddingNew(false)} className="text-xs text-[#8A8FA3]">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingNew(true)}
                className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl px-4 py-3 text-sm font-semibold text-[#D0112B] border-2 border-dashed border-[#D0112B]/30"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add {FIELDS.find(f => f.key === activeField)?.label} Option
              </button>
            )}

            <p className="text-xs text-[#8A8FA3] text-center pt-2">
              Tap a label to rename. Toggle to show/hide in the vehicle form.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
