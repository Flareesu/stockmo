    /* ─── UTILITIES ─── */
    const Icon = ({ name, fill = false, className = '' }) => (
      <span className={`material-symbols-outlined select-none leading-none ${className}`} style={fill ? { fontVariationSettings: "'FILL' 1" } : {}}>{name}</span>
    );

    const S = {
      pdi:'bg-green-100 text-green-800', stock:'bg-blue-100 text-blue-800',
      hold:'bg-red-100 text-red-800', ready:'bg-purple-100 text-purple-800',
      port:'bg-orange-100 text-orange-800', released:'bg-emerald-100 text-emerald-800',
      high:'bg-red-50 text-red-700', med:'bg-amber-50 text-amber-700', low:'bg-blue-50 text-blue-600',
      online:'bg-emerald-100 text-emerald-700', busy:'bg-amber-100 text-amber-700', offline:'bg-gray-100 text-gray-500',
    };

    const STATUS_KEY_MAP = { port:'statusPort', pdi:'statusPdi', hold:'statusHold', stock:'statusStock', ready:'statusReady', released:'statusReleased', online:'statusOnline', offline:'statusOffline' };
    const StatusBadge = ({ status, t }) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${S[status] || 'bg-gray-100 text-gray-600'}`}>
        {t && STATUS_KEY_MAP[status] ? t(STATUS_KEY_MAP[status]) : (status || '').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
      </span>
    );

    const Field = ({ label, required, children }) => (
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
          {label}{required && <span className="text-primary ml-1">*</span>}
        </label>
        {children}
      </div>
    );

    const Toggle = ({ checked, onChange, label }) => (
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`no-min relative inline-block shrink-0 w-11 h-6 rounded-full transition-colors duration-200 align-middle ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
        <span
          className="absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
          style={{ left: checked ? '22px' : '2px' }} />
      </button>
    );
