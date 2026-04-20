    /* ─── ReportsScreen ─── */
    /* ─── Export helpers ─── */
    const exportToCSV = (rows, filename) => {
      const headers = ['Label','VIN','Model','Color','Engine','Fuel','Lot','Stage','Arrival Date','Dealer','Notes'];
      const lines = [headers, ...rows.map(v => [
        v.label||v.model, v.vin||'', v.model||'', v.color||'', v.engine||'', v.fuel||'',
        v.lot||'', v.stage||'', v.arrivalDate||v.arrival_date||'', v.dealer||'', v.notes||'',
      ])];
      const csv = lines.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    const exportToXLSX = (rows, filename) => {
      if (typeof XLSX === 'undefined') { stockmoDialog.alert({ title: 'Not ready', message: 'Excel library not loaded yet. Try again.' }); return; }
      const ws = XLSX.utils.json_to_sheet(rows.map(v => ({
        'Vehicle':      v.label||v.model,
        'VIN':          v.vin||'',
        'Model':        v.model||'',
        'Color':        v.color||'',
        'Engine':       v.engine||'',
        'Fuel':         v.fuel||'',
        'Lot':          v.lot||'',
        'Stage':        v.stage||'',
        'Arrival Date': v.arrivalDate||v.arrival_date||'',
        'Dealer':       v.dealer||'',
        'Notes':        v.notes||'',
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fleet');
      XLSX.writeFile(wb, filename);
    };

    function ReportsScreen({ navigate, vehicles, onNotificationClick, unreadCount, t, role }) {
      const all = vehicles;
      const ALL_STAGES = ['port','pdi','hold','stock','ready','released'];
      const [stageFilter, setStageFilter] = useState([]);   // empty = all
      const [arrivalFrom, setArrivalFrom] = useState('');
      const [arrivalTo,   setArrivalTo]   = useState('');
      const [dealerFilter,setDealerFilter]= useState('');

      const today = new Date().toISOString().slice(0,10);

      const filtered = useMemo(() => {
        return all.filter(v => {
          if (stageFilter.length && !stageFilter.includes(v.stage)) return false;
          const arr = v.arrivalDate || v.arrival_date || '';
          if (arrivalFrom && arr && arr < arrivalFrom) return false;
          if (arrivalTo   && arr && arr > arrivalTo)   return false;
          if (dealerFilter && !(v.dealer||'').toLowerCase().includes(dealerFilter.toLowerCase())) return false;
          return true;
        });
      }, [all, stageFilter, arrivalFrom, arrivalTo, dealerFilter]);

      const toggleStage = s => setStageFilter(prev =>
        prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
      );

      const pipeline = [
        { labelKey:'statusPort',     count:all.filter(v=>v.stage==='port').length,     max:all.length||1, color:'bg-orange-400' },
        { labelKey:'statusPdi',      count:all.filter(v=>v.stage==='pdi').length,      max:all.length||1, color:'bg-green-400'  },
        { labelKey:'statusHold',     count:all.filter(v=>v.stage==='hold').length,     max:all.length||1, color:'bg-red-400'    },
        { labelKey:'statusStock',    count:all.filter(v=>v.stage==='stock').length,    max:all.length||1, color:'bg-blue-400'   },
        { labelKey:'statusReady',    count:all.filter(v=>v.stage==='ready').length,    max:all.length||1, color:'bg-purple-400' },
        { labelKey:'statusReleased', count:all.filter(v=>v.stage==='released').length, max:all.length||1, color:'bg-emerald-400'},
      ];
      const maintOverdue  = all.filter(v => v.stage === 'stock' && hasMaintDue(v)).length;
      const pdiInProgress = all.filter(v => v.stage === 'pdi').length;
      const holdsCount    = all.filter(v => v.stage === 'hold').length;

      const STAGE_COLORS = { port:'bg-orange-100 text-orange-700 border-orange-300', pdi:'bg-green-100 text-green-700 border-green-300', hold:'bg-red-100 text-red-700 border-red-300', stock:'bg-blue-100 text-blue-700 border-blue-300', ready:'bg-purple-100 text-purple-700 border-purple-300', released:'bg-emerald-100 text-emerald-700 border-emerald-300' };

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 lg:px-8 pt-12 lg:pt-7 pb-4 shadow-card">
            <div className="lg:max-w-7xl lg:mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl items-center justify-center shadow-md shadow-primary/30 hidden lg:flex">
                  <Icon name="garage" fill className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-black text-navy text-[15px] lg:text-[22px] leading-tight">{t('reports')}</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{t('reportsAnalytics')}</div>
                </div>
              </div>
              <button onClick={onNotificationClick} className="relative p-1.5 hover:bg-gray-100 rounded-full lg:hidden">
                <Icon name="notifications" className="text-navy" />
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
            <div className="bg-white px-5 pb-5 border-b border-gray-100">
              <h1 className="text-[22px] font-black text-navy mt-3 leading-tight">{t('reports')}</h1>
              <p className="text-xs text-muted mb-4">{t('fleetPerformance')}</p>
            </div>
            <div className="p-4 lg:px-8 lg:py-6 space-y-4 lg:max-w-7xl lg:mx-auto">
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {[
                  { labelKey:'activePdi',    value:pdiInProgress, icon:'checklist',      color:'text-blue-500',  bg:'bg-blue-50'  },
                  { labelKey:'onHoldLabel',  value:holdsCount,    icon:'error',          color:'text-red-500',   bg:'bg-red-50'   },
                  { labelKey:'maintOverdue', value:maintOverdue,  icon:'schedule',       color:'text-amber-500', bg:'bg-amber-50' },
                  { labelKey:'totalFleet',   value:all.length,    icon:'directions_car', color:'text-navy',      bg:'bg-gray-50'  },
                ].map(kpi => (
                  <div key={kpi.labelKey} className="bg-white rounded-[16px] p-4 shadow-card">
                    <div className={`w-10 h-10 ${kpi.bg} rounded-full flex items-center justify-center mb-2`}>
                      <Icon name={kpi.icon} fill className={`${kpi.color} text-[22px]`} />
                    </div>
                    <div className="text-[26px] font-black text-navy leading-none mb-1">{kpi.value}</div>
                    <div className="text-[11px] text-muted font-medium">{t(kpi.labelKey)}</div>
                  </div>
                ))}
              </div>
              {/* Pipeline chart */}
              <div className="bg-white rounded-[20px] p-4 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="bar_chart" fill className="text-primary text-[22px]" />
                  <span className="font-bold text-navy text-[14px]">{t('fleetPipeline')}</span>
                </div>
                {pipeline.map(p => {
                  const pct = Math.round((p.count / p.max) * 100);
                  return (
                    <div key={p.labelKey} className="flex items-center gap-3 mb-2.5">
                      <div className="w-20 text-[10px] font-bold uppercase tracking-wider text-muted">{t(p.labelKey)}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${p.color} rounded-full flex items-center pl-3`} style={{ width: `${Math.max(pct, 10)}%` }}>
                          <span className="text-[10px] font-black text-white">{p.count}</span>
                        </div>
                      </div>
                      <div className="w-9 text-[10px] font-bold text-muted text-right">{pct}%</div>
                    </div>
                  );
                })}
              </div>

              {/* ── Export Panel ── */}
              <div className="bg-white rounded-[20px] p-4 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="download" fill className="text-primary text-[22px]" />
                  <span className="font-bold text-navy text-[14px]">Export Data</span>
                </div>

                {/* Stage filter pills */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Stage</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button
                    onClick={() => setStageFilter([])}
                    className={`px-3 py-1 rounded-full border text-[11px] font-bold transition-colors ${stageFilter.length === 0 ? 'bg-navy text-white border-navy' : 'bg-gray-50 text-muted border-gray-200 hover:border-navy hover:text-navy'}`}>
                    All
                  </button>
                  {ALL_STAGES.map(s => {
                    const on = stageFilter.includes(s);
                    return (
                      <button key={s} onClick={() => toggleStage(s)}
                        className={`px-3 py-1 rounded-full border text-[11px] font-bold capitalize transition-colors ${on ? STAGE_COLORS[s] + ' font-extrabold' : 'bg-gray-50 text-muted border-gray-200 hover:border-gray-400'}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>

                {/* Date range */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Arrival Date Range</p>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted block mb-1">From</label>
                    <input type="date" value={arrivalFrom} onChange={e => setArrivalFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] text-navy outline-none focus:border-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted block mb-1">To</label>
                    <input type="date" value={arrivalTo} onChange={e => setArrivalTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] text-navy outline-none focus:border-primary" />
                  </div>
                </div>

                {/* Dealer filter */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Dealer</p>
                <input type="text" value={dealerFilter} onChange={e => setDealerFilter(e.target.value)}
                  placeholder="Filter by dealer name…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] text-navy outline-none focus:border-primary mb-4" />

                {/* Match count + clear */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] font-bold text-navy">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} match</span>
                  {(stageFilter.length || arrivalFrom || arrivalTo || dealerFilter) ? (
                    <button onClick={() => { setStageFilter([]); setArrivalFrom(''); setArrivalTo(''); setDealerFilter(''); }}
                      className="text-[11px] text-primary font-bold hover:underline">Clear filters</button>
                  ) : null}
                </div>

                {/* Export buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => exportToCSV(filtered, `StockMo_Fleet_${today}.csv`)}
                    disabled={filtered.length === 0}
                    className="flex-1 py-3 bg-navy text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-2 hover:bg-navy/80 transition-colors disabled:opacity-40">
                    <Icon name="download" className="text-base" /> CSV
                  </button>
                  <button
                    onClick={() => exportToXLSX(filtered, `StockMo_Fleet_${today}.xlsx`)}
                    disabled={filtered.length === 0}
                    className="flex-1 py-3 bg-primary text-white font-black text-[12px] uppercase tracking-wider rounded-full flex items-center justify-center gap-2 hover:bg-primary/80 transition-colors disabled:opacity-40">
                    <Icon name="table_chart" className="text-base" /> Excel
                  </button>
                </div>
              </div>
            </div>
          </main>
          <AdminBottomNav navigate={navigate} currentView="reports" vehicles={vehicles} t={t} role={role} />
        </div>
      );
    }

