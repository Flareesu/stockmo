    /* ─── FleetListScreen ─── */
    const PAGE_SIZE = 50;

    function FleetListScreen({ navigate, vehicles, onAddVehicle, onImportFleet, onNotificationClick, unreadCount, onOpenDetail, t, canEdit: canEditProp = true, role, pipelineStages = [] }) {
      const all = vehicles;
      const [search, setSearch]         = useState('');
      const [stage, setStage]           = useState('all');
      const [page, setPage]             = useState(0);
      const [showSuggestions, setShowSuggestions] = useState(false);
      const searchRef = useRef(null);

      // Build dynamic stage list from pipelineStages prop (fall back to known slugs if not loaded)
      const stagesActive = pipelineStages.filter(s => s.active).sort((a, b) => a.ord - b.ord);
      const stageSlugs   = ['all', ...stagesActive.map(s => s.slug)];
      const stageMeta    = Object.fromEntries(stagesActive.map(s => [s.slug, s]));

      const counts = useMemo(() => {
        const acc = { all: all.length };
        stagesActive.forEach(s => { acc[s.slug] = all.filter(v => v.stage === s.slug).length; });
        return acc;
      }, [all, stageSlugs.join(',')]);

      // Full filtered list (no pagination)
      const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return all.filter(v => {
          const ms = !q
            || (v.label||v.model).toLowerCase().includes(q)
            || (v.vin||'').toLowerCase().includes(q)
            || (v.variant||'').toLowerCase().includes(q)
            || (v.exteriorColor||v.color||'').toLowerCase().includes(q)
            || (v.interiorColor||'').toLowerCase().includes(q)
            || (v.csNumber||'').toLowerCase().includes(q)
            || (v.engineNumber||'').toLowerCase().includes(q)
            || (v.invoiceNumber||'').toLowerCase().includes(q)
            || (v.dealer||'').toLowerCase().includes(q)
            || (v.dealerGroup||'').toLowerCase().includes(q)
            || (v.region||'').toLowerCase().includes(q)
            || (v.lot||'').toLowerCase().includes(q)
            || Object.values(v.extraFields||{}).some(val => String(val).toLowerCase().includes(q));
          return ms && (stage === 'all' || v.stage === stage);
        });
      }, [all, search, stage]);

      // Reset page whenever filter changes
      useEffect(() => { setPage(0); }, [search, stage]);

      // Pagination slice
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
      const showFrom = filtered.length ? page * PAGE_SIZE + 1 : 0;
      const showTo   = Math.min((page + 1) * PAGE_SIZE, filtered.length);

      // Smart search suggestions — model and color attribute counts
      const suggestions = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (q.length < 2) return null;
        const modelMap = {}, colorMap = {};
        all.forEach(v => {
          const m = v.model || '';
          const c = v.color || '';
          if (m.toLowerCase().includes(q)) modelMap[m] = (modelMap[m] || 0) + 1;
          if (c.toLowerCase().includes(q)) colorMap[c] = (colorMap[c] || 0) + 1;
        });
        const models = Object.entries(modelMap).sort((a,b) => b[1]-a[1]);
        const colors = Object.entries(colorMap).sort((a,b) => b[1]-a[1]);
        return (models.length || colors.length) ? { models, colors } : null;
      }, [all, search]);

      const applySuggestion = (val) => { setSearch(val); setShowSuggestions(false); };

      // Model-level aggregation for overview cards
      const modelSummary = useMemo(() => {
        const map = {};
        all.forEach(v => {
          const key = v.model || 'Unknown';
          if (!map[key]) map[key] = {
            model: key,
            total: 0,
            byStage: {},         // dynamic: slug → count
            variantCounts: {},   // variant label → count
            colorCounts: {},     // color label → count
            years: new Set(),
            dealers: new Set(),
          };
          const m = map[key];
          m.total++;
          m.byStage[v.stage] = (m.byStage[v.stage] || 0) + 1;
          const variant = (v.variant || '').trim() || '(Standard)';
          m.variantCounts[variant] = (m.variantCounts[variant] || 0) + 1;
          const color = (v.exteriorColor || v.color || '').trim() || '(Unknown)';
          m.colorCounts[color] = (m.colorCounts[color] || 0) + 1;
          if (v.year) m.years.add(String(v.year));
          if (v.dealer) m.dealers.add(v.dealer);
        });
        return Object.values(map)
          .map(m => ({
            ...m,
            // sorted arrays of [label, count] pairs for display
            variants: Object.entries(m.variantCounts).sort((a, b) => b[1] - a[1]),
            colors:   Object.entries(m.colorCounts).sort((a, b) => b[1] - a[1]),
            years:    [...m.years],
            dealers:  [...m.dealers],
          }))
          .sort((a, b) => b.total - a.total);
      }, [all]);

      const [selectedModel, setSelectedModel] = useState(null);

      // Close suggestions on outside click
      useEffect(() => {
        const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
      }, []);

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-7 pb-4 shadow-card">
            <div className="lg:max-w-7xl lg:mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-primary rounded-xl items-center justify-center shadow-md shadow-primary/30 hidden lg:flex">
                    <Icon name="garage" fill className="text-white text-lg" />
                  </div>
                  <div>
                    <div className="font-black text-navy text-[15px] lg:text-[22px] leading-tight">{t('fleet')}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{t('vehicles', {count:all.length})}</div>
                  </div>
                </div>
                <button onClick={onNotificationClick} className="relative p-1.5 hover:bg-gray-100 rounded-full lg:hidden">
                  <Icon name="notifications" className="text-navy" />
                  {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
                </button>
                {/* Import button (desktop text, mobile icon) — edit-only */}
                {canEditProp && (<>
                <button onClick={onImportFleet}
                  className="w-9 h-9 lg:w-auto lg:px-4 lg:rounded-full bg-gray-100 text-navy rounded-full flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                  <Icon name="upload_file" className="text-navy text-base" />
                  <span className="hidden lg:inline font-bold text-[12px] uppercase tracking-widest">Import</span>
                </button>
                <button onClick={onAddVehicle} className="w-9 h-9 lg:w-auto lg:px-4 lg:rounded-full bg-primary rounded-full flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 transition-all">
                  <Icon name="add" fill className="text-white text-base" />
                  <span className="hidden lg:inline text-white font-bold text-[12px] uppercase tracking-widest">{t('addVehicle')}</span>
                </button>
                </>)}
              </div>
              {/* Search bar with suggestions */}
              <div ref={searchRef} className="relative">
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                  <Icon name="search" className="text-muted text-xl" />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search model, color, VIN, lot…"
                    className="flex-1 bg-transparent text-[13px] text-navy placeholder:text-muted outline-none"
                  />
                  {search && <button onClick={() => { setSearch(''); setShowSuggestions(false); }}><Icon name="close" className="text-muted text-xl" /></button>}
                </div>
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-[16px] shadow-card-hover border border-gray-100 z-30 overflow-hidden max-h-[280px] overflow-y-auto">
                    {suggestions.models.length > 0 && (
                      <div>
                        <div className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.15em] text-muted">Models</div>
                        {suggestions.models.map(([name, count]) => (
                          <button key={name} onMouseDown={() => applySuggestion(name)}
                            className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors text-left">
                            <span className="text-[13px] font-semibold text-navy">{name}</span>
                            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{count} unit{count !== 1 ? 's' : ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestions.colors.length > 0 && (
                      <div className={suggestions.models.length ? 'border-t border-gray-50' : ''}>
                        <div className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.15em] text-muted">Colors</div>
                        {suggestions.colors.map(([name, count]) => (
                          <button key={name} onMouseDown={() => applySuggestion(name)}
                            className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors text-left">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-gray-300 border border-gray-200 flex-shrink-0" />
                              <span className="text-[13px] font-semibold text-navy">{name}</span>
                            </div>
                            <span className="text-[11px] font-bold text-muted bg-gray-100 px-2 py-0.5 rounded-full">{count} unit{count !== 1 ? 's' : ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Stage filter pills — driven by pipeline_stages table */}
          <div className="bg-white px-4 lg:px-8 pb-3 pt-3 flex gap-2 overflow-x-auto no-scroll border-b border-gray-100">
            <div className="lg:max-w-7xl lg:mx-auto flex gap-2 w-full">
              {stageSlugs.map(s => {
                const meta    = stageMeta[s];
                const isActive = stage === s;
                const hexColor = meta?.color;
                return (
                  <button key={s} onClick={() => { setStage(s); setPage(0); }}
                    style={isActive && hexColor ? { background: hexColor, color: '#fff' } : {}}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      isActive
                        ? hexColor ? 'shadow-md' : 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-muted hover:bg-gray-200'
                    }`}>
                    {s === 'all' ? 'ALL' : (meta?.name || s.replace(/_/g,' ')).toUpperCase()}
                    <span className={`text-[10px] font-black ${isActive ? 'text-white/70' : 'text-muted/70'}`}>{counts[s] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <main className="flex-1 overflow-y-auto p-4 lg:px-8 lg:py-6 pb-20 lg:pb-8">
            <div className="lg:max-w-7xl lg:mx-auto">
              {/* Model Overview Cards */}
              {modelSummary.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted px-1">
                      Models ({modelSummary.length})
                    </span>
                    <span className="text-[10px] text-muted">{all.length} total units</span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-3">
                    {modelSummary.map(m => {
                      const releasedCount = m.byStage['released'] || 0;
                      const active = m.total - releasedCount;
                      const pct = m.total > 0 ? Math.round((releasedCount / m.total) * 100) : 0;
                      return (
                        <button key={m.model} onClick={() => setSelectedModel(m.model)}
                          className="bg-white rounded-[16px] shadow-card p-3 text-left hover:shadow-card-hover active:scale-[0.98] transition-all">
                          <div className="font-black text-navy text-[12px] leading-tight truncate mb-1">{m.model}</div>
                          <div className="text-[22px] font-black text-primary leading-none">{m.total}</div>
                          <div className="text-[9px] font-bold text-muted uppercase tracking-wide mb-2">
                            {active} active · {releasedCount} released
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {stagesActive.map(s => (m.byStage[s.slug] || 0) > 0 && (
                              <span key={s.slug} style={{ background: s.color || '#6b7280' }}
                                className="text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                                {(s.name || s.slug).toUpperCase()} {m.byStage[s.slug]}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full transition-all" style={{width:`${pct}%`}} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Model detail popup */}
              {selectedModel && (() => {
                const m = modelSummary.find(x => x.model === selectedModel);
                if (!m) return null;
                const stagesForPopup = stagesActive.length ? stagesActive : [
                  { slug:'port',     name:'Port',                color:'#f59e0b' },
                  { slug:'pdi',      name:'PDI',                 color:'#22c55e' },
                  { slug:'hold',     name:'On Hold',             color:'#ef4444' },
                  { slug:'stock',    name:'In Stock',            color:'#3b82f6' },
                  { slug:'ready',    name:'Ready for Delivery',  color:'#a855f7' },
                  { slug:'released', name:'Released to Dealer',  color:'#10b981' },
                ];
                return (
                  <div className="fixed inset-0 bg-black/50 z-50 anim-fade-in flex items-end lg:items-center justify-center lg:p-6"
                    onClick={() => setSelectedModel(null)}>
                    <div className="w-full max-w-[430px] lg:max-w-[560px] bg-white rounded-t-[28px] lg:rounded-[24px] shadow-2xl flex flex-col anim-slide-up max-h-[85vh]"
                      onClick={e => e.stopPropagation()}>
                      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 lg:hidden flex-shrink-0" />
                      <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                        <div>
                          <h2 className="font-black text-navy text-[18px] leading-tight">{m.model}</h2>
                          <p className="text-[11px] text-muted mt-0.5">{m.total} total unit{m.total !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => setSelectedModel(null)} className="p-2 hover:bg-gray-100 rounded-full">
                          <Icon name="close" className="text-muted" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Pipeline Stage Breakdown</div>
                          <div className="space-y-2">
                            {stagesForPopup.map(s => {
                              const count = m.byStage[s.slug] || 0;
                              const pct = m.total > 0 ? (count / m.total) * 100 : 0;
                              return (
                                <div key={s.slug} className="flex items-center gap-3">
                                  <span className="text-[10px] font-bold text-navy w-32 flex-shrink-0">{s.name || s.slug}</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background: s.color || '#6b7280'}} />
                                  </div>
                                  <span className="text-[11px] font-black text-navy w-6 text-right flex-shrink-0">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label:'Active Units',        value: m.total - (m.byStage['released'] || 0), icon:'directions_car', c:'text-navy'        },
                            { label:'Released to Dealers', value: m.byStage['released'] || 0,  icon:'verified',       c:'text-emerald-500' },
                            { label:'Variants',            value: m.variants.length || 1,       icon:'tune',           c:'text-blue-500'    },
                            { label:'Colors Available',    value: m.colors.length   || '—',     icon:'palette',        c:'text-purple-500'  },
                          ].map(s => (
                            <div key={s.label} className="bg-gray-50 rounded-[14px] p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Icon name={s.icon} fill className={`${s.c} text-[16px]`} />
                                <span className="text-[9px] font-bold text-muted uppercase tracking-wide">{s.label}</span>
                              </div>
                              <div className="text-[20px] font-black text-navy leading-none">{s.value}</div>
                            </div>
                          ))}
                        </div>
                        {m.variants.length > 0 && (
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Variants</div>
                            <div className="flex flex-wrap gap-1.5">
                              {m.variants.map(([name, count]) => (
                                <span key={name} className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy bg-gray-100 px-2.5 py-1 rounded-full">
                                  {name} <span className="font-black text-primary text-[10px]">{count}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {m.colors.length > 0 && (
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Colors</div>
                            <div className="flex flex-wrap gap-1.5">
                              {m.colors.map(([name, count]) => (
                                <span key={name} className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy bg-gray-100 px-2.5 py-1 rounded-full">
                                  {name} <span className="font-black text-primary text-[10px]">{count}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <button onClick={() => { setSelectedModel(null); setSearch(m.model); setStage('all'); }}
                          className="w-full py-3 bg-primary text-white font-black text-[12px] uppercase tracking-widest rounded-full shadow-primary-glow hover:brightness-110 transition-all flex items-center justify-center gap-2">
                          <Icon name="search" className="text-base" />
                          View All {m.model} Units
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Results count + pagination top */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-muted font-medium">
                    {filtered.length <= PAGE_SIZE
                      ? `${filtered.length} vehicle${filtered.length !== 1 ? 's' : ''}`
                      : `Showing ${showFrom}–${showTo} of ${filtered.length}`}
                  </span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 disabled:opacity-30 transition-all">
                        <Icon name="chevron_left" className="text-navy text-base" />
                      </button>
                      <span className="text-[11px] font-bold text-navy px-1">{page+1} / {totalPages}</span>
                      <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page === totalPages-1}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 disabled:opacity-30 transition-all">
                        <Icon name="chevron_right" className="text-navy text-base" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
                {paged.length === 0 && (
                  <div className="text-center py-20 text-muted col-span-3">
                    <Icon name="directions_car" fill className="text-[52px] mb-2 opacity-40" />
                    <div className="text-[13px] font-bold">{t('noVehiclesFound')}</div>
                  </div>
                )}
                {paged.map(vehicle => (
                  <button key={vehicle.id} onClick={() => onOpenDetail(vehicle.id)}
                    className="w-full bg-white rounded-[16px] shadow-card p-3 flex items-center gap-3 text-left hover:shadow-card-hover active:scale-[0.99] transition-all">
                    <div className="w-20 h-14 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img loading="lazy" src={vehicle.img} alt={vehicle.model} className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider">{vehicle.label || vehicle.model}</span>
                        <span className="text-[9px] text-muted">·</span>
                        <span className="text-[10px] text-muted font-medium">{t('lot')} {vehicle.lot}</span>
                      </div>
                      <div className="font-bold text-navy text-[13px] leading-tight truncate">{vehicle.model}</div>
                      <div className="text-[11px] text-muted mt-0.5">{vehicle.type.toUpperCase()} · {vehicle.year} · {vehicle.color}</div>
                      {Object.keys(vehicle.extraFields || {}).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(vehicle.extraFields).slice(0, 2).map(([k, val]) => (
                            <span key={k} className="text-[9px] font-medium text-muted bg-gray-100 px-1.5 py-0.5 rounded-full truncate max-w-[120px]" title={`${k}: ${val}`}>{k}: {String(val)}</span>
                          ))}
                          {Object.keys(vehicle.extraFields).length > 2 && (
                            <span className="text-[9px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded-full">+{Object.keys(vehicle.extraFields).length - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge status={vehicle.stage} t={t} />
                      <Icon name="chevron_right" className="text-muted text-xl" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Bottom pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={() => setPage(0)} disabled={page === 0}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-gray-100 text-muted hover:bg-gray-200 disabled:opacity-30 transition-all">First</button>
                  <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-all">
                    <Icon name="chevron_left" className="text-navy" />
                  </button>
                  <span className="text-[12px] font-bold text-navy">Page {page+1} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page === totalPages-1}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-all">
                    <Icon name="chevron_right" className="text-navy" />
                  </button>
                  <button onClick={() => setPage(totalPages-1)} disabled={page === totalPages-1}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-gray-100 text-muted hover:bg-gray-200 disabled:opacity-30 transition-all">Last</button>
                </div>
              )}
            </div>
          </main>
          <AdminBottomNav navigate={navigate} currentView="fleet-list" vehicles={vehicles} t={t} role={role} />
        </div>
      );
    }

