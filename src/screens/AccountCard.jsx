    /* ─── AccountCard (shared across tech/admin/employee settings) ─── */
    function AccountCard({ userProfile, userEmail, role, onProfileChange, avatarColor }) {
      const profileName = (userProfile?.name || '').trim();
      const displayName = profileName || (userEmail ? userEmail.split('@')[0] : 'User');
      const initials = (profileName || userEmail || 'U')
        .split(/[\s.@]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

      const [editing, setEditing] = useState(false);
      const [draft, setDraft] = useState(profileName);
      const [saving, setSaving] = useState(false);
      React.useEffect(() => { setDraft(profileName); }, [profileName]);

      const roleLabel = role === 'admin' ? 'Administrator' : role === 'employee' ? 'Employee' : 'Technician';
      const roleChip  = role === 'admin'
        ? 'bg-primary/10 text-primary'
        : role === 'employee'
          ? 'bg-blue-100 text-blue-600'
          : 'bg-emerald-100 text-emerald-600';

      const save = async () => {
        const next = draft.trim();
        if (!next || next === profileName) { setEditing(false); return; }
        if (!userProfile?.id) return;
        setSaving(true);
        const { error } = await sb.from('user_profiles').update({ name: next }).eq('id', userProfile.id);
        if (error) {
          console.error('profile update', error);
          setSaving(false);
          await stockmoDialog.alert({ title: 'Save failed', message: error.message });
          return;
        }
        if (role === 'tech') {
          const ini = next.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'T';
          await sb.from('technicians').update({ name: next, initials: ini }).eq('profile_id', userProfile.id);
        }
        await onProfileChange?.();
        setSaving(false);
        setEditing(false);
      };

      return (
        <div className="bg-white px-5 lg:px-8 pb-5 border-b border-gray-100 lg:max-w-4xl lg:mx-auto lg:w-full">
          <div className="flex items-center gap-4 mt-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[20px] font-black shadow-md flex-shrink-0"
              style={{ backgroundColor: avatarColor || '#1A1A2E' }}>{initials}</div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input
                    autoFocus value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(profileName); setEditing(false); } }}
                    placeholder="Your full name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[15px] font-bold text-navy outline-none focus:border-primary transition-colors"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={save} disabled={saving || !draft.trim()}
                      className="px-4 py-1.5 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-full disabled:opacity-40 hover:brightness-110 transition-all">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => { setDraft(profileName); setEditing(false); }}
                      className="px-4 py-1.5 bg-gray-100 text-muted text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="text-[18px] font-black text-navy truncate">{displayName}</div>
                    <button onClick={() => setEditing(true)} title="Edit name"
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                      <Icon name="edit" className="text-muted text-[16px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-black uppercase tracking-[0.12em] ${roleChip} px-2 py-0.5 rounded-full`}>{roleLabel}</span>
                  </div>
                  {userEmail && <div className="text-[11px] text-primary font-medium mt-0.5 truncate">{userEmail}</div>}
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

