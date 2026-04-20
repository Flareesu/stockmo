    /* ─── DESKTOP SIDEBAR ─── */
    function DesktopSidebar({ role, currentView, navigate, vehicles, t, onNotificationClick, unreadCount }) {
      const navItems = role === 'admin' ? ADMIN_NAV : role === 'employee' ? EMPLOYEE_NAV : TECH_NAV;
      const active = (role === 'admin' || role === 'employee')
        ? (VIEW_TO_NAV[currentView] || 'dash')
        : (TECH_VIEW_TO_NAV[currentView] || 'home');
      const holdCount = (vehicles || []).filter(v => v.stage === 'hold').length;
      const overdueCount = (vehicles || []).filter(v => v.stage === 'stock' && hasMaintDue(v)).length;
      return (
        <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-gray-100 z-40" style={{boxShadow:'2px 0 12px rgba(0,0,0,0.04)'}}>
          {/* Logo */}
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md" style={{boxShadow:'0 4px 14px rgba(208,17,43,0.3)'}}>
                <Icon name="garage" fill className="text-white text-lg" />
              </div>
              <div>
                <div className="font-black text-navy text-[15px] leading-tight">StockMo</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                  {role === 'admin' ? 'Administrator' : role === 'employee' ? 'Employee' : 'Technician'}
                </div>
              </div>
            </div>
          </div>
          {/* Nav items */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map(item => {
              const on = active === item.id;
              const badge = role === 'admin'
                ? (item.id === 'holds' ? holdCount : 0)
                : (item.id === 'inspect' ? holdCount : item.id === 'stock' ? overdueCount : 0);
              return (
                <button key={item.id} onClick={() => navigate(item.target)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all text-left relative ${on ? 'bg-primary/10' : 'hover:bg-gray-100'}`}>
                  {on && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
                  <Icon name={item.icon} fill={on} className={`text-[20px] ${on ? 'text-primary' : 'text-muted'}`} />
                  <span className={`text-[13px] font-bold flex-1 ${on ? 'text-primary' : 'text-navy'}`}>{t(item.labelKey)}</span>
                  {badge > 0 && (
                    <span className="w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
          {/* Bottom: notifications */}
          <div className="px-3 py-4 border-t border-gray-100">
            <button onClick={onNotificationClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-gray-100 transition-all text-left">
              <Icon name="notifications" className="text-muted text-[20px]" />
              <span className="text-[13px] font-bold text-navy flex-1">Notifications</span>
              {unreadCount > 0 && (
                <span className="w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
          </div>
        </aside>
      );
    }

