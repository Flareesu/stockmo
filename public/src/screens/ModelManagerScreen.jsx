    /* ─── ModelManagerScreen ─── */
    function ModelManagerScreen({ navigate, t }) {
      const [models, setModels]     = useState([]);
      const [loading, setLoading]   = useState(true);
      const [expanded, setExpanded] = useState(null);
      const [saving, setSaving]     = useState(false);

      // New model form
      const [newName,    setNewName]    = useState('');
      const [newVariant, setNewVariant] = useState('');
      const [newEngine,  setNewEngine]  = useState('');
      const [newFuel,    setNewFuel]    = useState('Gasoline');
      const [newColors, setNewColors] = useState([]); // array of strings
      const [colorInput, setColorInput] = useState('');

      // Per-model color editing (for existing models)
      const [editColorId, setEditColorId]     = useState(null); // model id being edited
      const [editColorInput, setEditColorInput] = useState('');

      useEffect(() => {
        sb.from('vehicle_models').select('*').order('name')
          .then(({ data, error }) => {
            if (error) console.error('load vehicle_models', error);
            const dbModels = data || [];
            setModels(dbModels); setLoading(false);
          })
          .catch((err) => { console.error('load vehicle_models', err); setLoading(false); });
      }, []);

      /* ── new model form helpers ── */
      const addColorToNew = () => {
        const c = colorInput.trim();
        if (!c || newColors.includes(c)) return;
        setNewColors(prev => [...prev, c]);
        setColorInput('');
      };
      const removeColorFromNew = (c) => setNewColors(prev => prev.filter(x => x !== c));

      const addModel = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        const fuel = newFuel || detectFuel(newVariant, newName);
        const { data } = await sb.from('vehicle_models').insert({
          name:      newName.trim(),
          variant:   newVariant.trim(),
          engine:    newEngine.trim(),
          fuel_type: fuel,
          color_options: newColors,
        }).select().single();
        if (data) setModels(prev => [...prev, data]);
        setNewName(''); setNewVariant(''); setNewEngine(''); setNewColors([]); setColorInput('');
        setSaving(false);
      };

      const deleteModel = async (id) => {
        const ok = await stockmoDialog.confirm({
          title: 'Remove model?',
          message: 'This will remove the model from the catalog.',
          confirmLabel: 'Remove',
          danger: true,
        });
        if (!ok) return;
        await sb.from('vehicle_models').delete().eq('id', id);
        setModels(prev => prev.filter(m => m.id !== id));
      };

      /* ── color management on existing models ── */
      const addColorToModel = async (model) => {
        const c = editColorInput.trim();
        if (!c) return;
        const current = model.color_options || [];
        if (current.includes(c)) { setEditColorInput(''); return; }
        const updated = [...current, c];
        if (!model.id.startsWith('local-')) {
          await sb.from('vehicle_models').update({ color_options: updated }).eq('id', model.id);
        }
        setModels(prev => prev.map(m => m.id === model.id ? { ...m, color_options: updated } : m));
        setEditColorInput('');
      };

      const removeColorFromModel = async (model, color) => {
        const updated = (model.color_options || []).filter(c => c !== color);
        if (!model.id.startsWith('local-')) {
          await sb.from('vehicle_models').update({ color_options: updated }).eq('id', model.id);
        }
        setModels(prev => prev.map(m => m.id === model.id ? { ...m, color_options: updated } : m));
      };

      const inputCls = "bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-navy outline-none focus:border-primary transition-colors";

      return (
        <div className="min-h-screen bg-[#F5F5F5]">
          <div className="bg-white px-5 pt-12 lg:pt-6 pb-4 flex items-center gap-3">
            <button onClick={() => navigate('admin-dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Icon name="arrow_back" className="text-navy" />
            </button>
            <div>
              <h1 className="text-[20px] font-black text-navy">Model Manager</h1>
              <p className="text-[11px] text-muted">Add or remove vehicle model configurations.</p>
            </div>
          </div>
          <ConfigSubNav navigate={navigate} current="model-manager" />
          <div className="p-4 lg:px-8 lg:py-6 space-y-3 lg:max-w-3xl lg:mx-auto">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : models.map(m => (
              <div key={m.id} className="bg-white rounded-[16px] shadow-card overflow-hidden">
                <button onClick={() => { setExpanded(expanded === m.id ? null : m.id); setEditColorId(null); setEditColorInput(''); }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name="directions_car" className="text-primary text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-black text-navy">{m.name}</div>
                    <div className="text-[10px] text-muted">{m.engine} · {m.fuel_type || ''} · <span className="font-semibold">{(m.color_options||[]).length} color{(m.color_options||[]).length !== 1 ? 's' : ''}</span></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); deleteModel(m.id); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Icon name="delete" className="text-red-400 text-sm" />
                    </button>
                    <Icon name={expanded === m.id ? 'expand_less' : 'expand_more'} className="text-muted" />
                  </div>
                </button>
                {expanded === m.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted">Color Options</div>
                    {/* Color chips */}
                    <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                      {(m.color_options || []).map(c => (
                        <span key={c} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 text-navy text-[11px] font-semibold rounded-full">
                          {c}
                          <button onClick={() => removeColorFromModel(m, c)}
                            className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gray-300 hover:bg-red-200 transition-colors">
                            <Icon name="close" className="text-[9px] text-navy" />
                          </button>
                        </span>
                      ))}
                      {!(m.color_options?.length) && <span className="text-[12px] text-muted italic">No colors yet</span>}
                    </div>
                    {/* Add color input */}
                    <div className="flex gap-2">
                      <input
                        value={editColorId === m.id ? editColorInput : ''}
                        onFocus={() => { setEditColorId(m.id); }}
                        onChange={e => setEditColorInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColorToModel(m); } }}
                        placeholder="Add color (e.g. Crystal White)"
                        className={inputCls + ' flex-1 text-[12px] py-2'}
                      />
                      <button
                        onClick={() => addColorToModel(m)}
                        disabled={!editColorInput.trim()}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-[12px] font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30">
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* ── Add new model ── */}
            <div className="bg-white rounded-[16px] p-4 shadow-card space-y-3 border-2 border-dashed border-gray-200">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Add Model</div>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Model name (e.g. GS3 Emzoom)" className={inputCls + ' w-full'} />
              <input value={newVariant} onChange={e => setNewVariant(e.target.value)}
                placeholder="Variant (e.g. Premium, Elite — optional)" className={inputCls + ' w-full'} />
              <input value={newEngine} onChange={e => setNewEngine(e.target.value)}
                placeholder="Engine (e.g. 1.5T 174hp 7-DCT — optional)" className={inputCls + ' w-full'} />
              <select value={newFuel} onChange={e => setNewFuel(e.target.value)} className={inputCls + ' w-full appearance-none'}>
                <option>Gasoline</option>
                <option>Diesel</option>
                <option>HEV</option>
                <option>PHEV</option>
                <option>Electric</option>
              </select>

              {/* Color input for new model */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Colors</div>
                {newColors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {newColors.map(c => (
                      <span key={c} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-full">
                        {c}
                        <button onClick={() => removeColorFromNew(c)}
                          className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-primary/20 hover:bg-red-200 transition-colors">
                          <Icon name="close" className="text-[9px] text-primary" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={colorInput}
                    onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColorToNew(); } }}
                    placeholder="e.g. Crystal White"
                    className={inputCls + ' flex-1 text-[12px] py-2'}
                  />
                  <button onClick={addColorToNew} disabled={!colorInput.trim()}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-navy text-[12px] font-bold hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-30">
                    Add
                  </button>
                </div>
              </div>

              <button onClick={addModel} disabled={!newName.trim() || saving}
                className="w-full py-2 bg-primary text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 disabled:opacity-40 hover:brightness-110 active:scale-[0.98] transition-all">
                <Icon name="add" className="text-sm" /> {saving ? 'Saving…' : 'Add Model'}
              </button>
            </div>
          </div>
        </div>
      );
    }

