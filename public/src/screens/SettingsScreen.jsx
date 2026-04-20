    /* ─── SettingsScreen ─── */
    function SettingsScreen({ navigate, vehicles, onNotificationClick, unreadCount, t, lang, setLang, role, userProfile, userEmail, refreshUserProfile }) {
      const [emailAlerts, setEmailAlerts] = useState(true);
      const [pushNotifs,  setPushNotifs]  = useState(true);
      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 lg:px-8 pt-12 lg:pt-7 pb-4 shadow-card">
            <div className="lg:max-w-4xl lg:mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl items-center justify-center shadow-md shadow-primary/30 hidden lg:flex">
                  <Icon name="settings" fill className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-black text-navy text-[15px] lg:text-[22px] leading-tight">{t('adminSettings')}</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Configuration</div>
                </div>
              </div>
              <button onClick={onNotificationClick} className="relative p-1.5 hover:bg-gray-100 rounded-full lg:hidden">
                <Icon name="notifications" className="text-navy" />
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
            <AccountCard userProfile={userProfile} userEmail={userEmail} role={role || 'admin'} onProfileChange={refreshUserProfile} />
            <div className="p-4 lg:px-8 lg:py-6 space-y-4 lg:max-w-4xl lg:mx-auto">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 px-1">{t('notifications')}</h2>
                <div className="bg-white rounded-[20px] shadow-card overflow-hidden">
                  {[{labelKey:'emailAlerts', icon:'email', checked:emailAlerts, onChange:setEmailAlerts},{labelKey:'pushNotifications',icon:'notifications',checked:pushNotifs,onChange:setPushNotifs}].map((item, i) => (
                    <div key={item.labelKey} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                      <Icon name={item.icon} fill className="text-muted text-[22px]" />
                      <div className="flex-1 text-[13px] font-medium text-navy">{t(item.labelKey)}</div>
                      <Toggle checked={item.checked} onChange={item.onChange} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 px-1">{t('language')}</h2>
                <div className="bg-white rounded-[20px] shadow-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <Icon name="translate" fill className="text-muted text-[22px]" />
                    <div className="flex-1 text-[13px] font-medium text-navy">{t('language')}</div>
                    <select value={lang} onChange={e => setLang(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-[12px] font-bold text-navy outline-none focus:border-primary transition-colors appearance-none pr-7"
                      style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%238A8FA3' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 8px center'}}>
                      <option value="en">English</option>
                      <option value="tl">Tagalog</option>
                      <option value="zh">中文 (简体)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 px-1">{t('system')}</h2>
                <div className="bg-white rounded-[20px] shadow-card overflow-hidden">
                  {[{labelKey:'version',value:'2.1.0',icon:'info'},{labelKey:'build',value:'20250319',icon:'build_circle'},{labelKey:'environment',valueKey:'production',icon:'cloud'}].map((item, i) => (
                    <div key={item.labelKey} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                      <Icon name={item.icon} fill className="text-muted text-[22px]" />
                      <div className="flex-1 text-[13px] font-medium text-navy">{t(item.labelKey)}</div>
                      <span className="text-[11px] font-bold text-muted">{item.valueKey ? t(item.valueKey) : item.value}</span>
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
          <AdminBottomNav navigate={navigate} currentView="settings" vehicles={vehicles} t={t} role={role} />
        </div>
      );
    }

