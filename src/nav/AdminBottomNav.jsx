    /* ─── ADMIN NAV ─── */
    const ADMIN_NAV = [
      { id:'dash',    icon:'grid_view',      labelKey:'navDash',    target:'admin-dashboard'   },
      { id:'fleet',   icon:'directions_car', labelKey:'navFleet',   target:'fleet-list'        },
      { id:'team',    icon:'group',          labelKey:'navTeam',    target:'team'              },
      { id:'holds',   icon:'build_circle',   labelKey:'navHolds',   target:'hold-tracker'      },
      { id:'config',  icon:'tune',           labelKey:'navConfig',  target:'pipeline-manager'  },
      { id:'admin',   icon:'settings',       labelKey:'navAdmin',   target:'settings'          },
    ];
    /* ─── EMPLOYEE NAV (view-only, no config/admin) ─── */
    const EMPLOYEE_NAV = [
      { id:'dash',    icon:'grid_view',        labelKey:'navDash',    target:'admin-dashboard'   },
      { id:'fleet',   icon:'directions_car',   labelKey:'navFleet',   target:'fleet-list'        },
      { id:'team',    icon:'group',            labelKey:'navTeam',    target:'team'              },
      { id:'holds',   icon:'build_circle',     labelKey:'navHolds',   target:'hold-tracker'      },
      { id:'acct',    icon:'manage_accounts',  labelKey:'navAccount', target:'employee-settings' },
    ];
    const VIEW_TO_NAV = {
      'admin-dashboard':'dash','fleet-list':'fleet','team':'team',
      'hold-tracker':'holds',
      'pipeline-manager':'config','checklist-editor':'config','model-manager':'config',
      'settings':'admin',
      'employee-settings':'acct',
    };

    function AdminBottomNav({ navigate, currentView, vehicles, t, role }) {
      const navList = role === 'employee' ? EMPLOYEE_NAV : ADMIN_NAV;
      const active = VIEW_TO_NAV[currentView] || 'dash';
      const holdCount = (vehicles || []).filter(v => v.stage === 'hold').length;
      return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex min-h-16 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden bottom-nav-safe">
          {navList.map(item => {
            const on = active === item.id;
            const badge = item.id === 'holds' ? holdCount : 0;
            return (
              <button key={item.id} onClick={() => navigate(item.target)} aria-label={t(item.labelKey)} className="flex-1 h-16 flex flex-col items-center justify-center gap-0.5 transition-colors relative active:bg-gray-50">
                <Icon name={item.icon} fill={on} className={`text-[22px] ${on ? 'text-primary' : 'text-muted'}`} />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${on ? 'text-primary' : 'text-muted'}`}>{t(item.labelKey)}</span>
                {badge > 0 && <span className="absolute top-1.5 right-[calc(50%-2px)] translate-x-3 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center">{badge}</span>}
              </button>
            );
          })}
        </nav>
      );
    }
