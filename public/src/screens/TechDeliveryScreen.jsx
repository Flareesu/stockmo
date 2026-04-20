    /* ─── TechDeliveryScreen ─── */
    function TechDeliveryScreen({ navigate, vehicles, currentTechId, onOpenDetail, updateVehicle, t }) {
      const readyCars = vehicles.filter(v => v.stage === 'ready');
      const pdiComplete = vehicles.filter(v => v.stage === 'pdi' && pdiProgress(v).pct === 100 && countIssues(v) === 0);
      const holds = vehicles.filter(v => v.assignedTech === currentTechId && v.stage === 'hold').length;
      const overdueCount = vehicles.filter(v => v.stage === 'stock' && hasMaintDue(v)).length;

      const moveToStock = (id) => {
        updateVehicle(id, car => ({
          ...car, stage:'stock', pdiDate:todayStr(), stockDate:todayStr(),
          stockMaint: makeMaint(todayStr()),
          history:[`${todayStr()}: PDI passed — moved to stockyard — ${techById(car.assignedTech).name}`, ...car.history]
        }));
      };

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-6 pb-4 shadow-card">
            <h1 className="text-[22px] font-black text-navy leading-tight">{t('delivery')}</h1>
            <p className="text-xs text-muted">{t('readyFinalVehicles')}</p>
          </header>
          <main className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
            {pdiComplete.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">{t('readyForStockyard')}</h2>
                <div className="space-y-2">
                  {pdiComplete.map(v => (
                    <div key={v.id} className="bg-white rounded-[16px] shadow-card p-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-16 h-11 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img loading="lazy" src={v.img} alt={v.model} className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider">{v.label || v.model}</span>
                          <div className="font-bold text-navy text-[13px]">{v.model}</div>
                        </div>
                        <StatusBadge status="pdi" t={t} />
                      </div>
                      <button onClick={() => moveToStock(v.id)}
                        className="w-full py-2.5 bg-emerald-500 text-white font-bold text-[11px] uppercase tracking-widest rounded-full flex items-center justify-center gap-1.5 hover:bg-emerald-600 active:scale-95 transition-all">
                        <Icon name="check" className="text-sm" /> {t('moveToStockyard')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">{t('finalInspection')}</h2>
              {readyCars.length === 0 && pdiComplete.length === 0 && (
                <div className="text-center py-20 text-muted">
                  <Icon name="local_shipping" fill className="text-[52px] mb-2 opacity-40" />
                  <div className="text-[13px] font-bold">{t('noVehiclesDelivery')}</div>
                </div>
              )}
              <div className="space-y-2">
                {readyCars.map(v => {
                  const p = finalProgress(v);
                  return (
                    <button key={v.id} onClick={() => onOpenDetail(v.id)}
                      className="w-full bg-white rounded-[16px] shadow-card p-3 flex items-center gap-3 text-left hover:shadow-card-hover active:scale-[0.99] transition-all">
                      <div className="w-20 h-14 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img loading="lazy" src={v.img} alt={v.model} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider">{v.label || v.model}</span>
                          <StatusBadge status="ready" t={t} />
                        </div>
                        <div className="font-bold text-navy text-[13px] leading-tight truncate">{v.model}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${p.pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-muted">{p.pct}%</span>
                        </div>
                      </div>
                      <Icon name="chevron_right" className="text-muted text-xl flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
          <TechBottomNav navigate={navigate} currentView="tech-delivery" holdCount={holds} overdueCount={overdueCount} t={t} />
        </div>
      );
    }

