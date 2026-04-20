    /* ─── TechStockyardScreen ─── */
    function TechStockyardScreen({ navigate, vehicles, currentTechId, onOpenDetail, t }) {
      const [filter, setFilter] = useState('all');
      const [sort, setSort] = useState('overdue');
      const stockCars = vehicles.filter(v => v.stage === 'stock');
      const filtered = useMemo(() => {
        let list = [...stockCars];
        if (filter === 'overdue') list = list.filter(v => hasMaintDue(v));
        else if (filter === 'due_soon') list = list.filter(v => v.stockMaint.some(m => { const d = daysAgo(m.nextDue); return d < 0 && d >= -7; }));
        else if (filter === 'ok') list = list.filter(v => !hasMaintDue(v));
        if (sort === 'overdue') list.sort((a, b) => countMaintDue(b) - countMaintDue(a));
        else if (sort === 'days') list.sort((a, b) => daysAgo(b.stockDate) - daysAgo(a.stockDate));
        else list.sort((a, b) => a.model.localeCompare(b.model));
        return list;
      }, [vehicles, filter, sort]);
      const holds = vehicles.filter(v => v.assignedTech === currentTechId && v.stage === 'hold').length;
      const overdueCount = stockCars.filter(v => hasMaintDue(v)).length;
      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-6 pb-4 shadow-card">
            <h1 className="text-[22px] font-black text-navy leading-tight">{t('stockyard')}</h1>
            <p className="text-xs text-muted">{t('vehiclesInStock', {count:stockCars.length})}</p>
          </header>
          <div className="bg-white px-4 pb-3 pt-3 flex items-center gap-2 overflow-x-auto no-scroll border-b border-gray-100">
            {[['all',t('filterAll')],['overdue',t('filterOverdue')],['due_soon',t('filterDueSoon')],['ok',t('filterOk')]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${filter === val ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
            <select value={sort} onChange={e => setSort(e.target.value)} className="ml-auto flex-shrink-0 text-[11px] font-bold text-muted bg-gray-100 rounded-full px-3 py-1.5 outline-none">
              <option value="overdue">{t('sortOverdueFirst')}</option>
              <option value="days">{t('sortDaysInStock')}</option>
              <option value="alpha">{t('sortAZ')}</option>
            </select>
          </div>
          <main className="flex-1 overflow-y-auto p-4 pb-20 space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted">
                <Icon name="warehouse" fill className="text-[52px] mb-2 opacity-40" />
                <div className="text-[13px] font-bold">{t('noVehiclesMatch')}</div>
              </div>
            )}
            {filtered.map(v => {
              const od = countMaintDue(v);
              const dis = daysAgo(v.stockDate);
              return (
                <button key={v.id} onClick={() => onOpenDetail(v.id)}
                  className="w-full bg-white rounded-[16px] shadow-card p-3 flex items-center gap-3 text-left hover:shadow-card-hover active:scale-[0.99] transition-all">
                  <div className="w-20 h-14 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img loading="lazy" src={v.img} alt={v.model} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black text-primary uppercase tracking-wider">{v.label || v.model}</span>
                      {od > 0 && <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded">{t('overdueLabel', {count:od})}</span>}
                    </div>
                    <div className="font-bold text-navy text-[13px] leading-tight truncate">{v.model}</div>
                    <div className="text-[11px] text-muted">{t('lot')} {v.lot} · {t('dInStock', {days:dis})}</div>
                  </div>
                  <Icon name="chevron_right" className="text-muted text-xl flex-shrink-0" />
                </button>
              );
            })}
          </main>
          <TechBottomNav navigate={navigate} currentView="tech-stockyard" holdCount={holds} overdueCount={overdueCount} t={t} />
        </div>
      );
    }

