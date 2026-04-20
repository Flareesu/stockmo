    /* ─── TeamScreen ─── */
    function TeamScreen({ navigate, vehicles, technicians, assignVehicle, batchAssignVehicles, onNotificationClick, unreadCount, t, role, canEdit: canEditProp = true }) {
      const [assigningId,   setAssigningId]   = useState(null);
      const [assignSearch,  setAssignSearch]  = useState('');
      const [assignFilter,  setAssignFilter]  = useState('all'); // 'all' | 'unassigned' | 'mine'
      const [assignPage,    setAssignPage]    = useState(0);
      const [batchSaving,   setBatchSaving]   = useState(false);
      const [teamTab,       setTeamTab]       = useState('techs'); // 'techs' | 'employees'
      const [employees,     setEmployees]     = useState([]);
      const [loadingEmps,   setLoadingEmps]   = useState(false);
      const isAdmin = role === 'admin';
      const ASSIGN_PAGE_SIZE = 40;

      const PERM_KEYS = [
        { key: 'edit',    label: 'Edit Vehicles' },
        { key: 'reports', label: 'View Reports'  },
        { key: 'notes',   label: 'Add Notes'     },
        { key: 'export',  label: 'Export Data'   },
      ];

      // Load employees when switching to that tab
      React.useEffect(() => {
        if (teamTab !== 'employees') return;
        setLoadingEmps(true);
        sb.from('user_profiles').select('*').eq('role', 'employee')
          .then(({ data, error }) => {
            if (error) console.error('load employees', error);
            setEmployees(data || []);
            setLoadingEmps(false);
          })
          .catch((err) => { console.error('load employees', err); setLoadingEmps(false); });
      }, [teamTab]);

      const togglePerm = async (emp, key) => {
        if (!isAdmin) return;
        const cur = emp.permissions || {};
        const next = { ...cur, [key]: !cur[key] };
        setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, permissions: next } : e));
        const { error } = await sb.from('user_profiles').update({ permissions: next }).eq('id', emp.id);
        if (error) console.error('toggle permission', error);
      };

      const onlineCount    = technicians.filter(tc => tc.online).length;
      const assignedCars   = (tid) => vehicles.filter(v => v.assignedTech === tid && v.stage !== 'released');
      const activeVehicles = vehicles.filter(v => v.stage !== 'released');
      const assigningTech  = technicians.find(tc => tc.id === assigningId);

      // Reset search/filter/page whenever the popup opens/closes
      React.useEffect(() => {
        if (!assigningId) { setAssignSearch(''); setAssignFilter('all'); setAssignPage(0); }
      }, [assigningId]);

      // Reset to page 0 when search or filter changes
      React.useEffect(() => { setAssignPage(0); }, [assignSearch, assignFilter]);

      // Derived filtered list used inside the popup
      const filteredAssign = React.useMemo(() => {
        let list = activeVehicles;
        if (assignFilter === 'unassigned') list = list.filter(v => !v.assignedTech);
        if (assignFilter === 'mine')       list = list.filter(v => v.assignedTech === assigningId);
        if (assignSearch.trim()) {
          const q = assignSearch.toLowerCase();
          list = list.filter(v =>
            (v.label||v.model||'').toLowerCase().includes(q) ||
            (v.vin||'').toLowerCase().includes(q) ||
            (v.color||'').toLowerCase().includes(q) ||
            (v.lot||'').toLowerCase().includes(q)
          );
        }
        return list;
      }, [activeVehicles, assignFilter, assignSearch, assigningId]);

      const handleAssign = (vehicleId) => {
        const isAlreadyAssigned = vehicles.find(v => v.id === vehicleId)?.assignedTech === assigningId;
        assignVehicle(vehicleId, isAlreadyAssigned ? null : assigningId);
      };

      const handleBatchAssign = async () => {
        if (batchSaving) return;
        setBatchSaving(true);
        const toAssign = filteredAssign.filter(v => v.assignedTech !== assigningId).map(v => v.id);
        await batchAssignVehicles(toAssign, assigningId);
        setBatchSaving(false);
      };

      const handleUnassignAll = async () => {
        if (batchSaving) return;
        setBatchSaving(true);
        const mine = activeVehicles.filter(v => v.assignedTech === assigningId).map(v => v.id);
        await batchAssignVehicles(mine, null);
        setBatchSaving(false);
      };

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-7 pb-4 shadow-card">
            <div className="lg:max-w-7xl lg:mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl items-center justify-center shadow-md shadow-primary/30 hidden lg:flex">
                  <Icon name="garage" fill className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-black text-navy text-[15px] lg:text-[22px] leading-tight">{t('team')}</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{t('techRoster', {count: technicians.length})}</div>
                </div>
              </div>
              <button onClick={onNotificationClick} className="relative p-1.5 hover:bg-gray-100 rounded-full lg:hidden">
                <Icon name="notifications" className="text-navy" />
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
            {/* stats */}
            <div className="bg-white px-5 lg:px-8 pb-5 border-b border-gray-100">
              <div className="lg:max-w-7xl lg:mx-auto">
              <h1 className="text-[22px] font-black text-navy mt-3 leading-tight lg:hidden">{t('team')}</h1>
              <p className="text-xs text-muted mb-4 lg:hidden">{t('techRoster', {count: technicians.length})}</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:pt-4">
                <div className="bg-emerald-50 rounded-[16px] p-3 text-center">
                  <div className="text-[22px] font-black text-emerald-500">{onlineCount}</div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide mt-0.5">Online</div>
                </div>
                <div className="bg-gray-50 rounded-[16px] p-3 text-center">
                  <div className="text-[22px] font-black text-navy">{technicians.length}</div>
                  <div className="text-[10px] text-muted font-bold uppercase tracking-wide mt-0.5">Total</div>
                </div>
              </div>
              </div>{/* end lg:max-w-7xl */}
            </div>

            {/* Tab switcher: Technicians | Employees */}
            <div className="bg-white px-5 lg:px-8 pt-3 pb-2 border-b border-gray-100">
              <div className="lg:max-w-7xl lg:mx-auto flex gap-2">
                {[
                  { key: 'techs',     label: `Technicians (${technicians.length})` },
                  { key: 'employees', label: 'Employees' },
                ].map(tb => (
                  <button key={tb.key} onClick={() => setTeamTab(tb.key)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all
                      ${teamTab === tb.key ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>
                    {tb.label}
                  </button>
                ))}
              </div>
            </div>

            {teamTab === 'employees' ? (
              <div className="p-4 lg:px-8 lg:py-6 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:max-w-7xl lg:mx-auto">
                {loadingEmps && (
                  <div className="text-center text-muted text-[13px] py-12 lg:col-span-3">Loading employees…</div>
                )}
                {!loadingEmps && employees.length === 0 && (
                  <div className="text-center text-muted text-[13px] py-12 lg:col-span-3">
                    No employees yet. Create one in Supabase with <code className="text-navy">role='employee'</code>.
                  </div>
                )}
                {employees.map(emp => {
                  const initials = (emp.full_name || emp.name || emp.email || '?').split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase();
                  const perms = emp.permissions || {};
                  return (
                    <div key={emp.id} className="bg-white rounded-[20px] p-4 shadow-card">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-[14px] font-black text-white shadow-sm flex-shrink-0">{initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-navy text-[14px] leading-tight truncate">{emp.full_name || emp.name || emp.email || 'Employee'}</div>
                          <div className="text-[11px] text-muted truncate">{emp.email || ''}</div>
                          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-muted mt-0.5">Employee</div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted">Permissions</div>
                        {PERM_KEYS.map(p => (
                          <div key={p.key} className="flex items-center justify-between">
                            <span className="text-[12px] text-navy font-semibold">{p.label}</span>
                            <button onClick={() => togglePerm(emp, p.key)} disabled={!isAdmin}
                              className={`relative w-10 h-5.5 rounded-full transition-all ${perms[p.key] ? 'bg-primary' : 'bg-gray-200'} ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                              style={{ width: '40px', height: '22px' }}>
                              <span className="absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-all" style={{ left: perms[p.key] ? '20px' : '2px' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
            <div className="p-4 lg:px-8 lg:py-6 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:max-w-7xl lg:mx-auto">
              {technicians.length === 0 && (
                <div className="text-center text-muted text-[13px] py-12 lg:col-span-3">No technicians yet.</div>
              )}
              {technicians.map(tech => {
                const cars = assignedCars(tech.id);
                return (
                  <div key={tech.id} className="bg-white rounded-[20px] p-4 shadow-card">
                    {/* Tech header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black text-white shadow-sm"
                          style={{ backgroundColor: tech.color }}>
                          {tech.ini}
                        </div>
                        {/* Online dot */}
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${tech.online ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-navy text-[14px] leading-tight">{tech.name}</div>
                        <div className="text-[11px] text-muted capitalize">{tech.role.replace('_',' ')}</div>
                        <div className={`text-[10px] font-bold mt-0.5 ${tech.online ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {tech.online ? '● Online' : '○ Offline'}
                        </div>
                      </div>
                      {/* Assign button — edit-only */}
                      {canEditProp && (
                        <button onClick={() => setAssigningId(tech.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-black hover:bg-primary/20 transition-colors flex-shrink-0">
                          <Icon name="add" className="text-[14px]" /> Assign
                        </button>
                      )}
                    </div>

                    {/* Assigned vehicles */}
                    {cars.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
                        {cars.map(c => (
                          <div key={c.id} className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-black text-navy">{c.label || c.model}</span>
                            <StatusBadge status={c.stage} t={t} />
                            <button onClick={() => assignVehicle(c.id, null)}
                              className="ml-0.5 p-0.5 hover:bg-red-100 rounded transition-colors" title="Unassign">
                              <Icon name="close" className="text-red-400 text-[12px]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-gray-100 text-[11px] text-muted italic">No vehicles assigned</div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </main>

          {/* ── Assign Vehicle — bottom sheet on mobile, centered dialog on desktop ── */}
          {assigningId && (() => {
            const assignedToMe = activeVehicles.filter(v => v.assignedTech === assigningId).length;
            const unassignedInFilter = filteredAssign.filter(v => v.assignedTech !== assigningId).length;
            const filters = [
              { key: 'all',        label: `All (${activeVehicles.length})` },
              { key: 'unassigned', label: `Unassigned (${activeVehicles.filter(v => !v.assignedTech).length})` },
              { key: 'mine',       label: `Mine (${assignedToMe})` },
            ];
            return (
              <div className="fixed inset-0 bg-black/50 z-50 anim-fade-in flex items-end lg:items-center justify-center lg:p-6"
                onClick={() => setAssigningId(null)}>
                <div className="w-full max-w-[430px] lg:max-w-[720px] bg-white rounded-t-[32px] lg:rounded-[24px] shadow-2xl flex flex-col anim-slide-up"
                  style={{ maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>

                  {/* Drag handle — mobile only */}
                  <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 lg:hidden" />

                  {/* Header */}
                  <div className="px-5 lg:px-6 pt-3 lg:pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-xl items-center justify-center hidden lg:flex">
                          <Icon name="person_pin_circle" fill className="text-primary text-[18px]" />
                        </div>
                        <div>
                          <div className="text-[15px] lg:text-[17px] font-black text-navy">Assign Vehicles</div>
                          <div className="text-[11px] text-muted">to <span className="font-bold text-navy">{assigningTech?.name}</span></div>
                        </div>
                      </div>
                      <button onClick={() => setAssigningId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon name="close" className="text-muted" />
                      </button>
                    </div>

                    {/* Search bar */}
                    <div className="relative mt-3">
                      <Icon name="search" className="absolute left-3 top-2.5 text-muted text-[18px] pointer-events-none" />
                      <input
                        value={assignSearch}
                        onChange={e => setAssignSearch(e.target.value)}
                        placeholder="Search by model, VIN, color, lot…"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-[13px] text-navy outline-none focus:border-primary transition-colors"
                        autoFocus
                      />
                      {assignSearch && (
                        <button onClick={() => setAssignSearch('')} className="absolute right-2.5 top-2 p-0.5 hover:bg-gray-200 rounded-full">
                          <Icon name="close" className="text-muted text-[14px]" />
                        </button>
                      )}
                    </div>

                    {/* Filter chips */}
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5 scrollbar-hide">
                      {filters.map(f => (
                        <button key={f.key} onClick={() => setAssignFilter(f.key)}
                          className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all
                            ${assignFilter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Batch action bar — shown when there are unassigned vehicles in current filter */}
                  {unassignedInFilter > 0 && (
                    <div className="px-5 lg:px-6 py-2.5 bg-primary/5 border-b border-primary/10 flex items-center justify-between flex-shrink-0">
                      <span className="text-[12px] text-navy font-medium">
                        <span className="font-black text-primary">{unassignedInFilter}</span> vehicle{unassignedInFilter !== 1 ? 's' : ''} not yet assigned to {assigningTech?.name}
                      </span>
                      <button onClick={handleBatchAssign} disabled={batchSaving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-white font-black text-[11px] uppercase tracking-wider shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                        {batchSaving
                          ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Icon name="select_all" className="text-[14px]" />}
                        {batchSaving ? 'Assigning…' : `Assign All ${unassignedInFilter}`}
                      </button>
                    </div>
                  )}

                  {/* Vehicle list — 2-col grid on desktop */}
                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(filteredAssign.length / ASSIGN_PAGE_SIZE));
                    const safePage   = Math.min(assignPage, totalPages - 1);
                    const pageSlice  = filteredAssign.slice(safePage * ASSIGN_PAGE_SIZE, (safePage + 1) * ASSIGN_PAGE_SIZE);
                    const startIdx   = safePage * ASSIGN_PAGE_SIZE + 1;
                    const endIdx     = Math.min((safePage + 1) * ASSIGN_PAGE_SIZE, filteredAssign.length);
                    return (
                      <div className="flex-1 overflow-y-auto p-4 lg:p-5 flex flex-col">
                        {filteredAssign.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3 flex-1">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Icon name="search_off" className="text-muted text-[24px]" />
                            </div>
                            <p className="text-[13px] text-muted">No vehicles match your search.</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {pageSlice.map(v => {
                                const isThisTech = v.assignedTech === assigningId;
                                const otherTech  = !isThisTech && v.assignedTech
                                  ? technicians.find(tc => tc.id === v.assignedTech)
                                  : null;
                                return (
                                  <button key={v.id} onClick={() => handleAssign(v.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-[14px] text-left transition-all
                                      ${isThisTech
                                        ? 'bg-primary/10 border border-primary/30'
                                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}>
                                    <img loading="lazy" src={v.img} alt="" className="w-12 h-8 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[12px] font-black text-navy truncate">{v.label || v.model}</div>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <StatusBadge status={v.stage} t={t} />
                                        {v.lot && <span className="text-[9px] text-muted font-medium">Lot {v.lot}</span>}
                                        {otherTech && (
                                          <span className="text-[9px] text-amber-600 font-bold">→ {otherTech.name}</span>
                                        )}
                                        {!v.assignedTech && (
                                          <span className="text-[9px] text-muted">Unassigned</span>
                                        )}
                                      </div>
                                    </div>
                                    {isThisTech
                                      ? <Icon name="check_circle" className="text-primary text-xl flex-shrink-0" fill />
                                      : <Icon name="radio_button_unchecked" className="text-gray-300 text-xl flex-shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Pagination controls */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 flex-shrink-0">
                                <span className="text-[11px] text-muted">
                                  {startIdx}–{endIdx} of {filteredAssign.length}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setAssignPage(0)} disabled={safePage === 0}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <Icon name="first_page" className="text-navy text-[16px]" />
                                  </button>
                                  <button onClick={() => setAssignPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <Icon name="chevron_left" className="text-navy text-[16px]" />
                                  </button>
                                  {/* Page number pills */}
                                  {Array.from({ length: totalPages }, (_, i) => i)
                                    .filter(i => Math.abs(i - safePage) <= 2)
                                    .map(i => (
                                      <button key={i} onClick={() => setAssignPage(i)}
                                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all
                                          ${i === safePage ? 'bg-primary text-white' : 'hover:bg-gray-100 text-muted'}`}>
                                        {i + 1}
                                      </button>
                                    ))}
                                  <button onClick={() => setAssignPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage === totalPages - 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <Icon name="chevron_right" className="text-navy text-[16px]" />
                                  </button>
                                  <button onClick={() => setAssignPage(totalPages - 1)} disabled={safePage === totalPages - 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <Icon name="last_page" className="text-navy text-[16px]" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Footer */}
                  <div className="px-5 lg:px-6 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0"
                    style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted">
                        <span className="font-black text-navy">{assignedToMe}</span> assigned to {assigningTech?.name}
                      </span>
                      {assignedToMe > 0 && (
                        <button onClick={handleUnassignAll} disabled={batchSaving}
                          className="no-min flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-[11px] font-bold text-red-500 hover:bg-red-100 hover:text-red-700 active:scale-[0.97] transition-all disabled:opacity-40">
                          <Icon name="person_remove" className="text-[13px]" />
                          Unassign All
                        </button>
                      )}
                    </div>
                    <button onClick={() => setAssigningId(null)}
                      className="px-5 py-2 rounded-full bg-primary text-white font-black text-[12px] uppercase tracking-wider shadow-primary-glow hover:brightness-110 transition-all">
                      Done
                    </button>
                  </div>

                </div>
              </div>
            );
          })()}

          <AdminBottomNav navigate={navigate} currentView="team" vehicles={vehicles} t={t} role={role} />
        </div>
      );
    }

