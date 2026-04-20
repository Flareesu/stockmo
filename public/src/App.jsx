    /* ─── APP ROOT ─── */
    function App() {
      /* ── auth / session ── */
      const [session,        setSession]         = useState(null);
      const [userProfile,    setUserProfile]      = useState(null); // {id, name, role, color}
      const [authLoading,    setAuthLoading]      = useState(true);
      const lastUidRef = useRef(null);  // tracks UID across sign-out for online = false

      /* ── app state ── */
      const [view,           setView]             = useState('login');
      const [showNotifs,     setShowNotifs]       = useState(false);
      const [showAddVehicle, setShowAddVehicle]   = useState(false);
      const [showImportModal, setShowImportModal] = useState(false);
      const [vehicles,       setVehicles]         = useState([]);
      const [technicians,    setTechnicians]       = useState([]);
      const [notifications,  setNotifications]    = useState([]);
      const [detailVehicleId,setDetailVehicleId]  = useState(null);
      const [toast,          setToast]            = useState('');
      const [lang,           setLang]             = useState(() => {
        try { return localStorage.getItem('stockmo_lang') || 'en'; } catch { return 'en'; }
      });
      React.useEffect(() => {
        try { localStorage.setItem('stockmo_lang', lang); } catch {}
      }, [lang]);
      const [dataReady,      setDataReady]        = useState(false);
      const [pipelineStages, setPipelineStages]   = useState([]);

      const t = (key, vars) => {
        const dict = translations[lang] || translations.en;
        let str = dict[key] || translations.en[key] || key;
        if (vars) Object.entries(vars).forEach(([k,v]) => { str = str.replace(`{${k}}`, v); });
        return str;
      };

      const navigate = (target) => { setView(target); sessionStorage.setItem('stockmo_view', target); window.scrollTo(0, 0); };
      const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

      /* ── load user profile ── */
      const loadUserProfile = async (uid) => {
        const { data } = await sb.from('user_profiles').select('*').eq('id', uid).single();
        if (data) {
          setUserProfile(data);
          return data;
        }
        return null;
      };
      const refreshUserProfile = async () => {
        const uid = session?.user?.id || lastUidRef.current;
        if (!uid) return;
        await loadUserProfile(uid);
        await loadTechnicians();
      };

      /* ── load all vehicles from Supabase ── */
      // profile_id stored directly on vehicle_assignments — no nested join needed
      const VEHICLE_Q = `*, pdi_checks(*), stock_maintenance(*), final_checks(*), vehicle_history(*), vehicle_assignments(profile_id)`;
      const loadVehicles = async () => {
        const { data, error } = await sb.from('vehicles')
          .select(VEHICLE_Q)
          .order('created_at', { ascending: false })
          .limit(10000);
        if (error) { console.error('loadVehicles', error); return; }
        const transformed = (data || []).map(transformVehicle);
        setVehicles(transformed);
      };

      /* ── load technicians from technicians table (has online column) ── */
      const loadTechnicians = async () => {
        const { data } = await sb.from('technicians').select('*').not('profile_id', 'is', null);
        if (!data) return;
        const list = data.map(t => ({
          id:     t.profile_id,   // auth UUID — used to match v.assignedTech
          techId: t.id,           // technicians PK — used for vehicle_assignments.tech_id
          name:   t.name    || 'Unknown',
          ini:    t.initials || (t.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
          role:   t.role    || 'technician',
          color:  t.color   || '#8A8FA3',
          online: t.online  || false,
        }));
        setTechnicians(list);
        _techsRef.current = list;
      };

      /* ── load pipeline stages ── */
      const loadPipelineStages = async () => {
        const { data } = await sb.from('pipeline_stages').select('*').order('ord');
        if (data) setPipelineStages(data);
      };

      /* ── load notifications ── */
      const loadNotifications = async (uid) => {
        const { data } = await sb.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(30);
        const notifColor = icon => icon === 'error' ? 'text-red-500' : icon === 'check_circle' ? 'text-emerald-500' : icon === 'warning' ? 'text-amber-500' : 'text-primary';
        setNotifications((data || []).map(n => ({
          ...n,
          time:  n.created_at ? n.created_at.slice(0, 10) : '',
          color: notifColor(n.icon),
        })));
      };

      /* ── full data bootstrap ── */
      const loadAllData = async (uid) => {
        await Promise.all([loadVehicles(), loadTechnicians(), loadNotifications(uid), loadPipelineStages()]);
        setDataReady(true);
      };

      /* ── auth state listener (runs once on mount) ── */
      useEffect(() => {
        const setOnline = (uid, online) => {
          sb.from('technicians').update({ online }).eq('profile_id', uid).then(() => {});
        };

        sb.auth.getSession().then(({ data: { session: s } }) => {
          setSession(s);
          if (s) {
            lastUidRef.current = s.user.id;
            loadUserProfile(s.user.id).then(profile => {
              if (profile) {
                if (profile.role === 'tech') setOnline(s.user.id, true);
                loadAllData(s.user.id);
                const defaultDest = (profile.role === 'admin' || profile.role === 'employee') ? 'admin-dashboard' : 'tech-home';
                const adminViews = ['admin-dashboard','fleet-list','team','reports','settings','pipeline-manager','checklist-editor','model-manager','hold-tracker'];
                const employeeViews = ['admin-dashboard','fleet-list','team','reports','hold-tracker','employee-settings'];
                const techViews  = ['tech-home','tech-inspect','tech-stockyard','tech-delivery','tech-settings'];
                const validViews = profile.role === 'admin' ? adminViews : profile.role === 'employee' ? employeeViews : techViews;
                const saved = sessionStorage.getItem('stockmo_view');
                navigate(saved && validViews.includes(saved) ? saved : defaultDest);
              }
            });
          }
          setAuthLoading(false);
        });

        const { data: { subscription } } = sb.auth.onAuthStateChange((event, s) => {
          setSession(s);
          if (s && event === 'SIGNED_IN') {
            lastUidRef.current = s.user.id;
            loadUserProfile(s.user.id).then(profile => {
              if (profile) {
                if (profile.role === 'tech') setOnline(s.user.id, true);
                loadAllData(s.user.id);
                const dest = (profile.role === 'admin' || profile.role === 'employee') ? 'admin-dashboard' : 'tech-home';
                setView(v => v === 'login' ? dest : v);
              }
            });
          } else if (!s) {
            if (lastUidRef.current) { setOnline(lastUidRef.current, false); lastUidRef.current = null; }
            setUserProfile(null);
            setVehicles([]);
            setTechnicians([]);
            setNotifications([]);
            setDataReady(false);
            sessionStorage.removeItem('stockmo_view');
            navigate('login');
          }
        });
        return () => subscription.unsubscribe();
      }, []);

      /* ── realtime: vehicles table ── */
      useEffect(() => {
        if (!session) return;
        const chan = sb.channel('vehicles-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => {
            if (payload.eventType === 'DELETE') {
              setVehicles(prev => prev.filter(v => v.id !== payload.old.id));
            } else {
              sb.from('vehicles').select(VEHICLE_Q).eq('id', payload.new.id).single()
                .then(({ data }) => {
                  if (!data) return;
                  const tv = transformVehicle(data);
                  setVehicles(prev => {
                    const exists = prev.some(v => v.id === tv.id);
                    return exists ? prev.map(v => v.id === tv.id ? tv : v) : [tv, ...prev];
                  });
                });
            }
          })
          .subscribe();
        return () => sb.removeChannel(chan);
      }, [session]);

      /* ── realtime: pdi_checks — full vehicle refetch so admin sees state + note + image ── */
      useEffect(() => {
        if (!session) return;
        const chan = sb.channel('pdi-checks-live')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pdi_checks' }, payload => {
            const vehicleId = payload.new?.vehicle_id;
            if (!vehicleId) return;
            sb.from('vehicles').select(VEHICLE_Q).eq('id', vehicleId).single()
              .then(({ data }) => {
                if (!data) return;
                const tv = transformVehicle(data);
                setVehicles(prev => prev.map(v => v.id === tv.id ? tv : v));
              });
          })
          .subscribe();
        return () => sb.removeChannel(chan);
      }, [session]);

      /* ── realtime: final_checks — full vehicle refetch so admin sees state + note + image ── */
      useEffect(() => {
        if (!session) return;
        const chan = sb.channel('final-checks-live')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'final_checks' }, payload => {
            const vehicleId = payload.new?.vehicle_id;
            if (!vehicleId) return;
            sb.from('vehicles').select(VEHICLE_Q).eq('id', vehicleId).single()
              .then(({ data }) => {
                if (!data) return;
                const tv = transformVehicle(data);
                setVehicles(prev => prev.map(v => v.id === tv.id ? tv : v));
              });
          })
          .subscribe();
        return () => sb.removeChannel(chan);
      }, [session]);

      /* ── realtime: vehicle_history — repair notes show up live ── */
      useEffect(() => {
        if (!session) return;
        const chan = sb.channel('history-live')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_history' }, payload => {
            const h = payload.new;
            setVehicles(prev => prev.map(v => {
              if (v.id !== h.vehicle_id) return v;
              const newRaw = [h, ...v.historyRaw];
              const newStr = newRaw.map(x => `${(x.created_at || '').slice(0, 10)}: ${x.action || ''}`);
              return { ...v, historyRaw: newRaw, history: newStr };
            }));
          })
          .subscribe();
        return () => sb.removeChannel(chan);
      }, [session]);

      /* ── realtime: notifications ── */
      useEffect(() => {
        if (!session) return;
        const notifColor = icon => icon === 'error' ? 'text-red-500' : icon === 'check_circle' ? 'text-emerald-500' : icon === 'warning' ? 'text-amber-500' : 'text-primary';
        const chan = sb.channel('notifs-live')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications',
              filter: `user_id=eq.${session.user.id}` }, payload => {
            const n = payload.new;
            setNotifications(prev => [{
              ...n,
              time:  n.created_at ? n.created_at.slice(0, 10) : '',
              color: notifColor(n.icon),
            }, ...prev]);
            showToastMsg(n.title);
          })
          .subscribe();
        return () => sb.removeChannel(chan);
      }, [session]);

      /* ── realtime: pipeline_stages — dashboard updates live when admin edits config ── */
      useEffect(() => {
        if (!session) return;
        const chan = sb.channel('pipeline-stages-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_stages' }, () => {
            loadPipelineStages();
          })
          .subscribe();
        return () => sb.removeChannel(chan);
      }, [session]);

      /* ── realtime: technicians online status ── */
      useEffect(() => {
        if (!session) return;
        const chan = sb.channel('techs-live')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'technicians' }, payload => {
            const u = payload.new;
            const patch = t => t.techId === u.id ? { ...t, online: u.online } : t;
            setTechnicians(prev => prev.map(patch));
            _techsRef.current = _techsRef.current.map(patch);
          })
          .subscribe();
        return () => sb.removeChannel(chan);
      }, [session]);

      /* ── local optimistic update ── */
      const updateVehicle = (id, fn) => {
        setVehicles(prev => prev.map(v => v.id === id ? fn(v) : v));
      };
      const deleteVehicle = (id) => {
        setVehicles(prev => prev.filter(v => v.id !== id));
      };

      /* ── assign / unassign vehicle to technician ── */
      const assignVehicle = async (vehicleId, techProfileId) => {
        // Optimistic local update
        setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, assignedTech: techProfileId || null } : v));
        // Remove any existing assignment for this vehicle
        await sb.from('vehicle_assignments').delete().eq('vehicle_id', vehicleId);
        if (techProfileId) {
          const tech = _techsRef.current.find(t => t.id === techProfileId);
          if (tech?.techId) {
            await sb.from('vehicle_assignments').insert({
              vehicle_id: vehicleId,
              tech_id: tech.techId,
              profile_id: techProfileId,
            });
          }
        }
      };

      /* ── batch assign / unassign multiple vehicles at once ── */
      const batchAssignVehicles = async (vehicleIds, techProfileId) => {
        if (!vehicleIds.length) return;
        // Optimistic bulk update
        setVehicles(prev => prev.map(v =>
          vehicleIds.includes(v.id) ? { ...v, assignedTech: techProfileId || null } : v
        ));
        // Delete all existing assignments for these vehicles in one query
        await sb.from('vehicle_assignments').delete().in('vehicle_id', vehicleIds);
        if (techProfileId) {
          const tech = _techsRef.current.find(t => t.id === techProfileId);
          if (tech?.techId) {
            const rows = vehicleIds.map(id => ({
              vehicle_id: id,
              tech_id: tech.techId,
              profile_id: techProfileId,
            }));
            // Sub-batch at 500 rows per request
            for (let i = 0; i < rows.length; i += 500) {
              await sb.from('vehicle_assignments').insert(rows.slice(i, i + 500));
            }
          }
        }
      };

      /* ── db helpers passed to VehicleDetailOverlay ── */
      const db = session ? {
        updateStage: async (vehicleId, newStage, extra = {}) => {
          await sb.from('vehicles').update({ stage: newStage, ...extra }).eq('id', vehicleId);
        },
        insertHistory: async (vehicleId, action, fromStage, toStage) => {
          await sb.from('vehicle_history').insert({
            vehicle_id: vehicleId, actor_id: session.user.id,
            action, stage_from: fromStage, stage_to: toStage,
          });
        },
        reportIssue: async (vehicleId, vehicleLabel, checkType, itemName, note, techName) => {
          // 1. Log into vehicle_history so admin sees it in the repair log
          await sb.from('vehicle_history').insert({
            vehicle_id: vehicleId, actor_id: session.user.id,
            action: `Issue reported by ${techName} — [${checkType.toUpperCase()}] ${itemName}${note ? ': ' + note : ''}`,
            stage_from: 'hold', stage_to: 'hold',
          });
          // 2. Send a notification to every admin
          const { data: admins } = await sb.from('user_profiles').select('id').eq('role', 'admin');
          if (!admins?.length) return;
          const notifRows = admins.map(a => ({
            user_id: a.id,
            title:   `Issue: ${itemName}`,
            detail:  `${vehicleLabel} — ${note || 'No description'} — reported by ${techName}`,
            icon:    'error',
            read:    false,
          }));
          await sb.from('notifications').insert(notifRows);
        },
        insertMaintTasks: async (vehicleId, today) => {
          const { data: templates } = await sb.from('maint_task_templates').select('*').eq('active', true);
          if (!templates?.length) return;
          const rows = templates.map(tmpl => ({
            vehicle_id: vehicleId,
            task_id:    String(tmpl.id),         // task_id is text in DB
            name:       tmpl.name,
            freq_days:  tmpl.frequency_days,
            priority:   tmpl.priority || 'med',
            last_done:  today,
            next_due:   addDays(today, tmpl.frequency_days),
          }));
          await sb.from('stock_maintenance').insert(rows);
        },
        upsertPdiCheck: async (vehicleId, rowId, state, note) => {
          if (!rowId) return;
          await sb.from('pdi_checks')
            .update({ state, note: note || '', checked_at: new Date().toISOString(), checked_by: session.user.id })
            .eq('id', rowId);
        },
        upsertFinalCheck: async (vehicleId, rowId, state, note) => {
          if (!rowId) return;
          await sb.from('final_checks')
            .update({ state, note: note || '', checked_at: new Date().toISOString(), checked_by: session.user.id })
            .eq('id', rowId);
        },
        bulkSaveChecks: async (vehicleId, type, checks) => {
          // UPDATE each row by its UUID id — techs have UPDATE but not INSERT on these tables
          const table = type === 'pdi' ? 'pdi_checks' : 'final_checks';
          const now   = new Date().toISOString();
          const results = await Promise.all(
            checks
              .filter(c => c.id)          // skip any row with no id (shouldn't happen)
              .map(c =>
                sb.from(table)
                  .update({ state: c.state, note: c.note || '', checked_at: now, checked_by: session.user.id })
                  .eq('id', c.id)
              )
          );
          const failed = results.find(r => r.error);
          if (failed) throw failed.error;
        },
        completeMaint: async (vehicleId, taskId, freq) => {
          const today = todayStr();
          await sb.from('stock_maintenance')
            .update({ last_done: today, next_due: addDays(today, freq) })
            .eq('vehicle_id', vehicleId).eq('task_id', taskId);
        },
        uploadVehicleImage: async (vehicleId, file) => {
          const ext  = file.name.split('.').pop();
          const path = `${vehicleId}/primary.${ext}`;
          const { error } = await sb.storage.from('vehicle-images').upload(path, file, { upsert: true });
          if (error) throw error;
          const { data } = sb.storage.from('vehicle-images').getPublicUrl(path);
          await sb.from('vehicles').update({ cover_photo_url: data.publicUrl }).eq('id', vehicleId);
          return data.publicUrl;
        },
        uploadIssueImage: async (vehicleId, checkType, itemId, file) => {
          const ext  = file.name.split('.').pop();
          const ts   = Date.now();
          const path = `${vehicleId}/${itemId}/${ts}.${ext}`;
          const { error } = await sb.storage.from('issue-images').upload(path, file);
          if (error) throw error;
          const { data } = sb.storage.from('issue-images').getPublicUrl(path);
          const table = checkType === 'pdi' ? 'pdi_checks' : 'final_checks';
          await sb.from(table).update({ image_url: data.publicUrl })
            .eq('id', itemId);         // itemId is the row PK
          return data.publicUrl;
        },
      } : null;

      /* ── add vehicle (persisted) ── */
      const handleAddVehicle = async (formData) => {
        const { vin, model, color, engine, fuel, lot } = formData;
        // Compute per-model sequence number
        const { count: modelCount } = await sb.from('vehicles').select('*', { count: 'exact', head: true }).eq('model', model);
        const vehicle_number = (modelCount || 0) + 1;
        const { data, error } = await sb.from('vehicles').insert({
          vin, model, color, engine, fuel, lot,
          make: 'GAC', year: 2025, stage: 'port',
          arrival_date: todayStr(),
          notes: '', vehicle_number,
        }).select().single();
        if (error) { console.error(error); showToastMsg('Error: ' + error.message); return; }

        const today = todayStr();
        const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0,10); };

        // seed pdi_checks — store section/name/priority inline (schema is denormalised)
        const { data: pdiTemplates } = await sb.from('pdi_item_templates').select('*').eq('active', true);
        if (pdiTemplates?.length) {
          const { error: e1 } = await sb.from('pdi_checks').insert(pdiTemplates.map(tmpl => ({
            vehicle_id: data.id, item_id: String(tmpl.id),
            section: tmpl.section || 'General', name: tmpl.name, priority: tmpl.priority || 'med',
            state: 'pending', note: '',
          })));
          if (e1) console.error('pdi_checks seed:', e1);
        }

        // seed stock_maintenance
        const { data: maintTemplates } = await sb.from('maint_task_templates').select('*').eq('active', true);
        if (maintTemplates?.length) {
          const { error: e2 } = await sb.from('stock_maintenance').insert(maintTemplates.map(tmpl => ({
            vehicle_id: data.id, task_id: String(tmpl.id),
            name: tmpl.name, freq_days: tmpl.frequency_days || 30, priority: tmpl.priority || 'med',
            state: 'pending', last_done: today, next_due: addDays(today, tmpl.frequency_days || 30),
          })));
          if (e2) console.error('stock_maintenance seed:', e2);
        }

        // seed final_checks
        const { data: finalTemplates } = await sb.from('final_check_templates').select('*').eq('active', true);
        if (finalTemplates?.length) {
          const { error: e3 } = await sb.from('final_checks').insert(finalTemplates.map(tmpl => ({
            vehicle_id: data.id, item_id: String(tmpl.id),
            section: tmpl.section || 'General', name: tmpl.name, priority: tmpl.priority || 'med',
            state: 'pending', note: '',
          })));
          if (e3) console.error('final_checks seed:', e3);
        }

        await sb.from('vehicle_history').insert({
          vehicle_id: data.id, actor_id: session.user.id,
          action: 'Arrived from port', stage_to: 'port',
        });
        await loadVehicles();
        setShowAddVehicle(false);
        showToastMsg('Vehicle added to fleet ✓');
      };

      /* ── bulk import (called by ImportFleetModal) ── */
      const handleBulkImport = async (rows, onProgress) => {
        const today = todayStr();
        const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0,10); };

        // Fetch all three template sets in parallel — just once for the whole import
        const [{ data: pdiT }, { data: maintT }, { data: finalT }] = await Promise.all([
          sb.from('pdi_item_templates').select('*').eq('active', true),
          sb.from('maint_task_templates').select('*').eq('active', true),
          sb.from('final_check_templates').select('*').eq('active', true),
        ]);

        // Load existing vehicles keyed by VIN for dedup + patch diffing
        const { data: existingFull } = await sb.from('vehicles').select('*');
        const existingByVin = {};
        (existingFull || []).forEach(ev => { if (ev.vin) existingByVin[ev.vin] = ev; });

        // Split rows into new vs existing (to patch)
        const newRows = [];
        const patchList = []; // [{id, patch}]
        let unchanged = 0;
        const EXCEL_COLS = ['model','variant','year','make','fuel','exterior_color','interior_color','cs_number','engine_number','invoice_number','bl_number','contract_no','sales_status','dealer_group','dealer','region','lot','notes','arrival_date','release_date','stage'];
        for (const r of rows) {
          const existing = existingByVin[r.vin];
          if (!existing) { newRows.push(r); continue; }
          const patch = {};
          for (const col of EXCEL_COLS) {
            const nv = r[col];
            if (nv === null || nv === undefined) continue;
            const normalized = typeof nv === 'string' ? nv.trim() : nv;
            if (normalized === '' || normalized === 0 && col !== 'year') continue;
            if (col === 'year' && (!normalized || Number(normalized) === Number(existing.year))) continue;
            const ev = existing[col];
            if (String(normalized) !== String(ev ?? '')) patch[col] = normalized;
          }
          // extra_fields: shallow merge, only add new/changed keys
          if (r.extra_fields && Object.keys(r.extra_fields).length) {
            const merged = { ...(existing.extra_fields || {}) };
            let changedExtra = false;
            for (const [k, v] of Object.entries(r.extra_fields)) {
              if (v === null || v === undefined || String(v).trim() === '') continue;
              if (String(merged[k] ?? '') !== String(v)) { merged[k] = v; changedExtra = true; }
            }
            if (changedExtra) patch.extra_fields = merged;
          }
          if (Object.keys(patch).length === 0) { unchanged++; continue; }
          patchList.push({ id: existing.id, patch });
        }

        // Apply patches (updates) for existing VINs
        for (const { id, patch } of patchList) {
          const { error } = await sb.from('vehicles').update(patch).eq('id', id);
          if (error) console.error('update vehicle', error);
        }

        // Per-model counts for new vehicle_number assignment
        const modelBaseCount = {};
        (existingFull || []).forEach(v => { modelBaseCount[v.model] = (modelBaseCount[v.model] || 0) + 1; });
        const modelLocalCount = {};
        // Swap in the filtered list so only truly-new rows are inserted below
        rows = newRows;

        // Helper: insert rows in sub-batches to stay under Supabase limits
        const batchInsert = async (table, allRows, size = 500) => {
          for (let i = 0; i < allRows.length; i += size) {
            const { error } = await sb.from(table).insert(allRows.slice(i, i + size));
            if (error) console.error(`batchInsert ${table}`, error);
          }
        };

        const INVENTORY_STAGE_MAP = {
          'in-transit': 'port', 'in transit': 'port',
          'in stock': 'stock', 'available': 'stock',
          'pdi': 'pdi', 'hold': 'hold', 'ready': 'ready',
          'released': 'released', 'delivered': 'released',
        };
        const VALID_STAGES = new Set(['port','pdi','hold','ready','released','stock']);

        const BATCH = 50;
        const total = rows.length;
        let inserted = 0;

        for (let i = 0; i < total; i += BATCH) {
          const batch = rows.slice(i, i + BATCH);

          // Auto-create vehicle_models for any new model names
          const uniqueModels = [...new Set(batch.map(r => r.model).filter(Boolean))];
          for (const modelName of uniqueModels) {
            const sample = batch.find(r => r.model === modelName);
            const fuelType = detectFuel(sample.variant || '', modelName);
            await sb.from('vehicle_models').upsert({
              name: modelName,
              variant: sample.variant || '',
              engine: sample.engine || sample.variant || '',
              fuel_type: fuelType,
              color_options: sample.exterior_color ? [sample.exterior_color] : [],
            }, { onConflict: 'name', ignoreDuplicates: true });
          }

          // Build vehicle rows with correct vehicle_number per model
          const vehicleRows = batch.map(r => {
            const rawStage = String(r.stage || '').trim().toLowerCase();
            const stage = INVENTORY_STAGE_MAP[rawStage] || (VALID_STAGES.has(rawStage) ? rawStage : 'port');
            const fuel = r.fuel || detectFuel(r.variant || '', r.model || '');
            modelLocalCount[r.model] = (modelLocalCount[r.model] || 0) + 1;
            const vehicle_number = (modelBaseCount[r.model] || 0) + modelLocalCount[r.model];
            return {
              vin:            r.vin,
              model:          r.model,
              year:           Number(r.year) || 2025,
              stage,
              make:           r.make || 'GAC',
              fuel,
              variant:        r.variant        || '',
              exterior_color: r.exterior_color || '',
              interior_color: r.interior_color || '',
              cs_number:      r.cs_number      || '',
              engine_number:  r.engine_number  || '',
              invoice_number: r.invoice_number || '',
              bl_number:      r.bl_number      || '',
              contract_no:    r.contract_no    || '',
              sales_status:   r.sales_status   || '',
              dealer_group:   r.dealer_group   || '',
              region:         r.region         || '',
              color:          r.exterior_color || r.color || '',
              engine:         r.variant        || r.engine || '',
              lot:            r.lot            || '',
              arrival_date:   excelDateToISO(r.arrival_date),
              release_date:   excelDateToISO(r.release_date),
              dealer:         r.dealer         || '',
              notes:          r.notes          || '',
              extra_fields:   r.extra_fields   || {},
              vehicle_number,
            };
          });

          const { data: newVehicles, error: ve } = await sb.from('vehicles').insert(vehicleRows).select('id');
          if (ve) { throw new Error(ve.message || JSON.stringify(ve)); }

          if (newVehicles?.length) {
            const pdiRows = [], maintRows = [], finalRows = [], histRows = [];
            for (const v of newVehicles) {
              if (pdiT?.length) pdiRows.push(...pdiT.map(tmpl => ({
                vehicle_id: v.id, item_id: String(tmpl.id),
                section: tmpl.section || 'General', name: tmpl.name, priority: tmpl.priority || 'med',
                state: 'pending', note: '',
              })));
              if (maintT?.length) maintRows.push(...maintT.map(tmpl => ({
                vehicle_id: v.id, task_id: String(tmpl.id),
                name: tmpl.name, freq_days: tmpl.frequency_days || 30, priority: tmpl.priority || 'med',
                state: 'pending', last_done: today,
                next_due: addDays(today, tmpl.frequency_days || 30),
              })));
              if (finalT?.length) finalRows.push(...finalT.map(tmpl => ({
                vehicle_id: v.id, item_id: String(tmpl.id),
                section: tmpl.section || 'General', name: tmpl.name, priority: tmpl.priority || 'med',
                state: 'pending', note: '',
              })));
              if (session) histRows.push({
                vehicle_id: v.id, actor_id: session.user.id,
                action: 'Imported from fleet file', stage_to: 'port',
              });
            }
            await Promise.all([
              pdiRows.length   ? batchInsert('pdi_checks', pdiRows)         : Promise.resolve(),
              maintRows.length ? batchInsert('stock_maintenance', maintRows) : Promise.resolve(),
              finalRows.length ? batchInsert('final_checks', finalRows)     : Promise.resolve(),
              histRows.length  ? batchInsert('vehicle_history', histRows)   : Promise.resolve(),
            ]);
          }

          inserted += batch.length;
          onProgress(Math.round((inserted / total) * 100));
        }

        await loadVehicles();
        setShowImportModal(false);
        const updated = patchList.length;
        showToastMsg(`Added ${inserted} · Updated ${updated} · Unchanged ${unchanged} ✓`);
        return inserted;
      };

      const openDetail  = (id) => setDetailVehicleId(id);
      const closeDetail = () => setDetailVehicleId(null);

      const isAdminView = view.startsWith('admin') || view === 'fleet-list' || view === 'team' || view === 'reports' || view === 'settings' || view === 'employee-settings';
      const detailVehicle = vehicles.find(v => v.id === detailVehicleId);
      const role = userProfile?.role;
      const perms = userProfile?.permissions || {};
      const userCanEdit   = canEdit(role, perms);
      const userCanConfig = canConfig(role);

      const shared = {
        navigate, vehicles, updateVehicle, technicians, assignVehicle, batchAssignVehicles,
        onNotificationClick: () => setShowNotifs(true),
        onAddVehicle:   () => setShowAddVehicle(true),
        onImportFleet:  () => setShowImportModal(true),
        unreadCount: notifications.filter(n => !n.read).length,
        currentTechId: userProfile?.id || '',
        userProfile,
        userEmail: session?.user?.email || '',
        refreshUserProfile,
        role, perms, canEdit: userCanEdit, canConfig: userCanConfig,
        onOpenDetail: openDetail,
        pipelineStages,
        t, lang, setLang,
      };

      /* ── global loading screen ── */
      if (authLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-primary-glow">
                <Icon name="garage" fill className="text-white text-3xl" />
              </div>
              <div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        );
      }

      const screens = {
        'login':             <LoginScreen           onLogin={loadAllData} />,
        'tech-home':         <TechDashboardScreen   {...shared} />,
        'tech-inspect':      <TechInspectScreen     {...shared} />,
        'tech-stockyard':    <TechStockyardScreen   {...shared} />,
        'tech-delivery':     <TechDeliveryScreen    {...shared} />,
        'tech-settings':     <TechSettingsScreen    {...shared} />,
        'admin-dashboard':   <AdminDashboard        {...shared} />,
        'fleet-list':        <FleetListScreen       {...shared} />,
        'team':              <TeamScreen            {...shared} technicians={technicians} />,
        'hold-tracker':      <HoldTrackerScreen     {...shared} db={db} session={session} />,
        'reports':           <ReportsScreen         {...shared} />,
        'settings':          <SettingsScreen        {...shared} />,
        'pipeline-manager':  <PipelineManagerScreen  navigate={navigate} t={t} vehicles={vehicles} role={role} />,
        'checklist-editor':  <ChecklistEditorScreen  navigate={navigate} t={t} vehicles={vehicles} role={role} />,
        'model-manager':     <ModelManagerScreen     navigate={navigate} t={t} vehicles={vehicles} role={role} />,
        'employee-settings': <EmployeeSettingsScreen {...shared} />,
      };

      const showSidebar = session && userProfile && view !== 'login';
      const isTechView  = view.startsWith('tech-');

      return (
        <div className="min-h-screen bg-[#F5F5F5]">
          {/* Desktop sidebar — only when logged in */}
          {showSidebar && (
            <DesktopSidebar
              role={userProfile.role}
              currentView={view}
              navigate={navigate}
              vehicles={vehicles}
              t={t}
              onNotificationClick={() => setShowNotifs(true)}
              unreadCount={notifications.filter(n => !n.read).length}
            />
          )}
          {/* Main content wrapper */}
          <div className={
            view === 'login'
              ? 'max-w-[430px] mx-auto min-h-screen relative'
              : isTechView
                ? `${showSidebar ? 'desktop-content' : ''} min-h-screen relative`
                : `${showSidebar ? 'desktop-content' : ''} min-h-screen relative`
          }>
            {/* Tech screens: center on desktop */}
            {isTechView ? (
              <div className="lg:max-w-[680px] lg:mx-auto max-w-[430px] mx-auto">
                {screens[view] || screens['login']}
              </div>
            ) : (
              screens[view] || screens['login']
            )}
          </div>
          {detailVehicle && (
            <VehicleDetailOverlay
              vehicle={detailVehicle}
              onClose={closeDetail}
              updateVehicle={updateVehicle}
              onDeleteVehicle={deleteVehicle}
              db={db}
              isAdmin={isAdminView}
              canEdit={userCanEdit}
              t={t}
            />
          )}
          {showNotifs && (
            <NotificationsPanel
              onClose={() => setShowNotifs(false)}
              notifications={notifications}
              onMarkAllRead={async () => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                if (session) await sb.from('notifications').update({ read: true }).eq('user_id', session.user.id).eq('read', false);
              }}
              t={t}
            />
          )}
          {showAddVehicle && (
            <AddVehicleModal
              onClose={() => setShowAddVehicle(false)}
              onAdd={handleAddVehicle}
              t={t}
            />
          )}
          {showImportModal && (
            <ImportFleetModal
              onClose={() => setShowImportModal(false)}
              onBulkAdd={handleBulkImport}
            />
          )}
          {toast && (
            <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white px-5 py-2.5 rounded-full text-[12px] font-bold shadow-lg z-[80] anim-slide-up whitespace-nowrap">
              {toast}
            </div>
          )}
          <DialogHost />
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
