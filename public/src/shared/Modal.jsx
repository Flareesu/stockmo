    /* ─── SHARED MODAL + DIALOG MANAGER ─── */
    // Base Modal: fixed backdrop, Esc-to-close, click-outside-to-close, body scroll lock.
    // z-50 backdrop / z-60 panel / z-80 toast — keep this ladder consistent.
    const Modal = ({ open, onClose, children, panelClassName = '', closeOnBackdrop = true, dismissable = true }) => {
      React.useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (dismissable && e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
      }, [open, onClose, dismissable]);
      if (!open) return null;
      return (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center anim-fade-in"
          role="dialog" aria-modal="true"
          onClick={(e) => { if (closeOnBackdrop && dismissable && e.target === e.currentTarget) onClose?.(); }}
        >
          <div
            className={`relative bg-white w-full lg:max-w-md rounded-t-[20px] lg:rounded-[20px] shadow-card z-[60] max-h-[92vh] lg:max-h-[85vh] overflow-y-auto overscroll-contain anim-slide-up lg:anim-fade-in ${panelClassName}`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {children}
          </div>
        </div>
      );
    };

    // Imperative dialog API — replaces native alert()/confirm() which are unstyled on mobile
    // and break the design system. Call pattern:
    //   const ok = await stockmoDialog.confirm({ title, message, danger: true });
    //   await stockmoDialog.alert({ title, message });
    const stockmoDialog = (() => {
      let nextId = 1;
      const listeners = new Set();
      const emit = (dialog) => listeners.forEach(fn => fn(dialog));
      return {
        _subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
        confirm({ title = 'Confirm', message = '', confirmLabel = 'OK', cancelLabel = 'Cancel', danger = false } = {}) {
          return new Promise(resolve => {
            emit({ id: nextId++, kind: 'confirm', title, message, confirmLabel, cancelLabel, danger, resolve });
          });
        },
        alert({ title = 'Notice', message = '', confirmLabel = 'OK' } = {}) {
          return new Promise(resolve => {
            emit({ id: nextId++, kind: 'alert', title, message, confirmLabel, resolve });
          });
        },
      };
    })();
    // Expose globally so any render path (including inline handlers in screens defined
    // before App) can reach it without prop-drilling.
    window.stockmoDialog = stockmoDialog;

    const DialogHost = () => {
      const [dialog, setDialog] = React.useState(null);
      React.useEffect(() => stockmoDialog._subscribe(setDialog), []);
      if (!dialog) return null;
      const close = (value) => { dialog.resolve(value); setDialog(null); };
      const isConfirm = dialog.kind === 'confirm';
      return (
        <Modal open onClose={() => close(false)}>
          <div className="p-5">
            <div className="text-[15px] font-black text-navy mb-1">{dialog.title}</div>
            {dialog.message && <div className="text-[13px] text-muted leading-relaxed whitespace-pre-line">{dialog.message}</div>}
            <div className="mt-5 flex gap-2 justify-end">
              {isConfirm && (
                <button
                  onClick={() => close(false)}
                  className="px-5 min-h-[44px] rounded-full text-[13px] font-bold text-navy active:bg-gray-200 lg:hover:bg-gray-100 transition-colors active:scale-[0.98]">
                  {dialog.cancelLabel}
                </button>
              )}
              <button
                onClick={() => close(true)}
                className={`px-5 min-h-[44px] rounded-full text-[13px] font-bold text-white transition-colors active:scale-[0.98] ${dialog.danger ? 'bg-primary active:bg-primary/80 lg:hover:bg-primary/90' : 'bg-navy active:bg-navy/80 lg:hover:bg-navy/90'}`}>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      );
    };
