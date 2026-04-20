    /* ─── ChecklistEditorScreen ─── */
    function ChecklistEditorScreen({ navigate, t }) {
      const [tab,         setTab]         = useState('pdi');
      const [items,       setItems]       = useState([]);
      const [loading,     setLoading]     = useState(true);
      const [saving,      setSaving]      = useState(false);
      const [editId,      setEditId]      = useState(null);
      const [editFields,  setEditFields]  = useState({});
      const [newName,     setNewName]     = useState('');
      const [newSection,  setNewSection]  = useState('Exterior');
      const [newPriority, setNewPriority] = useState('med');
      const [newFreq,     setNewFreq]     = useState(30);

      const TABLE_MAP = { pdi: 'pdi_item_templates', maint: 'maint_task_templates', final: 'final_check_templates' };
      const table = TABLE_MAP[tab];
      const SECTIONS = ['Exterior', 'Interior', 'Mechanical', 'Electrical', 'Documents'];
      const inputCls = "bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-navy outline-none focus:border-primary transition-colors";

      const load = async () => {
        setLoading(true); setEditId(null);
        const { data } = await sb.from(table).select('*').order('ord');
        setItems(data || []); setLoading(false);
      };
      useEffect(() => { load(); }, [tab]);

      const toggleActive = async (item) => {
        await sb.from(table).update({ active: !item.active }).eq('id', item.id);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: !i.active } : i));
      };

      const startEdit = (item) => {
        setEditId(item.id);
        setEditFields({ name: item.name, section: item.section || 'Exterior', priority: item.priority || 'med', frequency_days: item.frequency_days || 30 });
      };

      const saveEdit = async (item) => {
        if (!editFields.name.trim()) return;
        setSaving(true);
        const update = tab === 'maint'
          ? { name: editFields.name.trim(), frequency_days: Number(editFields.frequency_days) || 30, priority: editFields.priority }
          : { name: editFields.name.trim(), section: editFields.section, priority: editFields.priority };
        const { error } = await sb.from(table).update(update).eq('id', item.id);
        if (error) { console.error('template update', error); showToastMsg?.('Save failed: ' + error.message); setSaving(false); return; }
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...update } : i));

        // Cascade name/section/priority changes to existing pending check rows
        try {
          if (tab === 'pdi') {
            await sb.from('pdi_checks')
              .update({ name: update.name, section: update.section, priority: update.priority })
              .eq('item_id', item.id).eq('state', 'pending');
          } else if (tab === 'final') {
            await sb.from('final_checks')
              .update({ name: update.name, section: update.section, priority: update.priority })
              .eq('item_id', item.id).eq('state', 'pending');
          } else if (tab === 'maint') {
            await sb.from('stock_maintenance')
              .update({ name: update.name, freq_days: update.frequency_days, priority: update.priority })
              .eq('task_id', item.id).eq('state', 'pending');
          }
        } catch (cascadeErr) {
          console.error('cascade update error', cascadeErr);
        }

        setEditId(null); setSaving(false);
      };

      const deleteItem = async (item) => {
        const ok = await stockmoDialog.confirm({
          title: 'Delete item?',
          message: `"${item.name}" will be removed from the template. Existing vehicles in progress keep this item — only new vehicles will skip it.`,
          confirmLabel: 'Delete',
          danger: true,
        });
        if (!ok) return;
        await sb.from(table).delete().eq('id', item.id);
        setItems(prev => prev.filter(i => i.id !== item.id));
      };

      const addItem = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        const maxOrd = items.reduce((m, i) => Math.max(m, i.ord || 0), 0);
        const row = tab === 'maint'
          ? { name: newName.trim(), frequency_days: Number(newFreq) || 30, priority: newPriority, ord: maxOrd + 1, active: true }
          : { name: newName.trim(), section: newSection, priority: newPriority, ord: maxOrd + 1, active: true };
        const { data, error } = await sb.from(table).insert(row).select().single();
        if (error) { console.error('template insert', error); showToastMsg?.('Add failed: ' + error.message); setSaving(false); return; }
        if (data) {
          setItems(prev => [...prev, data]);
          // Seed this new template item onto all existing in-flight vehicles (not yet released)
          try {
            const { data: inFlight } = await sb.from('vehicles').select('id').neq('stage', 'released');
            if (inFlight?.length) {
              const today = new Date().toISOString().split('T')[0];
              let seedRows;
              let checkTable;
              let conflictKey;
              if (tab === 'pdi') {
                checkTable = 'pdi_checks';
                conflictKey = 'vehicle_id,item_id';
                seedRows = inFlight.map(v => ({ vehicle_id: v.id, item_id: data.id, section: data.section, name: data.name, priority: data.priority, state: 'pending' }));
              } else if (tab === 'final') {
                checkTable = 'final_checks';
                conflictKey = 'vehicle_id,item_id';
                seedRows = inFlight.map(v => ({ vehicle_id: v.id, item_id: data.id, section: data.section, name: data.name, priority: data.priority, state: 'pending' }));
              } else if (tab === 'maint') {
                checkTable = 'stock_maintenance';
                conflictKey = 'vehicle_id,task_id';
                const freqDays = Number(newFreq) || 30;
                const nextDue = new Date(today);
                nextDue.setDate(nextDue.getDate() + freqDays);
                const nextDueStr = nextDue.toISOString().split('T')[0];
                seedRows = inFlight.map(v => ({ vehicle_id: v.id, task_id: data.id, name: data.name, freq_days: freqDays, priority: data.priority, state: 'pending', last_done: today, next_due: nextDueStr }));
              }
              if (seedRows && checkTable) {
                await sb.from(checkTable).upsert(seedRows, { onConflict: conflictKey });
              }
            }
          } catch (seedErr) {
            console.error('seed new item to in-flight vehicles error', seedErr);
          }
        }
        setNewName(''); setSaving(false);
      };

      return (
        <div className="min-h-screen bg-[#F5F5F5]">
          <div className="bg-white px-5 pt-12 lg:pt-6 pb-4 flex items-center gap-3">
            <button onClick={() => navigate('admin-dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Icon name="arrow_back" className="text-navy" />
            </button>
            <div>
              <h1 className="text-[20px] font-black text-navy">Checklist Editor</h1>
              <p className="text-[11px] text-muted">Manage PDI, Maintenance &amp; Final Check templates.</p>
            </div>
          </div>
          <ConfigSubNav navigate={navigate} current="checklist-editor" />
          <div className="lg:max-w-3xl lg:mx-auto">
          <nav className="bg-white border-b border-gray-100 flex px-2">
            {[['pdi','PDI'],['maint','Maintenance'],['final','Final']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 py-3 text-[10px] font-bold tracking-widest transition-colors ${tab === key ? 'text-primary border-b-2 border-primary' : 'text-muted border-b-2 border-transparent'}`}>
                {label}
              </button>
            ))}
          </nav>
          <div className="p-4 lg:px-6 lg:py-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : items.map(item => (
              <div key={item.id} className={`bg-white rounded-[14px] shadow-card overflow-hidden transition-opacity ${!item.active && editId !== item.id ? 'opacity-55' : ''}`}>
                {editId === item.id ? (
                  /* ── inline edit form ── */
                  <div className="p-3 space-y-2.5">
                    <input
                      value={editFields.name}
                      onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))}
                      className={inputCls + ' w-full'}
                      placeholder="Item description…"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      {tab !== 'maint' && (
                        <select value={editFields.section} onChange={e => setEditFields(f => ({ ...f, section: e.target.value }))}
                          className={inputCls + ' flex-1 appearance-none'}>
                          {SECTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      )}
                      {tab === 'maint' && (
                        <div className="flex-1 flex items-center gap-1.5">
                          <input type="number" min="1" max="365" value={editFields.frequency_days}
                            onChange={e => setEditFields(f => ({ ...f, frequency_days: e.target.value }))}
                            className={inputCls + ' w-full'} placeholder="Days" />
                          <span className="text-[11px] text-muted whitespace-nowrap">days</span>
                        </div>
                      )}
                      <select value={editFields.priority} onChange={e => setEditFields(f => ({ ...f, priority: e.target.value }))}
                        className={inputCls + ' flex-1 appearance-none'}>
                        <option value="high">High</option>
                        <option value="med">Med</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditId(null)}
                        className="flex-1 py-1.5 rounded-full bg-gray-100 text-muted text-[11px] font-bold hover:bg-gray-200 transition-all">
                        Cancel
                      </button>
                      <button onClick={() => saveEdit(item)} disabled={!editFields.name.trim() || saving}
                        className="flex-1 py-1.5 rounded-full bg-primary text-white text-[11px] font-bold hover:brightness-110 transition-all disabled:opacity-40">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── normal display row ── */
                  <div className="flex items-center gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-navy leading-snug">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.section && <span className="text-[9px] font-bold uppercase text-muted tracking-wider">{item.section}</span>}
                        {item.frequency_days && <span className="text-[9px] font-bold uppercase text-muted tracking-wider">Every {item.frequency_days}d</span>}
                        <StatusBadge status={item.priority} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(item)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                        <Icon name="edit" className="text-muted text-[16px]" />
                      </button>
                      <button onClick={() => toggleActive(item)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-muted'}`}>
                        {item.active ? 'On' : 'Off'}
                      </button>
                      <button onClick={() => deleteItem(item)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Icon name="delete" className="text-red-400 text-[16px]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* ── Add new item ── */}
            <div className="bg-white rounded-[16px] p-4 shadow-card space-y-3 border-2 border-dashed border-gray-200 mt-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Add Item</div>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="Item description…" className={inputCls + ' w-full'} />
              <div className="flex gap-2">
                {tab !== 'maint' && (
                  <select value={newSection} onChange={e => setNewSection(e.target.value)} className={inputCls + ' flex-1 appearance-none'}>
                    {SECTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                )}
                {tab === 'maint' && (
                  <input type="number" min="1" value={newFreq} onChange={e => setNewFreq(e.target.value)}
                    placeholder="Days" className={inputCls + ' flex-1'} />
                )}
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className={inputCls + ' flex-1 appearance-none'}>
                  <option value="high">High</option>
                  <option value="med">Med</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <button onClick={addItem} disabled={!newName.trim() || saving}
                className="w-full py-2 bg-primary text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 disabled:opacity-40 hover:brightness-110 active:scale-[0.98] transition-all">
                <Icon name="add" className="text-sm" /> {saving ? 'Saving…' : 'Add Item'}
              </button>
            </div>
          </div>
          </div>{/* end lg:max-w-3xl */}
        </div>
      );
    }

