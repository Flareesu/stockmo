    /* ─── AdminDashboard ─── */
    function AdminDashboard({ navigate, vehicles, technicians, onNotificationClick, onAddVehicle, unreadCount, onOpenDetail, t, canEdit: canEditProp = true, role, pipelineStages = [] }) {
      const all = vehicles;
      const [showModelsModal, setShowModelsModal] = useState(false);
      const [modelSearch, setModelSearch]         = useState('');

      // Default stage config used when pipeline_stages not yet loaded
      const DEFAULT_STAGE_META = {
        port:     { name: 'Port / Inbound',     color: '#F59E0B' },
        pdi:      { name: 'PDI',                color: '#10B981' },
        hold:     { name: 'On Hold',            color: '#EF4444' },
        stock:    { name: 'In Stock',           color: '#3B82F6' },
        ready:    { name: 'Ready for Delivery', color: '#8B5CF6' },
        released: { name: 'Released',           color: '#059669' },
      };

      // Build dynamic stage list from DB — fall back to defaults if not loaded
      const stagesActive = pipelineStages.filter(s => s.active).sort((a,b) => a.ord - b.ord);
      const STAGE_KEYS = stagesActive.length
        ? stagesActive.map(s => s.slug)
        : Object.keys(DEFAULT_STAGE_META);
      const STAGE_META = stagesActive.length
        ? Object.fromEntries(stagesActive.map(s => [s.slug, s]))
        : DEFAULT_STAGE_META;

      const { pipeline, holdVehicles, recent, modelsInPipeline } = React.useMemo(() => {
        const counts = {};
        STAGE_KEYS.forEach(k => { counts[k] = 0; });
        const holds = [];
        const recentList = [];
        const NON_RELEASED = STAGE_KEYS.filter(k => k !== 'released');
        const modelMap = {};
        all.forEach(v => {
          if (counts[v.stage] !== undefined) counts[v.stage] += 1;
          if (v.stage === 'hold') {
            const issues = [
              ...(v.pdiChecks  || []).filter(c => c.state === 'issue').map(c => ({ ...c, _src: 'PDI'   })),
              ...(v.finalChecks || []).filter(c => c.state === 'issue').map(c => ({ ...c, _src: 'Final' })),
            ];
            const holdEntry = (v.historyRaw || []).find(h => h.stage_to === 'hold');
            const daysHeld  = holdEntry
              ? Math.floor((Date.now() - new Date(holdEntry.created_at).getTime()) / 86400000)
              : null;
            holds.push({ ...v, issues, daysHeld });
          }
          if (NON_RELEASED.includes(v.stage)) {
            const key = (v.model || 'Unknown') + (v.variant ? ` · ${v.variant}` : '');
            if (!modelMap[key]) modelMap[key] = { name: key, total: 0, byStage: {} };
            modelMap[key].total += 1;
            modelMap[key].byStage[v.stage] = (modelMap[key].byStage[v.stage] || 0) + 1;
          }
          v.history.slice(0, 2).forEach(h => recentList.push({ vid: v.label || v.model, text: h }));
        });
        recentList.sort((a, b) => b.text.localeCompare(a.text));
        const stageColors = Object.fromEntries(STAGE_KEYS.map(k => [k, STAGE_META[k]?.color || '#6b7280']));
        return {
          pipeline: STAGE_KEYS.map(k => ({
            label: (STAGE_META[k]?.name || k).toUpperCase(),
            count: counts[k] || 0,
            color: STAGE_META[k]?.color || '#6b7280',
          })),
          holdVehicles: holds,
          recent: recentList,
          modelsInPipeline: {
            rows: Object.values(modelMap).sort((a,b) => b.total - a.total),
            stages: NON_RELEASED,
            colors: stageColors,
          },
        };
      }, [all, STAGE_KEYS.join(','), JSON.stringify(STAGE_META)]);

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-6 pb-4 shadow-card lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
                  <Icon name="garage" fill className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-black text-navy text-[15px] leading-tight">StockMo</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{t('administratorPanel')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={onNotificationClick} className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <Icon name="notifications" className="text-navy" />
                  {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
                </button>
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-[11px] font-black">JD</div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
            <div className="bg-white px-5 lg:px-8 pb-5 pt-3 lg:pt-7 border-b border-gray-100">
              <div className="lg:max-w-7xl lg:mx-auto">
                <h1 className="text-[22px] lg:text-[28px] font-black text-navy mt-3 lg:mt-0 leading-tight">{t('fleetOperations')}</h1>
                <div className="flex gap-3 mt-3 lg:mt-4 lg:w-fit">
                  <button className="flex-1 lg:flex-none lg:px-6 py-2.5 border-2 border-primary text-primary font-bold text-[11px] uppercase tracking-widest rounded-full flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors">
                    <Icon name="upload" className="text-base" /> {t('exportReport')}
                  </button>
                  {canEditProp && (
                    <button onClick={onAddVehicle} className="flex-1 lg:flex-none lg:px-6 py-2.5 bg-primary text-white font-bold text-[11px] uppercase tracking-widest rounded-full flex items-center justify-center gap-1.5 shadow-primary-glow hover:brightness-110 transition-all">
                      <Icon name="add" fill className="text-base" /> {t('addVehicle')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 lg:px-8 lg:py-6 space-y-4 lg:max-w-7xl lg:mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {[
                  { label:t('totalFleet'), value:all.length,                                      icon:'directions_car', ic:'text-navy'       },
                  { label:t('inbound'),   value:all.filter(v=>v.stage==='port').length,           icon:'local_shipping', ic:'text-amber-500'  },
                  { label:t('processing'),value:all.filter(v=>['pdi','hold'].includes(v.stage)).length, icon:'settings', ic:'text-blue-500'   },
                  { label:t('dispatched'),value:all.filter(v=>v.stage==='released').length,       icon:'verified',       ic:'text-emerald-500'},
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-[16px] p-4 lg:p-5 shadow-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-[11px] text-muted font-medium">{s.label}</div>
                      <Icon name={s.icon} fill className={`${s.ic} text-[22px]`} />
                    </div>
                    <div className="text-[28px] lg:text-[36px] font-black text-navy leading-none">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-[20px] p-4 lg:p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="bar_chart" fill className="text-primary text-[22px]" />
                  <span className="font-bold text-navy text-[14px] lg:text-[16px]">{t('pipelineProgress')}</span>
                </div>
                <div className="flex items-stretch gap-2 lg:gap-3 overflow-x-auto no-scroll snap-x snap-mandatory pb-1 -mx-1 px-1">
                  {pipeline.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => navigate('fleet-list')}
                      className="no-min snap-start flex-shrink-0 min-w-[100px] lg:flex-1 lg:min-w-0 bg-white rounded-xl shadow-card border-l-[3px] flex flex-col items-start px-2.5 py-2.5 lg:px-3 lg:py-3 gap-1 active:scale-[0.98] lg:hover:shadow-card-hover transition-all"
                      style={{ borderLeftColor: p.color }}>
                      <span className="text-[16px] lg:text-[22px] font-black leading-none" style={{ color: p.color }}>
                        {String(p.count).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-wider text-muted leading-tight text-left w-full">
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Models in Pipeline */}
              {modelsInPipeline.rows.length > 0 && (
                <div className="bg-white rounded-[20px] p-4 lg:p-6 shadow-card">
                  <button className="flex items-center justify-between w-full mb-3" onClick={() => setShowModelsModal(true)}>
                    <div className="flex items-center gap-2">
                      <Icon name="directions_car" fill className="text-primary text-[22px]" />
                      <span className="font-bold text-navy text-[14px] lg:text-[16px]">Models in Pipeline</span>
                    </div>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      {modelsInPipeline.rows.reduce((a,r) => a + r.total, 0)} active units
                    </span>
                  </button>
                  <div className="space-y-1.5">
                    {modelsInPipeline.rows.slice(0, 5).map(row => (
                      <div key={row.name} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-navy truncate">{row.name}</div>
                          <div className="flex gap-0.5 mt-1 h-1.5 rounded-full overflow-hidden w-full">
                            {modelsInPipeline.stages.map(s => {
                              const c = row.byStage[s] || 0;
                              if (!c) return null;
                              return (
                                <div key={s} style={{ width: (c / row.total * 100).toFixed(1) + '%', background: modelsInPipeline.colors[s] }} className="h-full" title={`${c} ${(STAGE_META[s]?.name || s).toUpperCase()}`} />
                              );
                            })}
                          </div>
                        </div>
                        <span className="text-[15px] font-black text-navy flex-shrink-0">{row.total}</span>
                      </div>
                    ))}
                  </div>
                  {modelsInPipeline.rows.length > 0 && (
                    <button onClick={() => setShowModelsModal(true)}
                      className="w-full mt-2.5 py-1.5 text-[11px] font-bold text-primary hover:underline text-center">
                      View all {modelsInPipeline.rows.length} model{modelsInPipeline.rows.length !== 1 ? 's' : ''} →
                    </button>
                  )}
                </div>
              )}

              {/* Models in Pipeline — full modal */}
              {showModelsModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-end lg:items-center justify-center" onClick={() => setShowModelsModal(false)}>
                  <div className="bg-white rounded-t-[28px] lg:rounded-[28px] w-full lg:max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Icon name="directions_car" fill className="text-primary text-[22px]" />
                        <span className="font-black text-navy text-[16px]">All Models in Pipeline</span>
                      </div>
                      <button onClick={() => setShowModelsModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon name="close" className="text-navy" />
                      </button>
                    </div>
                    <div className="px-5 pt-3 flex-shrink-0">
                      <input
                        value={modelSearch}
                        onChange={e => setModelSearch(e.target.value)}
                        placeholder="Search models…"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-navy outline-none focus:border-primary transition-colors"
                      />
                      {/* Stage legend */}
                      <div className="flex flex-wrap gap-2 mt-2 mb-1">
                        {modelsInPipeline.stages.map(s => (
                          <span key={s} className="flex items-center gap-1 text-[9px] font-bold text-muted uppercase tracking-wide">
                            <span style={{ background: modelsInPipeline.colors[s] }} className="w-2 h-2 rounded-full flex-shrink-0" />
                            {STAGE_META[s]?.name || s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-1.5 mt-1">
                      {modelsInPipeline.rows
                        .filter(r => r.name.toLowerCase().includes(modelSearch.toLowerCase()))
                        .map(row => (
                          <div key={row.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-navy truncate">{row.name}</div>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {modelsInPipeline.stages.map(s => {
                                  const c = row.byStage[s] || 0;
                                  if (!c) return null;
                                  return (
                                    <span key={s} className="flex items-center gap-1 text-[10px] font-bold text-muted">
                                      <span style={{ background: modelsInPipeline.colors[s] }} className="w-1.5 h-1.5 rounded-full" />
                                      {c} {(STAGE_META[s]?.name || s).toUpperCase()}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <span className="text-[16px] font-black text-navy flex-shrink-0">{row.total}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {holdVehicles.length > 0 && (
                <div className="bg-white rounded-[20px] p-4 shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="warning" fill className="text-primary text-[22px]" />
                      <span className="font-bold text-navy text-[14px]">{t('needsAttention')}</span>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-red-50 px-2.5 py-0.5 rounded-full">{holdVehicles.length} on hold</span>
                  </div>
                  <div className="space-y-3">
                    {holdVehicles.map(hv => (
                      <button key={hv.id} onClick={() => onOpenDetail(hv.id)}
                        className="w-full bg-red-50 border border-red-200 rounded-[16px] p-3 text-left hover:brightness-95 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          {hv.img
                            ? <img loading="lazy" src={hv.img} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-red-200" />
                            : <div className="w-10 h-10 rounded-xl bg-red-100 flex-shrink-0 flex items-center justify-center">
                                <Icon name="directions_car" fill className="text-red-400 text-[20px]" />
                              </div>
                          }
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-black text-navy truncate">{hv.label || hv.model}</span>
                              <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">HOLD</span>
                            </div>
                            <div className="text-[10px] text-muted">
                              {hv.issues.length} issue{hv.issues.length !== 1 ? 's' : ''} flagged
                              {hv.daysHeld !== null ? ` · ${hv.daysHeld}d on hold` : ''}
                            </div>
                          </div>
                          <Icon name="chevron_right" className="text-muted flex-shrink-0" />
                        </div>
                        {hv.issues.length > 0 && (
                          <div className="space-y-1">
                            {hv.issues.slice(0, 3).map((iss, i) => (
                              <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-red-100">
                                <Icon name="error" fill className="text-red-500 text-[14px] flex-shrink-0" />
                                <span className="text-[10px] font-semibold text-navy flex-1 truncate">{iss.name}</span>
                                <span className="text-[9px] text-muted flex-shrink-0">{iss._src}</span>
                                {iss.image_url && <Icon name="photo_camera" fill className="text-blue-400 text-[12px] flex-shrink-0" />}
                              </div>
                            ))}
                            {hv.issues.length > 3 && (
                              <div className="text-[10px] text-muted text-center pt-0.5">+{hv.issues.length - 3} more issues</div>
                            )}
                          </div>
                        )}
                        {hv.issues.length === 0 && (
                          <div className="text-[10px] text-muted italic px-1">No issues logged yet — inspect vehicle to add details</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white rounded-[20px] p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="group" fill className="text-navy text-[22px]" />
                  <span className="font-bold text-navy text-[14px]">{t('technicianStatus')}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {technicians.slice(0,3).map(tc => (
                    <div key={tc.id} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm" style={{backgroundColor:tc.color}}>{tc.ini}</div>
                  ))}
                  <span className="text-[12px] font-semibold text-navy ml-1">{technicians.filter(tc=>tc.online).length} {t('online')}</span>
                </div>
              </div>
              <div className="bg-white rounded-[20px] p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="update" fill className="text-navy text-[22px]" />
                  <span className="font-bold text-navy text-[14px]">{t('recentActivity')}</span>
                </div>
                <div className="space-y-2">
                  {recent.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Icon name="schedule" fill className="text-muted text-[18px] flex-shrink-0 mt-0.5" />
                      <div className="text-[12px] text-navy font-medium">{a.vid}: {a.text.split(': ').slice(1).join(': ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
          <AdminBottomNav navigate={navigate} currentView="admin-dashboard" vehicles={vehicles} t={t} role={role} />
        </div>
      );
    }

