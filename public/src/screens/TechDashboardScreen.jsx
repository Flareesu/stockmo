    /* ─── TechDashboardScreen ─── */
    function TechDashboardScreen({ navigate, vehicles, currentTechId, onNotificationClick, unreadCount, onOpenDetail, t }) {
      const tech = techById(currentTechId);
      const myCars = vehicles.filter(v => v.assignedTech === currentTechId && v.stage !== 'released');
      const activePdi = myCars.filter(v => v.stage === 'pdi').length;
      const overdue   = myCars.filter(v => v.stage === 'stock' && hasMaintDue(v)).length;
      const holds     = myCars.filter(v => v.stage === 'hold').length;
      const hour = new Date().getHours();
      const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening');

      // Stage config for "my fleet" list
      const stageInfo = {
        port:     { icon:'anchor',        color:'text-orange-500', bg:'bg-orange-50',  label:'At Port'      },
        pdi:      { icon:'checklist',     color:'text-blue-500',   bg:'bg-blue-50',    label:'PDI'          },
        hold:     { icon:'error',         color:'text-red-500',    bg:'bg-red-50',     label:'On Hold'      },
        stock:    { icon:'warehouse',     color:'text-indigo-500', bg:'bg-indigo-50',  label:'In Stock'     },
        ready:    { icon:'local_shipping',color:'text-purple-500', bg:'bg-purple-50',  label:'Ready'        },
        released: { icon:'check_circle',  color:'text-emerald-500',bg:'bg-emerald-50', label:'Released'     },
      };

      const priority = useMemo(() => {
        const items = [];
        myCars.filter(v => v.stage === 'hold').forEach(v => items.push({ v, type:'HOLD', desc:t('issuesFound', {count:countIssues(v)}), icon:'error', color:'text-red-500' }));
        myCars.filter(v => v.stage === 'stock' && hasMaintDue(v)).forEach(v => items.push({ v, type:'OVERDUE', desc:t('tasksOverdue', {count:countMaintDue(v)}), icon:'schedule', color:'text-amber-500' }));
        myCars.filter(v => v.stage === 'pdi').forEach(v => { const p = pdiProgress(v); items.push({ v, type:'PDI', desc:t('complete', {pct:p.pct}), icon:'checklist', color:'text-blue-500' }); });
        myCars.filter(v => v.stage === 'ready').forEach(v => { const p = finalProgress(v); items.push({ v, type:'FINAL', desc:t('complete', {pct:p.pct}), icon:'local_shipping', color:'text-purple-500' }); });
        return items.slice(0, 5);
      }, [vehicles, currentTechId]);

      const recentActivity = useMemo(() => {
        const all = [];
        myCars.forEach(v => v.history.forEach(h => all.push({ text: `${v.label || v.model}: ${h.split(': ').slice(1).join(': ')}`, date: h.split(':')[0] })));
        return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
      }, [vehicles, currentTechId]);

      // Stage sort order for "my fleet"
      const stageOrder = { hold:0, pdi:1, port:2, stock:3, ready:4 };
      const sortedCars = [...myCars].sort((a,b) => (stageOrder[a.stage]??9) - (stageOrder[b.stage]??9));

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-6 pb-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-black shadow-md" style={{backgroundColor:tech.color}}>{tech.ini}</div>
                <div>
                  <h1 className="text-[15px] font-bold text-navy">{greeting}, {tech.name.split(' ')[0]}</h1>
                  <p className="text-[11px] text-muted">{tech.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onNotificationClick} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Icon name="notifications" className="text-navy" />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
                </button>
                <button onClick={() => sb.auth.signOut()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Icon name="logout" className="text-muted text-xl" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:t('assigned'), value:myCars.length, icon:'directions_car', color:'text-navy' },
                { label:t('activePdi'), value:activePdi, icon:'checklist', color:'text-blue-500' },
                { label:t('overdue'), value:overdue, icon:'schedule', color: overdue > 0 ? 'text-red-500' : 'text-emerald-500' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-[16px] p-3 shadow-card text-center">
                  <Icon name={s.icon} fill className={`${s.color} text-[22px] mb-1`} />
                  <div className="text-xl font-black text-navy">{s.value}</div>
                  <div className="text-[10px] text-muted font-medium leading-tight mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Priority alerts */}
            {priority.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">{t('priorityQueue')}</h2>
                <div className="space-y-2">
                  {priority.map(p => (
                    <button key={p.v.id + p.type} onClick={() => onOpenDetail(p.v.id)} className="w-full bg-white rounded-[16px] p-3 shadow-card flex items-center gap-3 text-left hover:shadow-card-hover active:scale-[0.99] transition-all">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Icon name={p.icon} fill className={`${p.color} text-xl`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider">{p.v.label || p.v.model}</span>
                          <StatusBadge status={p.v.stage} t={t} />
                        </div>
                        <div className="font-bold text-navy text-[13px] leading-tight">{p.v.model}</div>
                        <div className="text-[11px] text-muted">{p.desc}</div>
                      </div>
                      <Icon name="chevron_right" className="text-muted" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* My Fleet — ALL assigned vehicles, every stage */}
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">My Fleet</h2>
              {sortedCars.length === 0 ? (
                <div className="bg-white rounded-[20px] p-8 shadow-card text-center">
                  <Icon name="directions_car" fill className="text-[40px] text-muted/40 mb-2" />
                  <div className="text-[13px] font-bold text-muted">No vehicles assigned yet</div>
                  <div className="text-[11px] text-muted mt-1">Ask your admin to assign vehicles to you</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedCars.map(v => {
                    const si = stageInfo[v.stage] || stageInfo.port;
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
                          </div>
                          <div className="font-bold text-navy text-[13px] leading-tight truncate">{v.model}</div>
                          <div className="text-[11px] text-muted">{v.color} · {t('lot')} {v.lot}</div>
                        </div>
                        <div className={`w-8 h-8 rounded-full ${si.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon name={si.icon} fill className={`${si.color} text-[16px]`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent activity */}
            {recentActivity.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">{t('recentActivity')}</h2>
                <div className="bg-white rounded-[20px] overflow-hidden shadow-card">
                  {recentActivity.map((a, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < recentActivity.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <Icon name="history" fill className="text-muted text-[18px] flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-[12px] font-medium text-navy truncate">{a.text}</div>
                      <div className="text-[10px] text-muted font-medium flex-shrink-0">{a.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
          <TechBottomNav navigate={navigate} currentView="tech-home" holdCount={holds} overdueCount={overdue} t={t} />
        </div>
      );
    }

