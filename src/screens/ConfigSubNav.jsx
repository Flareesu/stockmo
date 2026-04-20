    /* ─── Shared sub-nav for admin config screens ─── */
    function ConfigSubNav({ navigate, current }) {
      const tabs = [
        { key: 'pipeline-manager',  label: 'Pipeline', icon: 'account_tree' },
        { key: 'checklist-editor',  label: 'Checklists', icon: 'checklist' },
        { key: 'model-manager',     label: 'Models', icon: 'directions_car' },
      ];
      return (
        <div className="bg-white border-b border-gray-100 flex px-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => navigate(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors border-b-2 ${current === tab.key ? 'text-primary border-primary' : 'text-muted border-transparent'}`}>
              <Icon name={tab.icon} fill={current === tab.key} className="text-base" />
              {tab.label}
            </button>
          ))}
        </div>
      );
    }

