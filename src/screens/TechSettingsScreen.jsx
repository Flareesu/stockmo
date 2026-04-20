    /* ─── TechSettingsScreen ─── */
    function TechSettingsScreen({ navigate, vehicles, currentTechId, t, lang, setLang, onNotificationClick, unreadCount, userProfile, userEmail, role, refreshUserProfile }) {
      const tech = techById(currentTechId);
      const [emailAlerts, setEmailAlerts] = useState(true);
      const [pushNotifs,  setPushNotifs]  = useState(true);
      const holds = vehicles.filter(v => v.assignedTech === currentTechId && v.stage === 'hold').length;
      const overdueCount = vehicles.filter(v => v.assignedTech === currentTechId && v.stage === 'stock' && hasMaintDue(v)).length;
      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-6 pb-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
                  <Icon name="garage" fill className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-black text-navy text-[15px] leading-tight">StockMo</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{t('techSettings')}</div>
                </div>
              </div>
              <button onClick={onNotificationClick} className="relative p-1.5 hover:bg-gray-100 rounded-full">
                <Icon name="notifications" className="text-navy" />
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
            <AccountCard userProfile={userProfile} userEmail={userEmail} role={role || 'tech'} avatarColor={tech?.color} onProfileChange={refreshUserProfile} />
            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 px-1">{t('notifications')}</h2>
                <div className="bg-white rounded-[20px] shadow-card overflow-hidden">
                  {[{label:t('emailAlerts'), icon:'email', checked:emailAlerts, onChange:setEmailAlerts},{label:t('pushNotifications'),icon:'notifications',checked:pushNotifs,onChange:setPushNotifs}].map((item, i) => (
                    <div key={item.label} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                      <Icon name={item.icon} fill className="text-muted text-[22px]" />
                      <div className="flex-1 text-[13px] font-medium text-navy">{item.label}</div>
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
                      className="text-[12px] font-bold text-navy bg-gray-100 rounded-full px-3 py-1.5 outline-none cursor-pointer">
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
                  {[{label:t('version'),value:'2.1.0',icon:'info'},{label:t('build'),value:'20250319',icon:'build_circle'},{label:t('environment'),value:t('production'),icon:'cloud'}].map((item, i) => (
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
          <TechBottomNav navigate={navigate} currentView="tech-settings" holdCount={holds} overdueCount={overdueCount} t={t} />
        </div>
      );
    }

