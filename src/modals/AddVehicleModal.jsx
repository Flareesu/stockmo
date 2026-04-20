    /* ─── AddVehicleModal ─── */
    function AddVehicleModal({ onClose, onAdd, t }) {
      const [models, setModels] = useState([]);
      const [loadingModels, setLoadingModels] = useState(true);
      const [selIdx, setSelIdx] = useState(0);
      const [color, setColor] = useState('');
      const [colorText, setColorText] = useState('');
      const [vin, setVin] = useState('');
      const [lot, setLot] = useState('');
      const [saving, setSaving] = useState(false);

      useEffect(() => {
        sb.from('vehicle_models').select('*').order('name')
          .then(({ data, error }) => {
            if (error) console.error('load vehicle_models', error);
            const dbModels = (data || []).length > 0 ? data : [];
            setModels(dbModels);
            const firstColors = dbModels[0]?.color_options || [];
            setColor(firstColors[0] || '');
            setLoadingModels(false);
          })
          .catch((err) => { console.error('load vehicle_models', err); setLoadingModels(false); });
      }, []);

      const gm = models[selIdx] || {};
      const colors = gm.color_options || [];
      const isValid = vin.trim().length >= 10 && lot.trim() && (colors.length ? color : colorText.trim());

      const handleModelChange = (idx) => {
        setSelIdx(idx);
        const newColors = models[idx]?.color_options || [];
        setColor(newColors[0] || '');
        setColorText('');
      };

      const handleAdd = async () => {
        if (!isValid || saving) return;
        setSaving(true);
        await onAdd({
          vin: vin.trim(),
          model: gm.name,
          color: colors.length ? color : colorText.trim(),
          engine: gm.engine || '',
          fuel: gm.fuel_type || '',
          lot: lot.trim(),
        });
        setSaving(false);
      };

      const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-navy outline-none focus:border-primary transition-colors";
      return (
        <div className="fixed inset-0 bg-black/50 z-50 anim-fade-in flex items-end lg:items-center justify-center lg:p-6" onClick={onClose}>
          <div className="w-full max-w-[430px] lg:max-w-[560px] bg-white rounded-t-[32px] lg:rounded-[24px] shadow-2xl anim-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 lg:hidden" />
            <div className="flex items-center justify-between px-5 pt-3 lg:pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-black text-navy text-[18px]">{t('addVehicleTitle')}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Icon name="close" className="text-navy" /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4" style={{ maxHeight:'75vh' }}>
              {loadingModels ? (
                <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : (<>
                <Field label={t('modelLabel')} required>
                  <div className="relative">
                    <select value={selIdx} onChange={e => handleModelChange(Number(e.target.value))} className={inputCls + ' appearance-none'}>
                      {models.map((m, i) => <option key={m.id} value={i}>{m.name}</option>)}
                    </select>
                    <Icon name="expand_more" className="absolute right-3 top-2.5 text-muted pointer-events-none" />
                  </div>
                </Field>
                <Field label={t('colorLabel')} required>
                  {colors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {colors.map(c => (
                        <button key={c} onClick={() => setColor(c)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${color === c ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input value={colorText} onChange={e => setColorText(e.target.value)} placeholder="e.g. Crystal White" className={inputCls} />
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('engineLabel')}><div className="text-[13px] font-bold text-navy bg-gray-50 rounded-xl px-3 py-2.5">{gm.engine || '—'}</div></Field>
                  <Field label={t('fuelLabel')}><div className="text-[13px] font-bold text-navy bg-gray-50 rounded-xl px-3 py-2.5">{gm.fuel_type || '—'}</div></Field>
                </div>
                <Field label={t('vinLabel')} required>
                  <input value={vin} onChange={e => setVin(e.target.value)} placeholder="e.g. LFVAA11G5KA000008" className={inputCls} />
                </Field>
                <Field label={t('lotLabel')} required>
                  <input value={lot} onChange={e => setLot(e.target.value)} placeholder="e.g. B-10" className={inputCls} />
                </Field>
                <div className="pb-2">
                  <button onClick={handleAdd} disabled={!isValid || saving}
                    className="w-full py-[14px] rounded-full bg-primary text-white font-black text-[13px] uppercase tracking-[0.12em] flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none">
                    {saving
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Icon name="add" fill className="text-xl" />}
                    {saving ? 'Saving…' : t('addToFleet')}
                  </button>
                </div>
              </>)}
            </div>
          </div>
        </div>
      );
    }

