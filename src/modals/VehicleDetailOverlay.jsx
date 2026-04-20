    /* ─── VehicleDetailOverlay ─── */
    function VehicleDetailOverlay({ vehicle: v, onClose, updateVehicle, db, isAdmin, canEdit: canEditProp, t, onDeleteVehicle }) {
      const canEditVehicle = canEditProp !== undefined ? canEditProp : isAdmin;
      const [tab,          setTab]          = useState('VEHICLE');
      const [dealerName,   setDealerName]   = useState('');
      const [uploading,    setUploading]    = useState(false);
      const [imgCheckInfo, setImgCheckInfo] = useState(null); // {type, idx, itemId}
      const [showCamera,   setShowCamera]   = useState(false);
      const [reportedItems, setReportedItems] = useState({}); // {`${type}-${id}`: 'sending'|'done'}
      const [confirmState, setConfirmState] = useState({}); // {pdi:'idle'|'saving'|'saved', final:'idle'|...}
      const vehicleImgRef  = useRef(null);
      const issueImgRef    = useRef(null);
      const noteDebounceRef = useRef({});  // keyed by `${type}-${idx}`, holds timer IDs
      const tech   = techById(v.assignedTech);
      const pp     = pdiProgress(v);
      const fp     = finalProgress(v);
      const issues = countIssues(v);

      const [editMode,   setEditMode]   = useState(false);
      const [editFields, setEditFields] = useState({});

      // ── Reports tab state ──────────────────────────────────────────────────
      const [reports,          setReports]          = useState([]);
      const [reportText,       setReportText]       = useState('');
      const [loadingReports,   setLoadingReports]   = useState(false);
      const [submittingReport, setSubmittingReport] = useState(false);

      useEffect(() => {
        if (tab !== 'REPORTS') return;
        setLoadingReports(true);
        sb.from('vehicle_reports')
          .select('id, content, created_at, created_by')
          .eq('vehicle_id', v.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => { setReports(data || []); setLoadingReports(false); });
      }, [tab, v.id]);

      const submitReport = async () => {
        const txt = reportText.trim();
        if (!txt) return;
        setSubmittingReport(true);
        const { data } = await sb.from('vehicle_reports')
          .insert({ vehicle_id: v.id, content: txt })
          .select('id, content, created_at, created_by')
          .single();
        if (data) setReports(prev => [data, ...prev]);
        setReportText('');
        setSubmittingReport(false);
      };

      const startEdit = () => {
        setEditFields({
          model:          v.model          || '',
          variant:        v.variant        || '',
          exterior_color: v.exteriorColor  || v.color || '',
          interior_color: v.interiorColor  || '',
          fuel:           v.fuel           || 'Gasoline',
          vin:            v.vin            || '',
          engine_number:  v.engineNumber   || '',
          cs_number:      v.csNumber       || '',
          lot:            v.lot            || '',
          year:           String(v.year    || 2025),
          _extra: { ...(v.extraFields || {}) },
        });
        setEditMode(true);
      };
      const saveEdit = async () => {
        const u = {
          model:          editFields.model.trim(),
          variant:        editFields.variant.trim(),
          exterior_color: editFields.exterior_color.trim(),
          interior_color: editFields.interior_color.trim(),
          color:          editFields.exterior_color.trim(), // backward compat
          engine:         editFields.variant.trim(),        // backward compat
          fuel:           editFields.fuel || 'Gasoline',
          vin:            editFields.vin.trim(),
          engine_number:  editFields.engine_number.trim(),
          cs_number:      editFields.cs_number.trim(),
          lot:            editFields.lot.trim(),
          year:           parseInt(editFields.year) || 2025,
          extra_fields:   editFields._extra || {},
        };
        await sb.from('vehicles').update(u).eq('id', v.id);
        const { extra_fields, color, engine, ...rest } = u;
        updateVehicle(v.id, car => ({
          ...car, ...rest,
          exteriorColor: u.exterior_color,
          interiorColor: u.interior_color,
          engineNumber:  u.engine_number,
          csNumber:      u.cs_number,
          extraFields:   extra_fields,
        }));
        setEditMode(false);
      };
      const handleDelete = async () => {
        const ok = await stockmoDialog.confirm({
          title: 'Delete vehicle?',
          message: `${v.label || v.model} — this cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        });
        if (!ok) return;
        await sb.from('vehicles').delete().eq('id', v.id);
        if (onDeleteVehicle) onDeleteVehicle(v.id);
        onClose();
      };

      /* ── check toggle ── */
      const toggleCheck = async (type, idx) => {
        if (isAdmin) return;
        const field     = type === 'pdi' ? 'pdiChecks' : 'finalChecks';
        const order     = ['pending', 'done', 'issue', 'na'];
        const curCheck  = v[field]?.[idx];
        const curState  = curCheck?.state || 'pending';
        const nextState = order[(order.indexOf(curState) + 1) % order.length];

        // Optimistic local update immediately (snappy UI feedback)
        updateVehicle(v.id, car => {
          const checks = [...car[field]];
          checks[idx] = { ...checks[idx], state: nextState };
          return { ...car, [field]: checks };
        });

        // ① AWAIT the check-state write to DB first — critical order
        // This ensures pdi_checks/final_checks row has state='issue' BEFORE
        // updateStage fires the vehicles realtime subscription + refetch.
        // Without await, the refetch races and overwrites with stale 'done' state.
        if (db) {
          const fn = type === 'pdi' ? db.upsertPdiCheck : db.upsertFinalCheck;
          await fn(v.id, curCheck?.id, nextState, curCheck?.note || '').catch(console.error);
        }

        // ② Only after check is committed, trigger hold + auto-notify admin
        if (nextState === 'issue') {
          // Auto-notify admin immediately — no manual "Report to Admin" needed
          if (db) {
            db.reportIssue(v.id, v.label || v.model, type, curCheck?.name || '', curCheck?.note || '', tech?.name || 'Tech')
              .catch(console.error);
          }
          // Move to hold if in an active stage
          if (['port', 'pdi', 'ready'].includes(v.stage)) {
            const action = `On hold — issue flagged on ${type.toUpperCase()} checklist — ${tech?.name || 'Tech'}`;
            updateVehicle(v.id, car => ({ ...car, stage: 'hold' }));
            if (db) {
              db.updateStage(v.id, 'hold').catch(console.error);
              db.insertHistory(v.id, action, v.stage, 'hold').catch(console.error);
            }
          }
        }
      };

      /* ── check note (debounced DB write — instant local update) ── */
      const setCheckNote = (type, idx, note) => {
        const field = type === 'pdi' ? 'pdiChecks' : 'finalChecks';
        // Immediate optimistic update so typing feels instant
        updateVehicle(v.id, car => {
          const checks = [...car[field]];
          checks[idx] = { ...checks[idx], note };
          return { ...car, [field]: checks };
        });
        if (!db) return;
        // Debounce DB write — only fire 600ms after user stops typing
        const key = `${type}-${idx}`;
        clearTimeout(noteDebounceRef.current[key]);
        noteDebounceRef.current[key] = setTimeout(() => {
          const fn  = type === 'pdi' ? db.upsertPdiCheck : db.upsertFinalCheck;
          const arr = type === 'pdi' ? v.pdiChecks : v.finalChecks;
          fn(v.id, arr[idx]?.id, arr[idx]?.state || 'issue', note).catch(console.error);
        }, 600);
      };

      /* ── confirm / bulk-save checklist ── */
      const handleConfirmSave = async (type) => {
        const checks = type === 'pdi' ? v.pdiChecks : v.finalChecks;
        setConfirmState(prev => ({ ...prev, [type]: 'saving' }));
        try {
          if (db) {
            // Flush any pending debounced note write immediately
            Object.keys(noteDebounceRef.current).forEach(k => {
              if (k.startsWith(type + '-')) clearTimeout(noteDebounceRef.current[k]);
            });
            await db.bulkSaveChecks(v.id, type, checks);
          }
          setConfirmState(prev => ({ ...prev, [type]: 'saved' }));
          setTimeout(() => setConfirmState(prev => ({ ...prev, [type]: 'idle' })), 3000);
        } catch (err) {
          console.error('bulkSaveChecks', err);
          setConfirmState(prev => ({ ...prev, [type]: 'idle' }));
        }
      };

      /* ── report issue to admin ── */
      const handleReportIssue = async (type, item) => {
        const key = `${type}-${item.id}`;
        if (reportedItems[key]) return;                    // already reported
        setReportedItems(prev => ({ ...prev, [key]: 'sending' }));
        try {
          if (db) {
            await db.reportIssue(v.id, v.label || v.model, type, item.name, item.note, tech?.name || 'Tech');
          }
          setReportedItems(prev => ({ ...prev, [key]: 'done' }));
        } catch (err) {
          console.error('reportIssue', err);
          setReportedItems(prev => ({ ...prev, [key]: null })); // reset on error
        }
      };

      /* ── stage mutations ── */
      const startPdi = () => {
        const action = `PDI started — ${tech.name}`;
        updateVehicle(v.id, car => ({ ...car, stage:'pdi', history:[`${todayStr()}: ${action}`, ...car.history] }));
        if (db) { db.updateStage(v.id, 'pdi').catch(console.error); db.insertHistory(v.id, action, v.stage, 'pdi').catch(console.error); }
      };
      const putOnHold = () => {
        const action = `HOLD — PDI failed (${issues} issues) — ${tech.name}`;
        updateVehicle(v.id, car => ({ ...car, stage:'hold', history:[`${todayStr()}: ${action}`, ...car.history] }));
        if (db) { db.updateStage(v.id, 'hold').catch(console.error); db.insertHistory(v.id, action, v.stage, 'hold').catch(console.error); }
      };
      const resumePdi = () => {
        const action = `PDI resumed after repair — ${tech.name}`;
        updateVehicle(v.id, car => ({ ...car, stage:'pdi', history:[`${todayStr()}: ${action}`, ...car.history] }));
        if (db) { db.updateStage(v.id, 'pdi').catch(console.error); db.insertHistory(v.id, action, v.stage, 'pdi').catch(console.error); }
      };
      const pdiPassToStock = () => {
        const action = `PDI passed — moved to stockyard — ${tech.name}`;
        const today  = todayStr();
        updateVehicle(v.id, car => ({ ...car, stage:'stock', pdiDate:today, stockDate:today, stockMaint:makeMaint(today), history:[`${today}: ${action}`, ...car.history] }));
        if (db) {
          db.updateStage(v.id, 'stock', { pdi_date: today, stock_date: today }).catch(console.error);
          db.insertHistory(v.id, action, v.stage, 'stock').catch(console.error);
          db.insertMaintTasks(v.id, today).catch(console.error);
        }
      };
      const passToFinal = () => {
        const action = `Passed to final inspection — ${tech.name}`;
        const today  = todayStr();
        updateVehicle(v.id, car => ({ ...car, stage:'ready', finalDate:today, history:[`${today}: ${action}`, ...car.history] }));
        if (db) { db.updateStage(v.id, 'ready', { final_date: today }).catch(console.error); db.insertHistory(v.id, action, v.stage, 'ready').catch(console.error); }
      };
      const releaseCar = () => {
        if (!dealerName.trim()) return;
        const dealer = dealerName.trim();
        const action = `Released to ${dealer}`;
        const today  = todayStr();
        updateVehicle(v.id, car => ({ ...car, stage:'released', releaseDate:today, dealer, history:[`${today}: ${action}`, ...car.history] }));
        if (db) { db.updateStage(v.id, 'released', { release_date: today, dealer }).catch(console.error); db.insertHistory(v.id, action, v.stage, 'released').catch(console.error); }
      };
      const completeMaint = (idx) => {
        const today = todayStr();
        const m     = v.stockMaint[idx];
        const action = `${m.name} — completed — ${tech.name}`;
        updateVehicle(v.id, car => {
          const maint = [...car.stockMaint];
          maint[idx] = { ...maint[idx], lastDone: today, nextDue: addDays(today, maint[idx].freq) };
          return { ...car, stockMaint: maint, history: [`${today}: ${action}`, ...car.history] };
        });
        if (db) { db.completeMaint(v.id, m.id, m.freq).catch(console.error); db.insertHistory(v.id, action, v.stage, v.stage).catch(console.error); }
      };

      /* ── image uploads ── */
      const handleVehicleImgUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !db) return;
        setUploading(true);
        try {
          const url = await db.uploadVehicleImage(v.id, file);
          updateVehicle(v.id, car => ({ ...car, img: url }));
        } catch (err) { console.error(err); }
        setUploading(false);
        e.target.value = '';
      };
      const handleIssueImgUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !imgCheckInfo || !db) return;
        const { type, idx, itemId } = imgCheckInfo;
        try {
          const url = await db.uploadIssueImage(v.id, type, itemId, file);
          const field = type === 'pdi' ? 'pdiChecks' : 'finalChecks';
          updateVehicle(v.id, car => {
            const checks = [...car[field]];
            checks[idx] = { ...checks[idx], image_url: url };
            return { ...car, [field]: checks };
          });
        } catch (err) { console.error(err); stockmoDialog.alert({ title: 'Photo upload failed', message: err.message || String(err) }); }
        e.target.value = '';
        setImgCheckInfo(null);
      };

      /* ── camera opener: mobile → file input, desktop → CameraModal ── */
      const openCameraForCheck = (type, item) => {
        setImgCheckInfo({ type, idx: item._i, itemId: item.id });
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        if (isMobile || !navigator.mediaDevices?.getUserMedia) {
          issueImgRef.current?.click();
        } else {
          setShowCamera(true);
        }
      };

      /* ── CameraModal capture handler ── */
      const handleCameraCapture = async (file) => {
        if (!imgCheckInfo || !db) return;
        const { type, idx, itemId } = imgCheckInfo;
        try {
          const url = await db.uploadIssueImage(v.id, type, itemId, file);
          const field = type === 'pdi' ? 'pdiChecks' : 'finalChecks';
          updateVehicle(v.id, car => {
            const checks = [...car[field]];
            checks[idx] = { ...checks[idx], image_url: url };
            return { ...car, [field]: checks };
          });
        } catch (err) { console.error(err); stockmoDialog.alert({ title: 'Photo upload failed', message: err.message || String(err) }); }
        setImgCheckInfo(null);
      };

      const ChecklistTab = ({ type, checks }) => {
        const sections = [...new Set(checks.map(c => c.section))];
        return (
          <div className="space-y-6">
            {sections.map(sec => {
              const items = checks.map((c, i) => ({ ...c, _i: i })).filter(c => c.section === sec);
              const done = items.filter(c => c.state === 'done' || c.state === 'na').length;
              const pct  = items.length ? Math.round((done / items.length) * 100) : 0;
              return (
                <div key={sec}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">{sec}</h3>
                    <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-primary whitespace-nowrap">{done}/{items.length}</span>
                  </div>
                  {/* Items — 1 col mobile, 2 col desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {items.map(item => {
                      const st = item.state;
                      const stIcon = st === 'done' ? 'check_circle' : st === 'issue' ? 'error' : st === 'na' ? 'remove_circle' : null;
                      const stBg = st === 'done' ? 'bg-emerald-50 border-emerald-200' : st === 'issue' ? 'bg-red-50 border-red-200' : st === 'na' ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200';
                      const stColor = st === 'done' ? 'bg-emerald-500' : st === 'issue' ? 'bg-red-500' : st === 'na' ? 'bg-gray-400' : '';
                      return (
                        <div key={item.id} className="flex flex-col">
                          <button onClick={() => toggleCheck(type, item._i)} disabled={isAdmin}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left w-full border transition-all duration-150 ${stBg} ${!isAdmin ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}>
                            {stIcon ? (
                              <div className={`w-5 h-5 ${stColor} rounded-md flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                <Icon name={stIcon} fill className="text-white text-xs" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-md flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-navy leading-snug">{item.name}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <StatusBadge status={item.priority} />
                                <span className="text-[9px] font-bold uppercase text-muted tracking-wider">{st}</span>
                              </div>
                            </div>
                          </button>
                          {/* Camera + Report buttons — tech only */}
                          {!isAdmin && (
                            <div className="mt-1 space-y-1">
                              {st === 'issue' && (
                                <input type="text" value={item.note} onChange={e => setCheckNote(type, item._i, e.target.value)}
                                  placeholder={t('describeIssue')}
                                  className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[12px] text-navy outline-none focus:border-primary" />
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Photo button — always visible */}
                                <button onClick={() => openCameraForCheck(type, item)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${item.image_url ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100' : st === 'issue' ? 'bg-red-50 border border-red-200 text-red-500 hover:bg-red-100' : 'bg-gray-50 border border-gray-200 text-muted hover:bg-gray-100'}`}
                                  title="Take photo">
                                  <Icon name="photo_camera" className="text-sm" />
                                  {item.image_url ? 'Retake' : 'Photo'}
                                </button>
                                {/* Report button — only when item is flagged as issue */}
                                {st === 'issue' && (() => {
                                  const rKey   = `${type}-${item.id}`;
                                  const rState = reportedItems[rKey];
                                  return (
                                    <button
                                      onClick={() => handleReportIssue(type, item)}
                                      disabled={!!rState}
                                      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all
                                        ${rState === 'done'
                                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 cursor-default'
                                          : rState === 'sending'
                                          ? 'bg-gray-50 border border-gray-200 text-muted cursor-wait'
                                          : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 active:scale-95'
                                        }`}>
                                      <Icon name={rState === 'done' ? 'check_circle' : rState === 'sending' ? 'hourglass_empty' : 'send'} fill={rState === 'done'} className="text-sm" />
                                      {rState === 'done' ? 'Reported' : rState === 'sending' ? 'Sending…' : 'Report to Admin'}
                                    </button>
                                  );
                                })()}
                              </div>
                              {item.image_url && (
                                <img loading="lazy" src={item.image_url} alt="Evidence photo" className={`w-full max-h-36 object-cover rounded-lg border ${st === 'issue' ? 'border-red-200' : 'border-gray-200'}`} />
                              )}
                            </div>
                          )}
                          {isAdmin && st === 'issue' && (
                            <div className="mt-1 space-y-1">
                              {item.note
                                ? <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 italic">{item.note}</div>
                                : <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-red-500 font-bold"><Icon name="warning" fill className="text-[14px]" /> Issue flagged — no note added</div>
                              }
                              {item.image_url && <img loading="lazy" src={item.image_url} alt="Issue photo" className="w-full max-h-36 object-cover rounded-lg border border-red-200" />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      };

      const eFld = (label, field, type='text') => (
        <div key={field}>
          <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">{label}</div>
          <input type={type} value={editFields[field] ?? ''} onChange={e => setEditFields(f => ({...f, [field]: e.target.value}))}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-navy outline-none focus:border-primary transition-colors" />
        </div>
      );
      const EditForm = () => (
        <div className="space-y-3">
          {eFld('Model',          'model')}
          {eFld('Variant',        'variant')}
          {eFld('Exterior Color', 'exterior_color')}
          {eFld('Interior Color', 'interior_color')}
          {eFld('VIN',            'vin')}
          {eFld('Engine No.',     'engine_number')}
          {eFld('CS No.',         'cs_number')}
          {eFld('Lot',            'lot')}
          {eFld('Year',           'year', 'number')}
          <div>
            <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Fuel</div>
            <select value={editFields.fuel||'Gasoline'} onChange={e => setEditFields(f => ({...f, fuel: e.target.value}))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-navy outline-none focus:border-primary transition-colors appearance-none">
              <option>Gasoline</option><option>Diesel</option><option>HEV</option><option>PHEV</option><option>Electric</option>
            </select>
          </div>
          {Object.keys(editFields._extra || {}).length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Additional Fields</div>
              {Object.entries(editFields._extra).map(([key, val]) => (
                <div key={key} className="mb-2">
                  <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">{key}</div>
                  <input value={String(val)} onChange={e => setEditFields(f => ({...f, _extra: {...f._extra, [key]: e.target.value}}))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-navy outline-none focus:border-primary transition-colors" />
                </div>
              ))}
            </div>
          )}
          <button onClick={saveEdit} className="w-full py-2.5 bg-primary text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 shadow-primary-glow hover:brightness-110 transition-all">
            <Icon name="save" className="text-sm" /> Save Changes
          </button>
          <button onClick={handleDelete} className="w-full py-2.5 bg-red-50 border border-red-200 text-red-600 font-bold text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 hover:bg-red-100 transition-all">
            <Icon name="delete_forever" className="text-sm" /> Delete Vehicle
          </button>
        </div>
      );

      /* stage-action buttons — used in both left col (desktop) and VEHICLE tab (mobile) */
      const StageActions = () => (<>
        {!isAdmin && v.stage === 'port' && (
          <button onClick={startPdi} className="w-full py-[14px] bg-primary text-white font-black text-[13px] uppercase tracking-[0.12em] rounded-full shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Icon name="play_arrow" fill className="text-xl" /> {t('startPdi')}
          </button>
        )}
        {!isAdmin && v.stage === 'pdi' && (
          <div className="space-y-2">
            <div className="bg-white rounded-[16px] p-3 shadow-card">
              <div className="flex justify-between text-[11px] mb-1.5"><span className="text-muted font-medium">{t('pdiProgress')}</span><span className="font-black text-navy">{pp.done}/{pp.total}</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${pp.pct}%`}} /></div>
            </div>
            {issues > 0 && <button onClick={putOnHold} className="w-full py-3 bg-red-500 text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-2 hover:bg-red-600 active:scale-[0.98] transition-all"><Icon name="pause_circle" fill className="text-lg" /> {t('putOnHold', {count:issues})}</button>}
            {pp.pct === 100 && issues === 0 && <button onClick={pdiPassToStock} className="w-full py-3 bg-emerald-500 text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-lg"><Icon name="check_circle" fill className="text-lg" /> {t('pdiPassed')}</button>}
          </div>
        )}
        {!isAdmin && v.stage === 'hold' && (
          <button onClick={resumePdi} className="w-full py-[14px] bg-primary text-white font-black text-[13px] uppercase tracking-[0.12em] rounded-full shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Icon name="play_arrow" fill className="text-xl" /> {t('resumePdi')}
          </button>
        )}
        {isAdmin && v.stage === 'hold' && (() => {
          const raw = v.historyRaw || [];
          const holdEntry = raw.find(h => h.stage_to === 'hold');
          const daysHeld = holdEntry ? Math.floor((Date.now() - new Date(holdEntry.created_at).getTime()) / 86400000) : null;
          const allIssues = [...(v.pdiChecks||[]).filter(c=>c.state==='issue').map(c=>({...c,_src:'PDI'})),...(v.finalChecks||[]).filter(c=>c.state==='issue').map(c=>({...c,_src:'Final'}))];
          const repairLog = raw.filter(h=>h.stage_from==='hold'&&h.stage_to==='hold').sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
          return (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-[14px] p-3 flex items-center gap-2">
                <Icon name="error" fill className="text-red-500 text-[20px] flex-shrink-0" />
                <div><div className="font-black text-red-700 text-[13px]">Vehicle On Hold</div><div className="text-[10px] text-red-500">{daysHeld !== null ? `${daysHeld}d on hold` : ''} · {allIssues.length} issue{allIssues.length!==1?'s':''}</div></div>
              </div>
              {allIssues.length > 0 && (
                <div className="bg-white rounded-[14px] p-3 shadow-card space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Flagged Issues</div>
                  {allIssues.map((c,i) => (
                    <div key={i} className="flex items-start gap-2 pb-2 border-b border-gray-50 last:border-0">
                      <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"/></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-navy">{c.name} <span className="text-[9px] font-bold bg-gray-100 text-muted px-1 rounded">{c._src}</span></div>
                        {c.note && <div className="text-[10px] text-red-600 italic mt-0.5">{c.note}</div>}
                        {c.image_url && <img loading="lazy" src={c.image_url} alt="" className="mt-1 w-full max-h-24 object-cover rounded-lg border border-red-200"/>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {repairLog.length > 0 && (
                <div className="bg-white rounded-[14px] p-3 shadow-card space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Repair Log</div>
                  {repairLog.map((h,i) => <div key={i} className="text-[10px] bg-gray-50 rounded px-2 py-1"><span className="font-bold text-muted">{h.created_at?new Date(h.created_at).toLocaleDateString():''}:</span> {h.action}</div>)}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { updateVehicle(v.id,car=>({...car,stage:'pdi'})); if(db){db.updateStage(v.id,'pdi').catch(console.error);db.insertHistory(v.id,'Sent back for re-inspection','hold','pdi').catch(console.error);} }} className="flex-1 py-2.5 border-2 border-primary text-primary font-black text-[11px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1 hover:bg-primary/5 transition-colors active:scale-95"><Icon name="restart_alt" className="text-sm"/> Re-inspect</button>
                <button onClick={() => { const today=todayStr(); updateVehicle(v.id,car=>({...car,stage:'stock'})); if(db){db.updateStage(v.id,'stock',{pdi_date:today,stock_date:today}).catch(console.error);db.insertHistory(v.id,'Cleared to stock','hold','stock').catch(console.error);} }} className="flex-1 py-2.5 bg-primary text-white font-black text-[11px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1 hover:brightness-110 transition-all active:scale-95"><Icon name="check_circle" className="text-sm"/> Clear to Stock</button>
              </div>
            </div>
          );
        })()}
        {!isAdmin && v.stage === 'stock' && (
          <button onClick={passToFinal} className="w-full py-[14px] bg-purple-600 text-white font-black text-[13px] uppercase tracking-[0.12em] rounded-full shadow-lg hover:bg-purple-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Icon name="local_shipping" fill className="text-xl" /> {t('passToFinal')}
          </button>
        )}
        {!isAdmin && v.stage === 'ready' && (
          <div className="space-y-2">
            <div className="bg-white rounded-[16px] p-3 shadow-card">
              <div className="flex justify-between text-[11px] mb-1.5"><span className="text-muted font-medium">{t('finalProgress')}</span><span className="font-black text-navy">{fp.done}/{fp.total}</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{width:`${fp.pct}%`}}/></div>
            </div>
            {fp.pct === 100 && (
              <div className="space-y-2">
                <input value={dealerName} onChange={e=>setDealerName(e.target.value)} placeholder={t('dealerPlaceholder')} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-navy placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
                <button onClick={releaseCar} disabled={!dealerName.trim()} className="w-full py-3 bg-emerald-500 text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"><Icon name="verified" fill className="text-lg"/> {t('releaseToDealer')}</button>
              </div>
            )}
          </div>
        )}
      </>);

      return (
        <div className="fixed inset-0 bg-black/50 z-50 anim-fade-in flex items-end lg:items-center justify-center" onClick={onClose}>
          <input ref={vehicleImgRef} type="file" accept="image/*" className="hidden" onChange={handleVehicleImgUpload} />
          <input ref={issueImgRef}   type="file" accept="image/*" capture="environment" className="hidden" onChange={handleIssueImgUpload} />
          {showCamera && (
            <CameraModal
              onCapture={handleCameraCapture}
              onClose={() => { setShowCamera(false); setImgCheckInfo(null); }}
              onFallback={() => { setShowCamera(false); issueImgRef.current?.click(); }}
            />
          )}

          {/* Panel — mobile: bottom sheet · desktop: centered dialog */}
          <div className="w-full max-w-[430px] lg:max-w-[960px] bg-[#F5F5F5] rounded-t-[32px] lg:rounded-[24px] shadow-2xl anim-slide-up flex flex-col lg:flex-row overflow-hidden" style={{ maxHeight:'94vh' }} onClick={e => e.stopPropagation()}>

            {/* ═══ LEFT COLUMN ═══ */}
            <div className="flex-shrink-0 lg:w-[300px] flex flex-col lg:bg-white lg:border-r lg:border-gray-100">

              {/* Mobile drag handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 flex-shrink-0 lg:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[17px] font-black text-navy truncate">{v.label || v.model}</span>
                  <StatusBadge status={v.stage} t={t} />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isAdmin && canEditVehicle && (
                    <button onClick={() => editMode ? setEditMode(false) : startEdit()}
                      className={`p-2 rounded-full transition-colors ${editMode ? 'bg-primary/10 text-primary' : 'hover:bg-gray-200 text-navy'}`}
                      title={editMode ? 'Cancel edit' : 'Edit vehicle'}>
                      <Icon name={editMode ? 'edit_off' : 'edit'} className="text-[18px]" />
                    </button>
                  )}
                  <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Icon name="close" className="text-navy" /></button>
                </div>
              </div>

              {/* Vehicle image + quick-info */}
              <div className="bg-white px-5 py-3 flex items-center gap-4 border-b border-gray-100 flex-shrink-0">
                <div className="relative w-24 h-16 lg:w-28 lg:h-20 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 group cursor-pointer" onClick={() => vehicleImgRef.current?.click()}>
                  <img loading="lazy" src={v.img} alt={v.model} className="w-full h-full object-contain p-1" />
                  {uploading ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>
                  ) : (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                      <Icon name="photo_camera" className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-navy leading-tight">{v.model}</h2>
                  <p className="text-[11px] text-muted">{v.color} · {v.engine}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted"><Icon name="fingerprint" className="text-xs text-primary" />{v.vin.slice(0,10)}…</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted"><Icon name="location_on" className="text-xs text-primary" />{t('lot')} {v.lot}</div>
                  </div>
                </div>
              </div>

              {/* Desktop-only: vehicle details or edit form */}
              <div className="hidden lg:flex flex-col flex-1 overflow-y-auto p-4 space-y-4">
                {editMode ? <EditForm /> : (<>
                  <div className="bg-white rounded-[16px] p-4 shadow-card space-y-1">
                    {[
                      ['Invoice #',      v.invoiceNumber],
                      ['CS No.',         v.csNumber],
                      ['Contract No.',   v.contractNo],
                      ['Model',          v.model],
                      ['Variant',        v.variant],
                      ['Year',           String(v.year)],
                      ['Exterior Color', v.exteriorColor],
                      ['Interior Color', v.interiorColor],
                      ['Fuel',           v.fuel],
                      ['VIN',            v.vin],
                      ['Engine No.',     v.engineNumber],
                      ['BL No.',         v.blNumber],
                      ['Lot',            v.lot],
                      ['Region',         v.region],
                      ['Dealer Group',   v.dealerGroup],
                      ['Dealer',         v.dealer],
                      ['Port Arrival',   fmtDate(v.arrivalDate)],
                      ['Assigned To',    tech.name],
                    ].filter(([,val]) => val && val !== '—').map(([k,val]) => (
                      <div key={k} className="flex justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-[11px] text-muted font-medium flex-shrink-0">{k}</span>
                        <span className="text-[11px] font-bold text-navy text-right min-w-0 break-all" title={val}>{val}</span>
                      </div>
                    ))}
                  </div>
                  {Object.keys(v.extraFields || {}).length > 0 && (
                    <div className="bg-white rounded-[16px] p-4 shadow-card space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Additional Information</div>
                      {Object.entries(v.extraFields).map(([key, val]) => (
                        <div key={key} className="flex justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                          <span className="text-[11px] text-muted font-medium flex-shrink-0">{key}</span>
                          <span className="text-[11px] font-bold text-navy text-right min-w-0 break-all" title={String(val)}>{/date|arrival/i.test(key) ? fmtDate(String(val)) : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <StageActions />
                </>)}
              </div>
            </div>{/* end LEFT COLUMN */}

            {/* ═══ RIGHT COLUMN ═══ */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <nav className="bg-white border-b border-gray-100 flex px-2 flex-shrink-0">
                {[['VEHICLE','tabVehicle','lg:hidden'],['PDI','tabPdi',''],['MAINT','tabMaint',''],['FINAL','tabFinal',''],['NOTES','tabNotes',''],['REPORTS','tabReports',''],['HISTORY','tabHistory','']].map(([key,tKey,extra]) => (
                  <button key={key} onClick={() => setTab(key)}
                    className={`flex-1 py-3 text-[9px] font-bold tracking-widest transition-colors ${extra} ${tab === key ? 'text-primary border-b-2 border-primary' : 'text-muted border-b-2 border-transparent'}`}>
                    {t(tKey)}
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-4 pb-8">

                {/* VEHICLE tab — mobile only */}
                {tab === 'VEHICLE' && (
                  <div className="space-y-4 lg:hidden">
                    <div className="bg-white rounded-[16px] p-4 shadow-card space-y-1">
                      {[
                        ['Invoice #',      v.invoiceNumber],
                        ['CS No.',         v.csNumber],
                        ['Contract No.',   v.contractNo],
                        ['Model',          v.model],
                        ['Variant',        v.variant],
                        ['Year',           String(v.year)],
                        ['Exterior Color', v.exteriorColor],
                        ['Interior Color', v.interiorColor],
                        ['Fuel',           v.fuel],
                        ['VIN',            v.vin],
                        ['Engine No.',     v.engineNumber],
                        ['BL No.',         v.blNumber],
                        ['Lot',            v.lot],
                        ['Region',         v.region],
                        ['Dealer Group',   v.dealerGroup],
                        ['Dealer',         v.dealer],
                        ['Port Arrival',   fmtDate(v.arrivalDate)],
                        ['Assigned To',    tech.name],
                      ].filter(([,val]) => val && val !== '—').map(([k,val]) => (
                        <div key={k} className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                          <span className="text-[12px] text-muted font-medium flex-shrink-0">{k}</span>
                          <span className="text-[12px] font-bold text-navy text-right min-w-0 break-all" title={val}>{val}</span>
                        </div>
                      ))}
                    </div>
                    {Object.keys(v.extraFields || {}).length > 0 && (
                      <div className="bg-white rounded-[16px] p-4 shadow-card space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Additional Information</div>
                        {Object.entries(v.extraFields).map(([key, val]) => (
                          <div key={key} className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                            <span className="text-[12px] text-muted font-medium flex-shrink-0">{key}</span>
                            <span className="text-[12px] font-bold text-navy text-right min-w-0 break-all" title={String(val)}>{/date|arrival/i.test(key) ? fmtDate(String(val)) : String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {editMode ? <EditForm /> : <StageActions />}
                  </div>
                )}

                {/* PDI + FINAL tabs */}
                {(tab === 'PDI' || tab === 'FINAL') && (() => {
                  const type    = tab === 'PDI' ? 'pdi' : 'final';
                  const checks  = type === 'pdi' ? v.pdiChecks : v.finalChecks;
                  const done    = checks.filter(c => c.state === 'done' || c.state === 'na').length;
                  const issues  = checks.filter(c => c.state === 'issue').length;
                  const pending = checks.filter(c => c.state === 'pending').length;
                  const cState  = confirmState[type] || 'idle';
                  return (
                    <div className="space-y-4">
                      {ChecklistTab({ type, checks })}
                      {!isAdmin && (
                        <div className="bg-white rounded-[20px] p-4 shadow-card space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><Icon name="check_circle" fill className="text-[13px]" /> {done} done</span>
                              {issues > 0 && <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><Icon name="error" fill className="text-[13px]" /> {issues} issue{issues!==1?'s':''}</span>}
                              {pending > 0 && <span className="flex items-center gap-1 text-[11px] font-bold text-muted bg-gray-100 px-2 py-0.5 rounded-full"><Icon name="radio_button_unchecked" className="text-[13px]" /> {pending} pending</span>}
                            </div>
                            <span className="text-[11px] font-black text-navy">{done}/{checks.length}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${issues > 0 ? 'bg-red-400' : 'bg-emerald-500'}`} style={{ width:`${checks.length?(done/checks.length)*100:0}%` }} />
                          </div>
                          <button onClick={() => handleConfirmSave(type)} disabled={cState==='saving'}
                            className={`w-full py-3.5 rounded-full font-black text-[13px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${cState==='saved'?'bg-emerald-500 text-white shadow-lg shadow-emerald-200':cState==='saving'?'bg-gray-200 text-muted cursor-wait':'bg-primary text-white shadow-primary-glow hover:brightness-110'}`}>
                            <Icon name={cState==='saved'?'check_circle':cState==='saving'?'hourglass_empty':'cloud_upload'} fill={cState==='saved'} className="text-xl" />
                            {cState==='saved'?'Checklist Saved!':cState==='saving'?'Saving…':`Confirm & Save ${tab} Checklist`}
                          </button>
                          {cState==='saved' && <p className="text-[10px] text-emerald-600 text-center font-medium">All {checks.length} items saved · visible to admin</p>}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* MAINT tab */}
                {tab === 'MAINT' && (
                  <div className="space-y-2">
                    {v.stockMaint.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Icon name="build_circle" fill className="text-muted text-[52px] mb-3 opacity-40" />
                        <div className="text-[13px] font-bold text-muted">{t('noMaintenance')}</div>
                        <div className="text-[11px] text-muted/60 mt-1">{t('maintHint')}</div>
                      </div>
                    ) : v.stockMaint.map((m, idx) => {
                      const overDays  = daysAgo(m.nextDue);
                      const isOverdue = overDays >= 0;
                      const isDueSoon = overDays >= -7 && overDays < 0;
                      return (
                        <div key={m.id} className={`bg-white rounded-[16px] p-3 shadow-card border-l-4 ${isOverdue?'border-red-400':isDueSoon?'border-amber-400':'border-emerald-400'}`}>
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-navy leading-snug">{m.name}</div>
                              <div className="flex items-center gap-2 mt-1"><StatusBadge status={m.priority} /><span className="text-[10px] text-muted">{t('every',{freq:m.freq})}</span></div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              {isOverdue?<span className="text-[10px] font-black text-red-600">{t('overdueD',{days:overDays})}</span>:isDueSoon?<span className="text-[10px] font-black text-amber-600">{t('dueIn',{days:Math.abs(overDays)})}</span>:<span className="text-[10px] font-bold text-emerald-600">{t('next')} {m.nextDue}</span>}
                              <div className="text-[9px] text-muted mt-0.5">{t('last')} {m.lastDone}</div>
                            </div>
                          </div>
                          {!isAdmin && (
                            <button onClick={() => completeMaint(idx)} className="mt-2 w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 hover:bg-emerald-100 active:scale-95 transition-all">
                              <Icon name="check" className="text-sm" /> {t('done')}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* NOTES tab */}
                {tab === 'NOTES' && (
                  <div className="space-y-3">
                    <textarea value={v.notes}
                      onChange={e => { const val=e.target.value; updateVehicle(v.id, car=>({...car, notes:val})); }}
                      onBlur={e => { if(db) sb.from('vehicles').update({notes:e.target.value}).eq('id',v.id).catch(console.error); }}
                      rows={6} placeholder={t('addNotes')}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-navy placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none shadow-card"
                      disabled={isAdmin} />
                  </div>
                )}

                {/* REPORTS tab — issue log */}
                {tab === 'REPORTS' && (
                  <div className="space-y-4">
                    {/* Submit new issue */}
                    <div className="bg-white rounded-[16px] p-4 shadow-card space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted">Report an Issue</div>
                      <textarea
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                        rows={3}
                        placeholder="Describe the issue with this vehicle…"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-navy placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
                      />
                      <button
                        onClick={submitReport}
                        disabled={!reportText.trim() || submittingReport}
                        className="w-full py-2.5 bg-primary text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 shadow-primary-glow hover:brightness-110 transition-all disabled:opacity-40 active:scale-[0.98]">
                        <Icon name="flag" fill className="text-sm" />
                        {submittingReport ? 'Submitting…' : 'Report Issue'}
                      </button>
                    </div>
                    {/* Issue list */}
                    {loadingReports ? (
                      <div className="flex justify-center py-8"><div className="w-5 h-5 border-[3px] border-primary border-t-transparent rounded-full animate-spin" /></div>
                    ) : reports.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Icon name="report_off" fill className="text-muted text-[48px] mb-3 opacity-40" />
                        <div className="text-[13px] font-bold text-muted">No issues reported</div>
                        <div className="text-[11px] text-muted/60 mt-1">Use the form above to log a vehicle issue</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map(r => (
                          <div key={r.id} className="bg-white rounded-[16px] p-4 shadow-card border-l-4 border-red-400">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <Icon name="flag" fill className="text-red-500 text-[14px]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Issue Report</span>
                              </div>
                              <span className="text-[10px] text-muted flex-shrink-0">{fmtDate(r.created_at?.split('T')[0])}</span>
                            </div>
                            <p className="text-[12px] text-navy leading-relaxed">{r.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* HISTORY tab */}
                {tab === 'HISTORY' && (
                  <div>
                    {v.history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Icon name="history" fill className="text-muted text-[52px] mb-3 opacity-40" />
                        <div className="text-[13px] font-bold text-muted">{t('noHistory')}</div>
                      </div>
                    ) : (
                      <div className="relative pl-8">
                        <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-200 rounded-full" />
                        {v.history.map((entry, i) => {
                          const [date, ...rest] = entry.split(': ');
                          const text = rest.join(': ');
                          return (
                            <div key={i} className="relative mb-4">
                              <div className="absolute -left-[18px] top-0 w-7 h-7 rounded-full flex items-center justify-center bg-white border-2 border-gray-200">
                                <Icon name="schedule" fill className="text-muted text-[14px]" />
                              </div>
                              <div className="bg-white rounded-[14px] p-3 shadow-card">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-semibold text-navy text-[12px] leading-snug">{text}</span>
                                  <span className="text-[10px] text-muted font-medium flex-shrink-0">{date}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>{/* end RIGHT COLUMN */}

          </div>{/* end panel */}
        </div>
      );
    }

