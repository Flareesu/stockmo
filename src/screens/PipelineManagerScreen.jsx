    /* ─── PipelineManagerScreen ─── */
    function PipelineManagerScreen({ navigate, t, vehicles, role }) {
      const [stages, setStages] = useState([]);
      const [loading, setLoading] = useState(true);
      const [editId, setEditId] = useState(null);
      const [editName, setEditName] = useState('');
      const [editColor, setEditColor] = useState('#6b7280');
      const [newName, setNewName] = useState('');
      const [newColor, setNewColor] = useState('#6b7280');
      const [saving, setSaving] = useState(false);

      useEffect(() => {
        sb.from('pipeline_stages').select('*').order('ord')
          .then(({ data, error }) => {
            if (error) console.error('load pipeline_stages', error);
            setStages(data || []); setLoading(false);
          })
          .catch((err) => { console.error('load pipeline_stages', err); setLoading(false); });
      }, []);

      const startEdit = (s) => { setEditId(s.id); setEditName(s.name); setEditColor(s.color || '#6b7280'); };
      const cancelEdit = () => setEditId(null);

      const saveEdit = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        const { error } = await sb.from('pipeline_stages').update({ name: editName.trim(), color: editColor }).eq('id', editId);
        if (error) { console.error('pipeline update', error); await stockmoDialog.alert({ title: 'Save failed', message: error.message }); setSaving(false); return; }
        setStages(prev => prev.map(s => s.id === editId ? { ...s, name: editName.trim(), color: editColor } : s));
        setEditId(null); setSaving(false);
      };

      const addStage = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        const maxOrder = stages.reduce((m, s) => Math.max(m, s.ord || 0), 0);
        const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `stage_${maxOrder + 1}`;
        const { data, error } = await sb.from('pipeline_stages').insert({ name: newName.trim(), color: newColor, ord: maxOrder + 1, slug, active: true }).select().single();
        if (error) { console.error('pipeline insert', error); await stockmoDialog.alert({ title: 'Add failed', message: error.message }); setSaving(false); return; }
        if (data) setStages(prev => [...prev, data]);
        setNewName(''); setSaving(false);
      };

      const deleteStage = async (id) => {
        const ok = await stockmoDialog.confirm({
          title: 'Delete stage?',
          message: 'Vehicles in this stage will need reassignment.',
          confirmLabel: 'Delete',
          danger: true,
        });
        if (!ok) return;
        const { error } = await sb.from('pipeline_stages').delete().eq('id', id);
        if (error) { console.error('pipeline delete', error); await stockmoDialog.alert({ title: 'Delete failed', message: error.message }); return; }
        setStages(prev => prev.filter(s => s.id !== id));
      };

      const moveStage = async (idx, dir) => {
        const next = [...stages];
        const swap = idx + dir;
        if (swap < 0 || swap >= next.length) return;
        [next[idx], next[swap]] = [next[swap], next[idx]];
        next.forEach((s, i) => { s.ord = i + 1; });
        setStages(next);
        await Promise.all(next.map(s => sb.from('pipeline_stages').update({ ord: s.ord }).eq('id', s.id)));
      };

      const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-navy outline-none focus:border-primary transition-colors";

      return (
        <div className="min-h-screen bg-[#F5F5F5]">
          <div className="bg-white px-5 pt-12 lg:pt-6 pb-4">
            <h1 className="text-[20px] font-black text-navy">Pipeline Stages</h1>
            <p className="text-[11px] text-muted">Reorder or rename stages. Changes apply immediately.</p>
          </div>
          <ConfigSubNav navigate={navigate} current="pipeline-manager" />
          <div className="p-4 lg:px-8 lg:py-6 space-y-3 lg:max-w-3xl lg:mx-auto pb-24 lg:pb-6">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : stages.map((s, idx) => (
              <div key={s.id} className="bg-white rounded-[16px] p-3 shadow-card flex items-center gap-3">
                <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: s.color || '#6b7280' }} />
                {editId === s.id ? (
                  <div className="flex-1 space-y-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-muted font-bold">Color</label>
                      <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                      <button onClick={saveEdit} disabled={saving} className="flex-1 py-1.5 bg-primary text-white font-bold text-[11px] rounded-lg">{saving ? 'Saving…' : 'Save'}</button>
                      <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-100 text-muted font-bold text-[11px] rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-navy">{s.name}</div>
                    <div className="text-[10px] text-muted">Order {s.ord}</div>
                  </div>
                )}
                {editId !== s.id && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveStage(idx, -1)} disabled={idx === 0} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"><Icon name="arrow_upward" className="text-muted text-sm" /></button>
                    <button onClick={() => moveStage(idx, 1)} disabled={idx === stages.length - 1} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"><Icon name="arrow_downward" className="text-muted text-sm" /></button>
                    <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Icon name="edit" className="text-navy text-sm" /></button>
                    <button onClick={() => deleteStage(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Icon name="delete" className="text-red-400 text-sm" /></button>
                  </div>
                )}
              </div>
            ))}
            {/* Add new stage */}
            <div className="bg-white rounded-[16px] p-4 shadow-card space-y-3 border-2 border-dashed border-gray-200">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Add New Stage</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Stage name…" className={inputCls} />
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-muted font-bold">Color</label>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                <button onClick={addStage} disabled={!newName.trim() || saving}
                  className="flex-1 py-2 bg-primary text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 disabled:opacity-40 hover:brightness-110 active:scale-[0.98] transition-all">
                  <Icon name="add" className="text-sm" /> Add Stage
                </button>
              </div>
            </div>
          </div>
          <AdminBottomNav navigate={navigate} currentView="pipeline-manager" vehicles={vehicles} t={t} role={role} />
        </div>
      );
    }

