    /* ─── OrderFormEditorScreen — admin-edits the order form ─── */
    function OrderFormEditorScreen({ navigate, t, vehicles, role }) {
      const [tab, setTab] = useState('fields'); // fields | priorities | statuses
      const [loading, setLoading] = useState(true);
      const [fields, setFields] = useState([]);
      const [priorities, setPriorities] = useState([]);
      const [statuses, setStatuses] = useState([]);

      const FIELD_TABS = [
        { key: 'order',     label: 'Order',     icon: 'receipt_long' },
        { key: 'unit',      label: 'Units',     icon: 'directions_car' },
        { key: 'dealer',    label: 'Dealer',    icon: 'store' },
        { key: 'logistics', label: 'Logistics', icon: 'local_shipping' },
      ];
      const FIELD_TYPES = ['text','number','date','textarea','select'];
      const BADGE_PRESETS = [
        ['bg-gray-100 text-gray-600',     'Gray'],
        ['bg-blue-100 text-blue-700',     'Blue'],
        ['bg-amber-100 text-amber-700',   'Amber'],
        ['bg-emerald-100 text-emerald-700','Green'],
        ['bg-purple-100 text-purple-700', 'Purple'],
        ['bg-teal-100 text-teal-700',     'Teal'],
        ['bg-orange-100 text-orange-600', 'Orange'],
        ['bg-red-100 text-red-600',       'Red'],
      ];

      const inputCls = "bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-navy outline-none focus:border-primary transition-colors";

      const load = async () => {
        setLoading(true);
        const [f, p, s] = await Promise.all([
          sb.from('order_form_fields').select('*').order('tab').order('ord'),
          sb.from('order_priorities').select('*').order('ord'),
          sb.from('order_statuses').select('*').order('ord'),
        ]);
        setFields(f.data || []);
        setPriorities(p.data || []);
        setStatuses(s.data || []);
        setLoading(false);
      };
      useEffect(() => { load(); }, []);

      /* ── FIELDS tab handlers ───────────────────────────────────── */
      const updField = async (id, patch) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
        const { error } = await sb.from('order_form_fields').update(patch).eq('id', id);
        if (error) stockmoDialog.alert({ title: 'Save error', message: error.message });
      };

      const addField = async (tabKey) => {
        const label = (await stockmoDialog.prompt?.({ title: 'New field label', placeholder: 'e.g. Purchase Order #' })) || prompt('New field label:');
        if (!label || !label.trim()) return;
        const type = (prompt('Field type (text, number, date, textarea, select):', 'text') || 'text').trim();
        if (!FIELD_TYPES.includes(type)) { stockmoDialog.alert({ title: 'Invalid', message: 'Type must be one of: ' + FIELD_TYPES.join(', ') }); return; }
        const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40);
        let key = slug || ('field_' + Date.now());
        if (fields.some(f => f.field_key === key)) key = key + '_' + Date.now().toString(36);
        const maxOrd = fields.filter(f => f.tab === tabKey).reduce((m,f) => Math.max(m, f.ord || 0), 0);
        const row = { field_key: key, label: label.trim(), tab: tabKey, type, required: false, active: true, is_builtin: false, ord: maxOrd + 1, options: [] };
        const { data, error } = await sb.from('order_form_fields').insert(row).select().single();
        if (error) { stockmoDialog.alert({ title:'Add failed', message: error.message }); return; }
        setFields(prev => [...prev, data]);
      };

      const deleteField = async (f) => {
        if (f.is_builtin) return;
        const ok = await stockmoDialog.confirm({
          title: 'Delete field?',
          message: `"${f.label}" will be removed from the order form. Existing orders keep their stored values but the field disappears from the UI.`,
          confirmLabel: 'Delete', danger: true,
        });
        if (!ok) return;
        await sb.from('order_form_fields').delete().eq('id', f.id);
        setFields(prev => prev.filter(x => x.id !== f.id));
      };

      const moveField = async (f, dir) => {
        const sib = fields.filter(x => x.tab === f.tab).sort((a,b)=>a.ord-b.ord);
        const i = sib.findIndex(x => x.id === f.id);
        const j = i + dir;
        if (j < 0 || j >= sib.length) return;
        const a = sib[i], b = sib[j];
        await Promise.all([
          sb.from('order_form_fields').update({ ord: b.ord }).eq('id', a.id),
          sb.from('order_form_fields').update({ ord: a.ord }).eq('id', b.id),
        ]);
        setFields(prev => prev.map(x =>
          x.id === a.id ? { ...x, ord: b.ord } :
          x.id === b.id ? { ...x, ord: a.ord } : x
        ));
      };

      const addOption = async (f) => {
        const label = prompt('Option label:'); if (!label) return;
        const value = (prompt('Option value (machine, e.g. cash):', label.toLowerCase().replace(/\W+/g,'_')) || '').trim();
        if (!value) return;
        const next = [...(f.options || []), { value, label: label.trim() }];
        await updField(f.id, { options: next });
      };

      const removeOption = async (f, idx) => {
        const next = (f.options || []).filter((_, i) => i !== idx);
        await updField(f.id, { options: next });
      };

      /* ── PRIORITIES tab handlers ──────────────────────────────── */
      const updPriority = async (key, patch) => {
        setPriorities(prev => prev.map(p => p.key === key ? { ...p, ...patch } : p));
        const { error } = await sb.from('order_priorities').update(patch).eq('key', key);
        if (error) stockmoDialog.alert({ title:'Save error', message: error.message });
      };
      const addPriority = async () => {
        const label = prompt('Priority label:'); if (!label) return;
        const key = label.trim().toLowerCase().replace(/\W+/g,'_');
        if (priorities.some(p => p.key === key)) { stockmoDialog.alert({ title:'Duplicate', message:'A priority with that key already exists.' }); return; }
        const maxOrd = priorities.reduce((m,p) => Math.max(m, p.ord || 0), 0);
        const row = { key, label: label.trim(), badge_class: 'bg-gray-100 text-gray-600', ord: maxOrd + 1, active: true };
        const { data, error } = await sb.from('order_priorities').insert(row).select().single();
        if (error) { stockmoDialog.alert({ title:'Add failed', message: error.message }); return; }
        setPriorities(prev => [...prev, data]);
      };
      const deletePriority = async (key) => {
        const ok = await stockmoDialog.confirm({ title:'Delete priority?', message:'Existing orders keep their stored value but it will not appear in the dropdown.', confirmLabel:'Delete', danger:true });
        if (!ok) return;
        await sb.from('order_priorities').delete().eq('key', key);
        setPriorities(prev => prev.filter(p => p.key !== key));
      };

      /* ── STATUSES tab handlers ────────────────────────────────── */
      const updStatus = async (key, patch) => {
        setStatuses(prev => prev.map(s => s.key === key ? { ...s, ...patch } : s));
        const { error } = await sb.from('order_statuses').update(patch).eq('key', key);
        if (error) stockmoDialog.alert({ title:'Save error', message: error.message });
      };
      const addStatus = async () => {
        const label = prompt('Status label:'); if (!label) return;
        const key = label.trim().toLowerCase().replace(/\W+/g,'_');
        if (statuses.some(s => s.key === key)) { stockmoDialog.alert({ title:'Duplicate', message:'A status with that key already exists.' }); return; }
        const maxOrd = statuses.reduce((m,s) => Math.max(m, s.ord || 0), 0);
        const row = { key, label: label.trim(), icon: 'circle', badge_class: 'bg-gray-100 text-gray-600', next_keys: [], ord: maxOrd + 1 };
        const { data, error } = await sb.from('order_statuses').insert(row).select().single();
        if (error) { stockmoDialog.alert({ title:'Add failed', message: error.message }); return; }
        setStatuses(prev => [...prev, data]);
      };
      const deleteStatus = async (key) => {
        const ok = await stockmoDialog.confirm({ title:'Delete status?', message:'Existing orders keep their stored value but it will not appear in the dropdown.', confirmLabel:'Delete', danger:true });
        if (!ok) return;
        await sb.from('order_statuses').delete().eq('key', key);
        setStatuses(prev => prev.filter(s => s.key !== key));
      };

      /* ── render helpers ───────────────────────────────────────── */
      const fieldsByTab = (key) => fields.filter(f => f.tab === key).sort((a,b)=>a.ord-b.ord);

      return (
        <div className="min-h-screen bg-[#F5F5F5]">
          <div className="bg-white px-5 pt-12 lg:pt-6 pb-4">
            <h1 className="text-[20px] font-black text-navy">Order Form Editor</h1>
            <p className="text-[11px] text-muted">Customize fields, priorities, and statuses for the order form.</p>
          </div>
          <ConfigSubNav navigate={navigate} current="order-form-editor" />

          <div className="lg:max-w-3xl lg:mx-auto pb-24 lg:pb-6">
            <nav className="bg-white border-b border-gray-100 flex px-2">
              {[['fields','Fields'],['priorities','Priorities'],['statuses','Statuses']].map(([k,l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex-1 py-3 text-[10px] font-bold tracking-widest transition-colors ${tab === k ? 'text-primary border-b-2 border-primary' : 'text-muted border-b-2 border-transparent'}`}>
                  {l}
                </button>
              ))}
            </nav>

            {loading && <div className="flex justify-center py-12"><div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" /></div>}

            {/* ── FIELDS TAB ── */}
            {!loading && tab === 'fields' && (
              <div className="p-4 lg:px-6 lg:py-4 space-y-4">
                {FIELD_TABS.map(ft => (
                  <div key={ft.key} className="bg-white rounded-[16px] shadow-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Icon name={ft.icon} className="text-primary text-[16px]" />
                        <span className="text-[12px] font-black text-navy uppercase tracking-wider">{ft.label}</span>
                      </div>
                      <button onClick={() => addField(ft.key)} className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-full">
                        <Icon name="add" className="text-sm" /> Add
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {fieldsByTab(ft.key).length === 0 && (
                        <div className="p-4 text-[12px] text-muted italic text-center">No fields yet — click Add.</div>
                      )}
                      {fieldsByTab(ft.key).map(f => (
                        <div key={f.id} className={`p-3 ${!f.active ? 'opacity-55' : ''}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <button onClick={() => moveField(f, -1)} className="p-0.5 hover:bg-gray-100 rounded"><Icon name="keyboard_arrow_up" className="text-[14px] text-muted" /></button>
                              <button onClick={() => moveField(f,  1)} className="p-0.5 hover:bg-gray-100 rounded"><Icon name="keyboard_arrow_down" className="text-[14px] text-muted" /></button>
                            </div>
                            <input
                              value={f.label}
                              onChange={e => setFields(prev => prev.map(x => x.id === f.id ? { ...x, label: e.target.value } : x))}
                              onBlur={e => updField(f.id, { label: e.target.value })}
                              className={inputCls + ' flex-1'}
                            />
                            <select
                              value={f.type}
                              disabled={f.is_builtin}
                              onChange={e => updField(f.id, { type: e.target.value })}
                              className={inputCls + ' w-24 appearance-none disabled:bg-gray-100 disabled:text-muted'}
                              title={f.is_builtin ? 'Built-in field type cannot be changed' : ''}>
                              {FIELD_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-2 mt-2 ml-7">
                            <button onClick={() => updField(f.id, { required: !f.required })}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${f.required ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-muted'}`}>
                              {f.required ? 'Required' : 'Optional'}
                            </button>
                            <button onClick={() => updField(f.id, { active: !f.active })}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${f.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-muted'}`}>
                              {f.active ? 'Visible' : 'Hidden'}
                            </button>
                            <span className="text-[9px] font-mono text-muted ml-auto">{f.field_key}{f.is_builtin && ' (built-in)'}</span>
                            {!f.is_builtin && (
                              <button onClick={() => deleteField(f)} className="p-1 hover:bg-red-50 rounded" title="Delete">
                                <Icon name="delete" className="text-red-400 text-[15px]" />
                              </button>
                            )}
                          </div>
                          {f.type === 'select' && !['priority','model_id','dealer_id'].includes(f.field_key) && (
                            <div className="ml-7 mt-2 p-2 bg-gray-50 rounded-lg space-y-1">
                              <div className="text-[9px] font-bold uppercase text-muted tracking-wider">Options</div>
                              {(f.options || []).map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-[11px]">
                                  <span className="font-mono text-muted">{opt.value}</span>
                                  <span className="text-navy flex-1">{opt.label}</span>
                                  <button onClick={() => removeOption(f, idx)} className="text-red-400 hover:bg-red-50 rounded p-0.5"><Icon name="close" className="text-[12px]" /></button>
                                </div>
                              ))}
                              <button onClick={() => addOption(f)} className="text-[10px] font-bold text-primary flex items-center gap-1"><Icon name="add" className="text-xs" /> Add option</button>
                            </div>
                          )}
                          {f.type === 'select' && ['priority','model_id','dealer_id'].includes(f.field_key) && (
                            <div className="ml-7 mt-1 text-[10px] text-muted italic">
                              Options are managed elsewhere ({f.field_key === 'priority' ? 'Priorities tab' : f.field_key === 'model_id' ? 'Models config' : 'Dealer manager'}).
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── PRIORITIES TAB ── */}
            {!loading && tab === 'priorities' && (
              <div className="p-4 lg:px-6 lg:py-4 space-y-2">
                {priorities.sort((a,b)=>a.ord-b.ord).map(p => (
                  <div key={p.key} className="bg-white rounded-[14px] shadow-card p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={p.label}
                        onChange={e => setPriorities(prev => prev.map(x => x.key === p.key ? { ...x, label: e.target.value } : x))}
                        onBlur={e => updPriority(p.key, { label: e.target.value })}
                        className={inputCls + ' flex-1'} />
                      <select value={p.badge_class} onChange={e => updPriority(p.key, { badge_class: e.target.value })}
                        className={inputCls + ' w-32 appearance-none'}>
                        {BADGE_PRESETS.map(([cls,name]) => <option key={cls} value={cls}>{name}</option>)}
                      </select>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.badge_class}`}>{p.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-muted">{p.key}</span>
                      <button onClick={() => updPriority(p.key, { active: !p.active })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-muted'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={() => deletePriority(p.key)} className="ml-auto p-1 hover:bg-red-50 rounded"><Icon name="delete" className="text-red-400 text-[15px]" /></button>
                    </div>
                  </div>
                ))}
                <button onClick={addPriority} className="w-full py-2 bg-primary text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 hover:brightness-110 transition-all">
                  <Icon name="add" className="text-sm" /> Add Priority
                </button>
              </div>
            )}

            {/* ── STATUSES TAB ── */}
            {!loading && tab === 'statuses' && (
              <div className="p-4 lg:px-6 lg:py-4 space-y-2">
                {statuses.sort((a,b)=>a.ord-b.ord).map(s => (
                  <div key={s.key} className="bg-white rounded-[14px] shadow-card p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={s.label}
                        onChange={e => setStatuses(prev => prev.map(x => x.key === s.key ? { ...x, label: e.target.value } : x))}
                        onBlur={e => updStatus(s.key, { label: e.target.value })}
                        className={inputCls + ' flex-1'} />
                      <input value={s.icon} placeholder="icon name"
                        onChange={e => setStatuses(prev => prev.map(x => x.key === s.key ? { ...x, icon: e.target.value } : x))}
                        onBlur={e => updStatus(s.key, { icon: e.target.value })}
                        className={inputCls + ' w-32'} />
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.badge_class}`}>
                        <Icon name={s.icon} className="text-[12px]" /> {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={s.badge_class} onChange={e => updStatus(s.key, { badge_class: e.target.value })}
                        className={inputCls + ' w-32 appearance-none'}>
                        {BADGE_PRESETS.map(([cls,name]) => <option key={cls} value={cls}>{name}</option>)}
                      </select>
                      <span className="text-[9px] font-mono text-muted">{s.key}</span>
                      <button onClick={() => deleteStatus(s.key)} className="ml-auto p-1 hover:bg-red-50 rounded"><Icon name="delete" className="text-red-400 text-[15px]" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[9px] font-bold uppercase text-muted tracking-wider mr-1">Allowed next:</span>
                      {statuses.filter(x => x.key !== s.key).map(other => {
                        const on = (s.next_keys || []).includes(other.key);
                        return (
                          <button key={other.key}
                            onClick={() => {
                              const nk = on ? (s.next_keys || []).filter(k => k !== other.key) : [...(s.next_keys || []), other.key];
                              updStatus(s.key, { next_keys: nk });
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${on ? 'bg-primary text-white' : 'bg-gray-100 text-muted'}`}>
                            {other.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <button onClick={addStatus} className="w-full py-2 bg-primary text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 hover:brightness-110 transition-all">
                  <Icon name="add" className="text-sm" /> Add Status
                </button>
              </div>
            )}
          </div>

          <AdminBottomNav navigate={navigate} currentView="order-form-editor" vehicles={vehicles} t={t} role={role} />
        </div>
      );
    }
