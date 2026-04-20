    /* ─── TechInspectScreen ─── */
    function TechInspectScreen({ navigate, vehicles, currentTechId, onOpenDetail, t }) {
      // port = awaiting PDI start; pdi = in progress; hold = issues found
      const myCars = vehicles.filter(v => v.assignedTech === currentTechId && (v.stage === 'port' || v.stage === 'pdi' || v.stage === 'hold'));
      const holds = vehicles.filter(v => v.assignedTech === currentTechId && v.stage === 'hold').length;
      const overdueCount = vehicles.filter(v => v.assignedTech === currentTechId && v.stage === 'stock' && hasMaintDue(v)).length;
      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-6 pb-4 shadow-card">
            <h1 className="text-[22px] font-black text-navy leading-tight">{t('navInspect')}</h1>
            <p className="text-xs text-muted">Port arrivals, PDI in progress &amp; on hold</p>
          </header>
          <main className="flex-1 overflow-y-auto p-4 pb-20 space-y-3">
            {myCars.length === 0 && (
              <div className="text-center py-20 text-muted">
                <Icon name="search" fill className="text-[52px] mb-2 opacity-40" />
                <div className="text-[13px] font-bold">{t('noInspections')}</div>
              </div>
            )}
            {myCars.map(v => {
              const p = pdiProgress(v);
              const issues = countIssues(v);
              const isPort = v.stage === 'port';
              return (
                <button key={v.id} onClick={() => onOpenDetail(v.id)}
                  className="w-full bg-white rounded-[16px] shadow-card p-3 flex items-center gap-3 text-left hover:shadow-card-hover active:scale-[0.99] transition-all">
                  <div className="w-20 h-14 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img loading="lazy" src={v.img} alt={v.model} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black text-primary uppercase tracking-wider">{v.label || v.model}</span>
                      <StatusBadge status={v.stage} t={t} />
                      {issues > 0 && <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded">{issues} {t('issues')}</span>}
                    </div>
                    <div className="font-bold text-navy text-[13px] leading-tight truncate">{v.model}</div>
                    {isPort ? (
                      <div className="text-[11px] text-orange-500 font-bold mt-0.5">Tap to start PDI →</div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-muted">{p.pct}%</span>
                      </div>
                    )}
                  </div>
                  <Icon name="chevron_right" className="text-muted text-xl flex-shrink-0" />
                </button>
              );
            })}
          </main>
          <TechBottomNav navigate={navigate} currentView="tech-inspect" holdCount={holds} overdueCount={overdueCount} t={t} />
        </div>
      );
    }

