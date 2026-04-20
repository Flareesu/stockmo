    /* ─── HoldTrackerScreen ─── */
    function HoldTrackerScreen({ navigate, vehicles, updateVehicle, onNotificationClick, unreadCount, t, db, session, role }) {
      const heldVehicles = useMemo(() =>
        [...vehicles.filter(v => v.stage === 'hold')].sort((a, b) => {
          // Sort by longest time on hold — find the most recent hold history entry (raw objects)
          const holdTime = v => {
            const raw = v.historyRaw || [];
            const entry = [...raw].reverse().find(h => h.stage_to === 'hold');
            return entry ? new Date(entry.created_at || 0).getTime() : 0;
          };
          return holdTime(a) - holdTime(b); // oldest hold first
        }),
        [vehicles]
      );

      const [notes, setNotes] = useState({}); // vehicleId → draft note text
      const [saving, setSaving] = useState({}); // vehicleId → bool

      const daysSince = (dateStr) => {
        if (!dateStr) return null;
        const diff = Date.now() - new Date(dateStr).getTime();
        return Math.floor(diff / 86400000);
      };

      const addRepairNote = async (vehicleId, noteText) => {
        if (!noteText?.trim() || !db) return;
        setSaving(p => ({ ...p, [vehicleId]: true }));
        try {
          await db.insertHistory(vehicleId, noteText.trim(), 'hold', 'hold');
          const newEntry = {
            id: Date.now().toString(),
            action: noteText.trim(),
            stage_from: 'hold',
            stage_to: 'hold',
            created_at: new Date().toISOString(),
          };
          // Optimistic update — prepend to historyRaw (objects) and rebuild history (strings)
          updateVehicle(vehicleId, car => {
            const historyRaw = [newEntry, ...(car.historyRaw || [])];
            const history    = historyRaw.map(h => `${(h.created_at || '').slice(0, 10)}: ${h.action || ''}`);
            return { ...car, historyRaw, history };
          });
          setNotes(p => ({ ...p, [vehicleId]: '' }));
        } catch(err) { console.error(err); }
        setSaving(p => ({ ...p, [vehicleId]: false }));
      };

      const resolveVehicle = async (vehicleId, targetStage) => {
        if (!db) return;
        const v = vehicles.find(x => x.id === vehicleId);
        if (!v) return;
        const label = targetStage === 'pdi' ? 'Sent back for re-inspection' : 'Cleared to stock';
        try {
          await db.updateStage(vehicleId, targetStage);
          await db.insertHistory(vehicleId, label, 'hold', targetStage);
          updateVehicle(vehicleId, car => ({ ...car, stage: targetStage }));
        } catch(err) { console.error(err); }
      };

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <header className="bg-white px-5 pt-12 lg:pt-6 pb-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
                  <Icon name="build_circle" fill className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-black text-navy text-[15px] leading-tight">Hold / Repair Tracker</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{heldVehicles.length} unit{heldVehicles.length !== 1 ? 's' : ''} on hold</div>
                </div>
              </div>
              <button onClick={onNotificationClick} className="relative p-1.5 hover:bg-gray-100 rounded-full">
                <Icon name="notifications" className="text-navy" />
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
            {heldVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <Icon name="check_circle" fill className="text-green-500 text-[36px]" />
                </div>
                <div className="font-black text-navy text-[18px]">No vehicles on hold</div>
                <div className="text-muted text-[13px]">All units are progressing through the pipeline normally.</div>
              </div>
            ) : (
              <div className="p-4 lg:px-8 lg:py-6 space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start lg:max-w-7xl lg:mx-auto">
                {heldVehicles.map(v => {
                  const raw       = v.historyRaw || [];
                  // Find earliest hold entry (raw is sorted newest-first, so last hold entry)
                  const holdEntry = [...raw].find(h => h.stage_to === 'hold');
                  const daysHeld  = holdEntry ? daysSince(holdEntry.created_at) : null;
                  const pdiIssues   = (v.pdiChecks   || []).filter(c => c.state === 'issue');
                  const finalIssues = (v.finalChecks  || []).filter(c => c.state === 'issue');
                  const allIssues   = [...pdiIssues, ...finalIssues];
                  // Repair log: history entries where vehicle stayed on hold (stage_from=hold, stage_to=hold)
                  const repairLog = raw.filter(h => h.stage_from === 'hold' && h.stage_to === 'hold')
                                       .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                  return (
                    <div key={v.id} className="bg-white rounded-[20px] shadow-card overflow-hidden">
                      {/* Header row */}
                      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                        <div className="w-16 h-12 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                          <img loading="lazy" src={v.img} alt={v.model} className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-navy text-[14px]">{v.label || v.model}</span>
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-red-200">ON HOLD</span>
                            {daysHeld !== null && <span className="text-[10px] text-muted font-bold">{daysHeld}d</span>}
                          </div>
                          <div className="text-[11px] text-muted mt-0.5">{[v.color, v.lot ? `Lot ${v.lot}` : null].filter(Boolean).join(' · ')}</div>
                        </div>
                      </div>

                      {/* Issues */}
                      {allIssues.length > 0 && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Issues ({allIssues.length})</div>
                          <div className="space-y-1.5">
                            {allIssues.map((c, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-[12px] text-navy font-semibold">{c.name}</span>
                                  {c.priority && <span className="ml-2 text-[9px] font-bold uppercase text-muted">{c.priority}</span>}
                                  {c.note && <div className="text-[11px] text-muted italic mt-0.5">{c.note}</div>}
                                  {c.image_url && <img loading="lazy" src={c.image_url} alt="Issue" className="mt-1 w-full max-h-28 object-cover rounded-lg border border-red-200" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Repair Log */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Repair Log</div>
                        {repairLog.length === 0 && <div className="text-[11px] text-muted italic mb-2">No repair notes yet.</div>}
                        <div className="space-y-1 mb-3">
                          {repairLog.map((h, i) => {
                            const d = h.created_at || h.timestamp;
                            const dateStr = d ? new Date(d).toLocaleDateString() : '';
                            return (
                              <div key={i} className="text-[11px] text-navy bg-gray-50 rounded-lg px-3 py-2">
                                {dateStr && <span className="text-muted font-bold mr-1.5">{dateStr}:</span>}
                                {h.action}
                              </div>
                            );
                          })}
                        </div>
                        {/* Add note input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={notes[v.id] || ''}
                            onChange={e => setNotes(p => ({ ...p, [v.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') addRepairNote(v.id, notes[v.id]); }}
                            placeholder="Add repair note…"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-[12px] text-navy outline-none focus:border-primary" />
                          <button
                            onClick={() => addRepairNote(v.id, notes[v.id])}
                            disabled={!notes[v.id]?.trim() || saving[v.id]}
                            className="px-4 py-2 bg-navy text-white font-bold text-[12px] rounded-xl disabled:opacity-40 hover:bg-navy/80 transition-colors flex items-center gap-1">
                            {saving[v.id] ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="send" className="text-sm" />}
                          </button>
                        </div>
                      </div>

                      {/* Resolution buttons */}
                      <div className="flex gap-3 p-4">
                        <button
                          onClick={() => resolveVehicle(v.id, 'pdi')}
                          className="flex-1 py-2.5 border-2 border-primary text-primary font-black text-[11px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors active:scale-95">
                          <Icon name="restart_alt" className="text-base" /> Re-inspect
                        </button>
                        <button
                          onClick={() => resolveVehicle(v.id, 'stock')}
                          className="flex-1 py-2.5 bg-primary text-white font-black text-[11px] uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 hover:bg-primary/80 transition-colors active:scale-95">
                          <Icon name="check_circle" className="text-base" /> Clear to Stock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
          <AdminBottomNav navigate={navigate} currentView="hold-tracker" vehicles={vehicles} t={t} role={role} />
        </div>
      );
    }

