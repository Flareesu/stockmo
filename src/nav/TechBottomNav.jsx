    /* ─── TECH BOTTOM NAV ─── */
    const TECH_NAV = [
      { id:'home',     icon:'home',           labelKey:'navHome',     target:'tech-home'      },
      { id:'inspect',  icon:'search',         labelKey:'navInspect',  target:'tech-inspect'   },
      { id:'stock',    icon:'warehouse',      labelKey:'navStock',    target:'tech-stockyard' },
      { id:'delivery', icon:'local_shipping', labelKey:'navDelivery', target:'tech-delivery'  },
      { id:'settings', icon:'settings',       labelKey:'navSettings', target:'tech-settings'  },
    ];
    const TECH_VIEW_TO_NAV = { 'tech-home':'home','tech-inspect':'inspect','tech-stockyard':'stock','tech-delivery':'delivery','tech-settings':'settings' };

    function TechBottomNav({ navigate, currentView, holdCount, overdueCount, t }) {
      const active = TECH_VIEW_TO_NAV[currentView] || 'home';
      return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex min-h-16 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden bottom-nav-safe">
          {TECH_NAV.map(item => {
            const on = active === item.id;
            const badge = item.id === 'inspect' ? holdCount : item.id === 'stock' ? overdueCount : 0;
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

