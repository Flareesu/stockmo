    /* ─── NotificationsPanel ─── */
    function NotificationsPanel({ onClose, notifications, onMarkAllRead, t }) {
      const unread = notifications.filter(n => !n.read).length;
      return (
        <div className="fixed inset-0 bg-black/50 z-50 anim-fade-in flex lg:justify-end" onClick={onClose}>
          {/* Mobile: slides down from top | Desktop: slides in from right */}
          <div
            className="w-full max-w-[430px] lg:max-w-[400px] bg-white shadow-2xl flex flex-col anim-slide-down
              rounded-b-[32px] lg:rounded-none lg:rounded-l-[24px]
              absolute top-0 left-1/2 -translate-x-1/2
              lg:static lg:translate-x-0 lg:h-full"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-14 lg:pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-black text-navy text-[18px]">{t('notificationsTitle')}</h2>
                <p className="text-[11px] text-muted">{unread > 0 ? t('unread', {count: unread}) : t('allCaughtUp')}</p>
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && <button onClick={onMarkAllRead} className="text-[11px] font-bold text-primary py-1 px-3 bg-primary/10 rounded-full">{t('markAllRead')}</button>}
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Icon name="close" className="text-navy" /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icon name="notifications_none" className="text-muted text-[28px]" />
                  </div>
                  <p className="text-[13px] text-muted font-medium">{t('allCaughtUp')}</p>
                </div>
              )}
              {notifications.map(n => (
                <div key={n.id} className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 ${!n.read ? 'bg-primary/[0.02]' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-gray-100'}`}>
                    <Icon name={n.icon} fill className={`${n.color} text-[20px]`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[13px] text-navy ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</span>
                      <span className="text-[10px] text-muted flex-shrink-0 mt-0.5">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{n.detail}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
            <div className="h-6 flex-shrink-0" />
          </div>
        </div>
      );
    }

