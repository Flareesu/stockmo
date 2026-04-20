    /* ─── EmployeeSettingsScreen ─── */
    function EmployeeSettingsScreen({ navigate, onNotificationClick, unreadCount, t, lang, setLang, userProfile, userEmail, refreshUserProfile }) {
      const [emailAlerts, setEmailAlerts] = useState(true);
      const [pushNotifs,  setPushNotifs]  = useState(true);
      const perms = userProfile?.permissions || {};

      const PERM_LABELS = {
        edit:    { label: 'Edit Vehicles',  icon: 'edit'        },
        reports: { label: 'View Reports',   icon: 'bar_chart'   },
        notes:   { label: 'Add Notes',      icon: 'sticky_note_2' },
        export:  { label: 'Export Data',    icon: 'download'    },
      };

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 lg:px-8 pt-12 lg:pt-7 pb-4 shadow-card">
            <div className="lg:max-w-4xl lg:mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl items-center justify-center shadow-md shadow-primary/30 hidden lg:flex">
                  <Icon name="manage_accounts" fill className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-black text-navy text-[15px] lg:text-[22px] leading-tight">Account</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Employee Settings</div>
                </div>
              </div>
              <button onClick={onNotificationClick} className="relative p-1.5 hover:bg-gray-100 rounded-full lg:hidden">
                <Icon name="notifications" className="text-navy" />
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
            <AccountCard userProfile={userProfile} userEmail={userEmail} role="employee" onProfileChange={refreshUserProfile} />

            <div className="p-4 lg:px-8 lg:py-6 space-y-4 lg:max-w-4xl lg:mx-auto">

              {/* My Permissions — read-only */}
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 px-1">My Permissions</h2>
                <div className="bg-white rounded-[20px] shadow-card overflow-hidden">
                  {Object.entries(PERM_LABELS).map(([key, cfg], i) => {
                    const granted = !!perms[key];
                    return (
                      <div key={key} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                        <Icon name={cfg.icon} fill className={`text-[22px] ${granted ? 'text-primary' : 'text-gray-300'}`} />
                        <div className="flex-1 text-[13px] font-medium text-navy">{cfg.label}</div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${granted ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {granted ? 'Granted' : 'Restricted'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50">
                    <p className="text-[10px] text-muted">Permissions are managed by your administrator.</p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 px-1">{t('notifications')}</h2>
                <div className="bg-white rounded-[20px] shadow-card overflow-hidden">
                  {[
                    { label: t('emailAlerts'),       icon: 'email',         checked: emailAlerts, onChange: setEmailAlerts },
                    { label: t('pushNotifications'), icon: 'notifications', checked: pushNotifs,  onChange: setPushNotifs  },
                  ].map((item, i) => (
                    <div key={item.label} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                      <Icon name={item.icon} fill className="text-muted text-[22px]" />
                      <div className="flex-1 text-[13px] font-medium text-navy">{item.label}</div>
                      <Toggle checked={item.checked} onChange={item.onChange} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 px-1">{t('language')}</h2>
                <div className="bg-white rounded-[20px] shadow-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <Icon name="translate" fill className="text-muted text-[22px]" />
                    <div className="flex-1 text-[13px] font-medium text-navy">{t('language')}</div>
                    <select value={lang} onChange={e => setLang(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-[12px] font-bold text-navy outline-none focus:border-primary transition-colors">
                      <option value="en">English</option>
                      <option value="tl">Tagalog</option>
                      <option value="zh">中文 (简体)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* System */}
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 px-1">{t('system')}</h2>
                <div className="bg-white rounded-[20px] shadow-card overflow-hidden">
                  {[
                    { label: t('version'),     value: '2.1.0',    icon: 'info'         },
                    { label: t('build'),        value: '20250319', icon: 'build_circle' },
                    { label: t('environment'),  value: t('production'), icon: 'cloud'  },
                  ].map((item, i) => (
                    <div key={item.label} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                      <Icon name={item.icon} fill className="text-muted text-[22px]" />
                      <div className="flex-1 text-[13px] font-medium text-navy">{item.label}</div>
                      <span className="text-[11px] font-bold text-muted">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={async () => { await sb.auth.signOut(); navigate('login'); }}
                className="w-full py-[14px] rounded-full border-2 border-primary/30 text-primary font-black text-[13px] uppercase tracking-[0.12em] flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
                <Icon name="logout" className="text-lg" /> {t('signOut')}
              </button>
            </div>
          </main>

          {/* Bottom nav */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex h-16 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden">
            {EMPLOYEE_NAV.map(item => {
              const on = item.target === 'employee-settings';
              return (
                <button key={item.id} onClick={() => navigate(item.target)} className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors">
                  <Icon name={item.icon} fill={on} className={`text-[22px] ${on ? 'text-primary' : 'text-muted'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${on ? 'text-primary' : 'text-muted'}`}>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </nav>
        </div>
      );
    }

