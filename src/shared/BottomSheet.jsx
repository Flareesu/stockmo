    /* ─── BottomSheet: mobile-first responsive modal
       Mobile (<md): full-width sheet anchored to the bottom, drag handle, rounded top,
       safe-area inset padding, max-h 90vh, scrollable body.
       Desktop (md+): centered dialog with max-width.
       Use instead of Modal for new popups, or wrap Modal's children to get sheet UX. ─── */
    const BottomSheet = ({
      open,
      onClose,
      children,
      title,
      panelClassName = '',
      maxWidth = 'md',
      showHandle = true,
      dismissable = true,
      closeOnBackdrop = true,
    }) => {
      React.useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (dismissable && e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
      }, [open, onClose, dismissable]);
      if (!open) return null;
      const maxW = { sm: 'md:max-w-sm', md: 'md:max-w-md', lg: 'md:max-w-lg', xl: 'md:max-w-2xl', full: 'md:max-w-4xl' }[maxWidth] || 'md:max-w-md';
      return (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center anim-fade-in"
          role="dialog" aria-modal="true"
          onClick={(e) => { if (closeOnBackdrop && dismissable && e.target === e.currentTarget) onClose?.(); }}
        >
          <div
            className={`relative bg-white w-full ${maxW} rounded-t-[20px] md:rounded-[20px] shadow-card z-[60] max-h-[92vh] md:max-h-[85vh] flex flex-col anim-slide-up md:anim-fade-in ${panelClassName}`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {showHandle && (
              <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
            )}
            {title && (
              <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="text-[15px] font-black text-navy">{title}</div>
                {dismissable && (
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-muted active:bg-gray-100 md:hover:bg-gray-100 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">close</span>
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </div>
        </div>
      );
    };
    window.BottomSheet = BottomSheet;
