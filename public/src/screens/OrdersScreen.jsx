    /* ─── Orders: constants ─── */
    const ORD_S = ['draft','pending','approved','in_transit','arrived','fulfilled','cancelled'];
    const ORD_LABELS = { draft:'Draft', pending:'Pending', approved:'Approved', in_transit:'In Transit', arrived:'Arrived', fulfilled:'Fulfilled', cancelled:'Cancelled' };
    const ORD_ICONS  = { draft:'edit_note', pending:'hourglass_top', approved:'thumb_up', in_transit:'local_shipping', arrived:'where_to_vote', fulfilled:'check_circle', cancelled:'cancel' };
    const ORD_COLORS = { draft:'bg-gray-100 text-gray-600', pending:'bg-amber-100 text-amber-700', approved:'bg-blue-100 text-blue-700', in_transit:'bg-purple-100 text-purple-700', arrived:'bg-teal-100 text-teal-700', fulfilled:'bg-emerald-100 text-emerald-700', cancelled:'bg-red-100 text-red-600' };
    const ORD_PRI    = { low:'bg-gray-100 text-gray-500', normal:'bg-blue-50 text-blue-600', high:'bg-orange-100 text-orange-600', urgent:'bg-red-100 text-red-600' };
    const ORD_NEXT   = { draft:['pending','cancelled'], pending:['approved','cancelled'], approved:['in_transit','cancelled'], in_transit:['arrived'], arrived:['fulfilled','cancelled'], fulfilled:[], cancelled:[] };

    function OrdStatusBadge({ status, size = 'sm' }) {
      const cls = ORD_COLORS[status] || 'bg-gray-100 text-gray-500';
      const sz  = size === 'lg' ? 'px-3 py-1.5 text-[12px]' : 'px-2 py-0.5 text-[10px]';
      return (
        <span className={`inline-flex items-center gap-1 font-bold uppercase tracking-wide rounded-full ${cls} ${sz}`}>
          <Icon name={ORD_ICONS[status] || 'circle'} className="text-[13px]" />
          {ORD_LABELS[status] || status}
        </span>
      );
    }

    function OInput({ label, value, onChange, type = 'text', placeholder, required, disabled, className = '' }) {
      return (
        <label className={`flex flex-col gap-1 ${className}`}>
          {label && <span className="text-[11px] font-bold text-muted uppercase tracking-wide">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>}
          <input
            type={type} value={value || ''} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} required={required} disabled={disabled}
            className="border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-navy bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-muted"
          />
        </label>
      );
    }

    function OSelect({ label, value, onChange, options, required, disabled, className = '' }) {
      return (
        <label className={`flex flex-col gap-1 ${className}`}>
          {label && <span className="text-[11px] font-bold text-muted uppercase tracking-wide">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>}
          <select
            value={value || ''} onChange={e => onChange(e.target.value)}
            required={required} disabled={disabled}
            className="border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-navy bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50">
            <option value="">— select —</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      );
    }

    function OTextarea({ label, value, onChange, placeholder, rows = 3, className = '' }) {
      return (
        <label className={`flex flex-col gap-1 ${className}`}>
          {label && <span className="text-[11px] font-bold text-muted uppercase tracking-wide">{label}</span>}
          <textarea
            value={value || ''} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} rows={rows}
            className="border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-navy bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </label>
      );
    }

    /* ─── OrderVehicleCard ─── */
    function OrderVehicleCard({ v, onRemove, draggable, onDragStart, onDragEnd, dimmed }) {
      const stageLabel = v.stage ? v.stage.replace(/_/g,' ') : '—';
      return (
        <div
          draggable={draggable}
          onDragStart={onDragStart} onDragEnd={onDragEnd}
          className={`bg-white border rounded-2xl p-3 flex items-start gap-3 cursor-grab select-none transition-opacity ${dimmed ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md'}`}>
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name="directions_car" className="text-primary text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-navy truncate">{v.model || v.model_name || '—'}</p>
            <p className="text-[10px] font-mono text-muted truncate">{v.id || v.vehicle_id}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {v.color && <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{v.color}</span>}
              <span className="text-[9px] bg-navy/10 text-navy px-1.5 py-0.5 rounded-full capitalize">{stageLabel}</span>
              {v.lot && <span className="text-[9px] text-muted">Lot {v.lot}</span>}
            </div>
          </div>
          {onRemove && (
            <button onClick={onRemove} className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0">
              <Icon name="close" className="text-red-500 text-[13px]" />
            </button>
          )}
        </div>
      );
    }

    /* ─── VehicleAssignmentPanel ─── */
    function VehicleAssignmentPanel({ orderId, allVehicles, assignedVehicles, onAssign, onUnassign, quantity }) {
      const [search, setSearch] = useState('');
      const [draggingId, setDraggingId] = useState(null);
      const [dropActive, setDropActive] = useState(false);
      const [filterStage, setFilterStage] = useState('all');

      const assignedIds = new Set(assignedVehicles.map(v => v.vehicle_id || v.id));

      const stages = useMemo(() => {
        const s = new Set(allVehicles.map(v => v.stage).filter(Boolean));
        return ['all', ...Array.from(s).sort()];
      }, [allVehicles]);

      const available = useMemo(() => allVehicles.filter(v => {
        if (assignedIds.has(v.id)) return false;
        const q = search.toLowerCase();
        const matchSearch = !q || (v.id||'').toLowerCase().includes(q) || (v.model||'').toLowerCase().includes(q) || (v.color||'').toLowerCase().includes(q);
        const matchStage = filterStage === 'all' || v.stage === filterStage;
        return matchSearch && matchStage;
      }), [allVehicles, assignedIds, search, filterStage]);

      const pct = quantity > 0 ? Math.min(100, Math.round((assignedVehicles.length / quantity) * 100)) : 0;

      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-bold text-muted">{assignedVehicles.length}/{quantity}</span>
          </div>

          <div className="grid grid-cols-2 gap-3" style={{ minHeight: 240 }}>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-black text-muted uppercase tracking-wide">Fleet Vehicles</p>
              <div className="flex gap-1.5">
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search VIN / model / color…"
                  className="flex-1 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <select
                  value={filterStage} onChange={e => setFilterStage(e.target.value)}
                  className="border border-gray-200 rounded-xl px-2 py-1.5 text-[11px] bg-white focus:outline-none">
                  {stages.map(s => <option key={s} value={s}>{s === 'all' ? 'All stages' : s.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 300 }}>
                {available.length === 0 && <p className="text-[11px] text-muted text-center py-4">No vehicles match</p>}
                {available.map(v => (
                  <OrderVehicleCard
                    key={v.id} v={v} draggable
                    onDragStart={() => setDraggingId(v.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onRemove={null}
                    dimmed={false}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-black text-muted uppercase tracking-wide">Assigned to Order</p>
              <div
                onDragOver={e => { e.preventDefault(); setDropActive(true); }}
                onDragLeave={() => setDropActive(false)}
                onDrop={async e => {
                  e.preventDefault(); setDropActive(false);
                  if (draggingId) { await onAssign(draggingId); setDraggingId(null); }
                }}
                className={`flex-1 border-2 rounded-2xl p-2 flex flex-col gap-1.5 overflow-y-auto transition-colors ${dropActive ? 'border-primary bg-primary/5 border-dashed' : 'border-dashed border-gray-200 bg-gray-50'}`}
                style={{ minHeight: 120, maxHeight: 300 }}>
                {assignedVehicles.length === 0 && (
                  <p className="text-[11px] text-muted text-center m-auto py-4">Drop vehicles here</p>
                )}
                {assignedVehicles.map(av => {
                  const v = allVehicles.find(x => x.id === (av.vehicle_id || av.id)) || av;
                  return (
                    <OrderVehicleCard
                      key={av.vehicle_id || av.id} v={{ ...v, id: av.vehicle_id || av.id }}
                      onRemove={() => onUnassign(av.vehicle_id || av.id)}
                      draggable={false} dimmed={false}
                    />
                  );
                })}
              </div>
              {available.slice(0,3).length > 0 && (
                <div className="flex flex-col gap-1">
                  {available.slice(0,3).map(v => (
                    <button key={v.id} onClick={() => onAssign(v.id)}
                      className="w-full text-left text-[11px] text-primary font-bold px-2 py-1 rounded-lg hover:bg-primary/5 flex items-center gap-1.5">
                      <Icon name="add_circle" className="text-base" /> {v.model || v.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    /* ─── OrderStatusStepper ─── */
    function OrderStatusStepper({ status }) {
      const flow = ['draft','pending','approved','in_transit','arrived','fulfilled'];
      const ci = flow.indexOf(status);
      return (
        <div className="flex items-center gap-0 overflow-x-auto py-1">
          {flow.map((s, i) => {
            const done = i < ci;
            const active = i === ci;
            return (
              <React.Fragment key={s}>
                <div className={`flex flex-col items-center gap-0.5 flex-shrink-0 ${active ? 'opacity-100' : done ? 'opacity-80' : 'opacity-30'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${active ? 'bg-primary text-white' : done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon name={done ? 'check' : ORD_ICONS[s]} className="text-[13px]" />
                  </div>
                  <span className={`text-[8px] uppercase tracking-wide font-bold ${active ? 'text-primary' : done ? 'text-emerald-600' : 'text-muted'}`}>{ORD_LABELS[s]}</span>
                </div>
                {i < flow.length - 1 && <div className={`h-0.5 flex-1 min-w-[12px] mx-0.5 ${i < ci ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
              </React.Fragment>
            );
          })}
          {status === 'cancelled' && (
            <div className="ml-2 flex-shrink-0 flex items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center"><Icon name="cancel" className="text-red-500 text-[13px]" /></div>
              <span className="text-[8px] uppercase tracking-wide font-bold text-red-500">Cancelled</span>
            </div>
          )}
        </div>
      );
    }

    /* ─── OrderFormModal ─── */
    function OrderFormModal({ order, models, dealers, onClose, onSave, allVehicles, session }) {
      const isEdit = !!order;
      const [tab, setTab] = useState('order');
      const [saving, setSaving] = useState(false);

      const [form, setForm] = useState({
        order_number: order?.order_number || '',
        invoice_number: order?.invoice_number || '',
        cs_number: order?.cs_number || '',
        model_id: order?.model_id || '',
        model_name: order?.model_name || '',
        variant: order?.variant || '',
        quantity: order?.quantity ?? 1,
        color: order?.color || '',
        engine: order?.engine || '',
        fuel: order?.fuel || '',
        dealer_id: order?.dealer_id || '',
        dealer_name: order?.dealer_name || '',
        order_date: order?.order_date || new Date().toISOString().slice(0,10),
        expected_arrival: order?.expected_arrival || '',
        priority: order?.priority || 'normal',
        notes: order?.notes || '',
        shipping_provider: order?.shipping_provider || '',
        tracking_number: order?.tracking_number || '',
        shipping_contact: order?.shipping_contact || '',
        shipping_phone: order?.shipping_phone || '',
        shipped_date: order?.shipped_date || '',
        shipping_notes: order?.shipping_notes || '',
      });

      const [assignedVehicles, setAssignedVehicles] = useState([]);
      const [ovLoading, setOvLoading] = useState(false);

      useEffect(() => {
        if (isEdit && order.id) {
          setOvLoading(true);
          sb.from('order_vehicles').select('vehicle_id').eq('order_id', order.id)
            .then(({ data }) => { setAssignedVehicles(data || []); setOvLoading(false); });
        }
      }, []);

      const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

      const handleModelChange = id => {
        const m = models.find(x => x.id === id);
        upd('model_id', id);
        upd('model_name', m?.name || '');
      };

      const handleDealerChange = id => {
        const d = dealers.find(x => x.id === id);
        upd('dealer_id', id);
        upd('dealer_name', d?.name || '');
      };

      const handleAssign = async vehicleId => {
        if (!isEdit) {
          setAssignedVehicles(prev => prev.some(x => x.vehicle_id === vehicleId) ? prev : [...prev, { vehicle_id: vehicleId }]);
          return;
        }
        const { error } = await sb.rpc('assign_vehicle_to_order', { p_order_id: order.id, p_vehicle_id: vehicleId });
        if (error) { stockmoDialog.alert({ title: 'Error', message: error.message }); return; }
        setAssignedVehicles(prev => [...prev, { vehicle_id: vehicleId }]);
      };

      const handleUnassign = async vehicleId => {
        if (!isEdit) {
          setAssignedVehicles(prev => prev.filter(x => x.vehicle_id !== vehicleId));
          return;
        }
        await sb.rpc('unassign_vehicle_from_order', { p_order_id: order.id, p_vehicle_id: vehicleId });
        setAssignedVehicles(prev => prev.filter(x => x.vehicle_id !== vehicleId));
      };

      const handleSave = async () => {
        if (!form.model_name) { stockmoDialog.alert({ title: 'Required', message: 'Please select a model.' }); return; }
        setSaving(true);
        try {
          let ordNum = form.order_number;
          if (!ordNum) {
            const { count } = await sb.from('orders').select('*', { count: 'exact', head: true });
            ordNum = 'ORD-' + String((count || 0) + 1).padStart(4, '0');
          }
          const payload = {
            ...form,
            order_number:     ordNum,
            created_by:       session?.user?.id,
            model_id:         form.model_id         || null,
            dealer_id:        form.dealer_id        || null,
            approved_by:      form.approved_by      || null,
            expected_arrival: form.expected_arrival || null,
            actual_arrival:   form.actual_arrival   || null,
            shipped_date:     form.shipped_date     || null,
          };
          if (isEdit) {
            const { error } = await sb.from('orders').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', order.id);
            if (error) throw error;
          } else {
            const { data, error } = await sb.from('orders').insert([payload]).select().single();
            if (error) throw error;
            for (const av of assignedVehicles) {
              await sb.rpc('assign_vehicle_to_order', { p_order_id: data.id, p_vehicle_id: av.vehicle_id });
            }
          }
          onSave();
        } catch (e) {
          stockmoDialog.alert({ title: 'Save Error', message: e.message });
        } finally {
          setSaving(false);
        }
      };

      const tabs = [
        { id: 'order', label: 'Order', icon: 'receipt_long' },
        { id: 'unit', label: 'Units', icon: 'directions_car' },
        { id: 'dealer', label: 'Dealer', icon: 'store' },
        { id: 'logistics', label: 'Logistics', icon: 'local_shipping' },
      ];

      return (
        <Modal open onClose={onClose} panelClassName="max-h-[90vh] flex flex-col lg:max-w-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <p className="font-black text-navy text-[15px]">{isEdit ? `Edit ${order.order_number}` : 'New Order'}</p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Icon name="close" className="text-[16px] text-muted" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex gap-1 border-b border-gray-100 mb-4">
            {tabs.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-wide border-b-2 transition-colors ${tab === tb.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-navy'}`}>
                <Icon name={tb.icon} className="text-base" /> {tb.label}
              </button>
            ))}
          </div>

          {tab === 'order' && (
            <div className="grid grid-cols-2 gap-3">
              <OInput label="Invoice #" value={form.invoice_number} onChange={v => upd('invoice_number', v)} className="col-span-1" />
              <OInput label="CS #" value={form.cs_number} onChange={v => upd('cs_number', v)} className="col-span-1" />
              <OInput label="Order Date" type="date" value={form.order_date} onChange={v => upd('order_date', v)} required className="col-span-1" />
              <OInput label="Expected Arrival" type="date" value={form.expected_arrival} onChange={v => upd('expected_arrival', v)} className="col-span-1" />
              <OSelect label="Priority" value={form.priority} onChange={v => upd('priority', v)}
                options={['low','normal','high','urgent'].map(p => ({ value:p, label:p.charAt(0).toUpperCase()+p.slice(1) }))}
                className="col-span-1" />
              <OTextarea label="Notes" value={form.notes} onChange={v => upd('notes', v)} rows={2} className="col-span-2" />
            </div>
          )}

          {tab === 'unit' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <OSelect label="Model *" value={form.model_id} onChange={handleModelChange}
                  options={models.map(m => ({ value: m.id, label: m.name }))} required className="col-span-2" />
                <OInput label="Variant" value={form.variant} onChange={v => upd('variant', v)} />
                <OInput label="Color" value={form.color} onChange={v => upd('color', v)} />
                <OInput label="Engine" value={form.engine} onChange={v => upd('engine', v)} />
                <OInput label="Fuel" value={form.fuel} onChange={v => upd('fuel', v)} />
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wide">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => upd('quantity', Math.max(1, form.quantity - 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-lg font-black">−</button>
                    <span className="text-[18px] font-black text-navy w-8 text-center">{form.quantity}</span>
                    <button onClick={() => upd('quantity', form.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/80 text-lg font-black">+</button>
                  </div>
                </div>
              </div>
              {isEdit && (
                <div>
                  <p className="text-[11px] font-black text-muted uppercase tracking-wide mb-2">Assign Fleet Units</p>
                  {ovLoading ? <p className="text-[12px] text-muted">Loading…</p> : (
                    <VehicleAssignmentPanel
                      orderId={order?.id} allVehicles={allVehicles}
                      assignedVehicles={assignedVehicles}
                      onAssign={handleAssign} onUnassign={handleUnassign}
                      quantity={form.quantity}
                    />
                  )}
                </div>
              )}
              {!isEdit && (
                <p className="text-[11px] text-muted text-center py-2 bg-blue-50 rounded-xl">Save the order first, then assign fleet units from the detail view.</p>
              )}
            </div>
          )}

          {tab === 'dealer' && (
            <div className="grid grid-cols-2 gap-3">
              <OSelect label="Dealer" value={form.dealer_id} onChange={handleDealerChange}
                options={dealers.map(d => ({ value: d.id, label: d.name }))} className="col-span-2" />
              {!form.dealer_id && (
                <OInput label="Dealer Name (manual)" value={form.dealer_name} onChange={v => upd('dealer_name', v)} className="col-span-2" />
              )}
            </div>
          )}

          {tab === 'logistics' && (
            <div className="grid grid-cols-2 gap-3">
              <OInput label="Shipping Provider" value={form.shipping_provider} onChange={v => upd('shipping_provider', v)} className="col-span-2" />
              <OInput label="Tracking Number" value={form.tracking_number} onChange={v => upd('tracking_number', v)} className="col-span-1" />
              <OInput label="Ship Date" type="date" value={form.shipped_date} onChange={v => upd('shipped_date', v)} className="col-span-1" />
              <OInput label="Contact Person" value={form.shipping_contact} onChange={v => upd('shipping_contact', v)} className="col-span-1" />
              <OInput label="Contact Phone" value={form.shipping_phone} onChange={v => upd('shipping_phone', v)} className="col-span-1" />
              <OTextarea label="Shipping Notes" value={form.shipping_notes} onChange={v => upd('shipping_notes', v)} rows={3} className="col-span-2" />
            </div>
          )}
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-[12px] font-bold text-muted rounded-full border border-gray-200 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-[12px] font-black text-white bg-primary rounded-full hover:bg-primary/80 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <><Icon name="progress_activity" className="text-base animate-spin" /> Saving…</> : <><Icon name="save" className="text-base" /> Save Order</>}
            </button>
          </div>
        </Modal>
      );
    }

    /* ─── OrderDetailPanel ─── */
    function OrderDetailPanel({ order, allVehicles, models, dealers, onClose, onRefresh, session, role }) {
      const [tab, setTab] = useState('details');
      const [history, setHistory] = useState([]);
      const [notes, setNotes] = useState([]);
      const [ordVehicles, setOrdVehicles] = useState([]);
      const [loading, setLoading] = useState(true);
      const [noteText, setNoteText] = useState('');
      const [submittingNote, setSubmittingNote] = useState(false);
      const [statusChanging, setStatusChanging] = useState(false);
      const [editOpen, setEditOpen] = useState(false);

      const loadAll = async () => {
        setLoading(true);
        const [hRes, nRes, ovRes] = await Promise.all([
          sb.from('order_history').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
          sb.from('order_notes').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
          sb.from('order_vehicles').select('vehicle_id').eq('order_id', order.id),
        ]);
        setHistory(hRes.data || []);
        setNotes(nRes.data || []);
        setOrdVehicles(ovRes.data || []);
        setLoading(false);
      };

      useEffect(() => { loadAll(); }, [order.id]);

      const canAdvance = ORD_NEXT[order.status]?.length > 0;
      const isAdmin = role === 'admin';

      const changeStatus = async newStatus => {
        setStatusChanging(true);
        const { error } = await sb.from('orders').update({ status: newStatus, updated_at: new Date().toISOString(), ...(newStatus === 'approved' ? { approved_by: session?.user?.id, approved_at: new Date().toISOString() } : {}) }).eq('id', order.id);
        if (!error) {
          await sb.from('order_history').insert([{ order_id: order.id, actor_id: session?.user?.id, action: 'status_changed', status_from: order.status, status_to: newStatus }]);
          onRefresh(newStatus);
        }
        setStatusChanging(false);
      };

      const handleAssign = async vehicleId => {
        const { error } = await sb.rpc('assign_vehicle_to_order', { p_order_id: order.id, p_vehicle_id: vehicleId });
        if (error) { stockmoDialog.alert({ title: 'Assignment Error', message: error.message }); return; }
        setOrdVehicles(prev => [...prev, { vehicle_id: vehicleId }]);
      };

      const handleUnassign = async vehicleId => {
        await sb.rpc('unassign_vehicle_from_order', { p_order_id: order.id, p_vehicle_id: vehicleId });
        setOrdVehicles(prev => prev.filter(x => x.vehicle_id !== vehicleId));
      };

      const submitNote = async () => {
        if (!noteText.trim()) return;
        setSubmittingNote(true);
        const { error } = await sb.from('order_notes').insert([{ order_id: order.id, author_id: session?.user?.id, author_name: session?.user?.email || 'User', body: noteText.trim() }]);
        if (!error) { setNoteText(''); await loadAll(); }
        setSubmittingNote(false);
      };

      const tabs = [
        { id: 'details', label: 'Details', icon: 'info' },
        { id: 'vehicles', label: 'Vehicles', icon: 'directions_car' },
        { id: 'logistics', label: 'Logistics', icon: 'local_shipping' },
        { id: 'history', label: 'History', icon: 'history' },
        { id: 'notes', label: 'Notes', icon: 'chat_bubble' },
      ];

      const fdt = d => d ? new Date(d).toLocaleDateString() : '—';

      return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between p-4 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-black text-navy">{order.order_number}</span>
                  <OrdStatusBadge status={order.status} />
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ORD_PRI[order.priority]}`}>{order.priority}</span>
                </div>
                <p className="text-[12px] text-muted mt-0.5">{order.model_name} · {order.dealer_name || 'No dealer'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin && <button onClick={() => setEditOpen(true)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Icon name="edit" className="text-[16px] text-muted" /></button>}
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Icon name="close" className="text-[16px] text-muted" /></button>
              </div>
            </div>

            <div className="px-4 py-2 border-b border-gray-100">
              <OrderStatusStepper status={order.status} />
            </div>

            <div className="flex gap-0 border-b border-gray-100 overflow-x-auto">
              {tabs.map(tb => (
                <button key={tb.id} onClick={() => setTab(tb.id)}
                  className={`flex items-center gap-1 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide border-b-2 flex-shrink-0 transition-colors ${tab === tb.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-navy'}`}>
                  <Icon name={tb.icon} className="text-[13px]" /> {tb.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading && <p className="text-[12px] text-muted text-center py-8">Loading…</p>}

              {!loading && tab === 'details' && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                  {[
                    ['Invoice #', order.invoice_number], ['CS #', order.cs_number],
                    ['Model', order.model_name], ['Variant', order.variant],
                    ['Color', order.color], ['Engine', order.engine],
                    ['Fuel', order.fuel], ['Qty', order.quantity],
                    ['Order Date', fdt(order.order_date)], ['Expected', fdt(order.expected_arrival)],
                    ['Arrived', fdt(order.actual_arrival)],
                    ['Approved By', order.approved_by ? order.approved_by.slice(0,8)+'…' : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wide">{label}</span>
                      <span className="text-navy">{val || '—'}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <div className="col-span-2 flex flex-col gap-0.5 mt-1">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Notes</span>
                      <span className="text-navy text-[12px]">{order.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {!loading && tab === 'vehicles' && (
                <VehicleAssignmentPanel
                  orderId={order.id} allVehicles={allVehicles}
                  assignedVehicles={ordVehicles}
                  onAssign={handleAssign} onUnassign={handleUnassign}
                  quantity={order.quantity}
                />
              )}

              {!loading && tab === 'logistics' && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                  {[
                    ['Provider', order.shipping_provider], ['Tracking #', order.tracking_number],
                    ['Contact', order.shipping_contact], ['Phone', order.shipping_phone],
                    ['Ship Date', fdt(order.shipped_date)],
                  ].map(([label, val]) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wide">{label}</span>
                      <span className="text-navy">{val || '—'}</span>
                    </div>
                  ))}
                  {order.shipping_notes && (
                    <div className="col-span-2 flex flex-col gap-0.5 mt-1">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Shipping Notes</span>
                      <span className="text-navy">{order.shipping_notes}</span>
                    </div>
                  )}
                </div>
              )}

              {!loading && tab === 'history' && (
                <div className="flex flex-col gap-2">
                  {history.length === 0 && <p className="text-[12px] text-muted text-center py-4">No history yet.</p>}
                  {history.map(h => (
                    <div key={h.id} className="flex gap-2.5 text-[11px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-navy capitalize">{h.action.replace(/_/g,' ')}</span>
                        {h.status_from && <span className="text-muted"> · {h.status_from} → {h.status_to}</span>}
                        {h.note && <span className="text-muted"> · {h.note}</span>}
                        <p className="text-muted text-[10px]">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && tab === 'notes' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    {notes.length === 0 && <p className="text-[12px] text-muted text-center py-4">No notes yet.</p>}
                    {notes.map(n => (
                      <div key={n.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-navy">{n.author_name}</span>
                          <span className="text-[10px] text-muted">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-[12px] text-navy">{n.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder="Add a note…" rows={2}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    <button onClick={submitNote} disabled={submittingNote || !noteText.trim()}
                      className="px-4 py-2 text-[12px] font-black text-white bg-primary rounded-xl hover:bg-primary/80 disabled:opacity-40">
                      {submittingNote ? '…' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {canAdvance && (
              <div className="border-t border-gray-100 p-3 flex gap-2 flex-wrap justify-end">
                {ORD_NEXT[order.status]?.map(ns => (
                  <button key={ns} onClick={() => changeStatus(ns)} disabled={statusChanging}
                    className={`px-4 py-2 text-[11px] font-black rounded-full flex items-center gap-1.5 transition-colors disabled:opacity-40 ${ns === 'cancelled' ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'bg-primary text-white hover:bg-primary/80'}`}>
                    <Icon name={ORD_ICONS[ns]} className="text-[14px]" /> {ORD_LABELS[ns]}
                  </button>
                ))}
              </div>
            )}
          </div>
          {editOpen && (
            <OrderFormModal
              order={order} models={models} dealers={dealers}
              allVehicles={allVehicles} session={session}
              onClose={() => setEditOpen(false)}
              onSave={() => { setEditOpen(false); onRefresh(order.status); }}
            />
          )}
        </div>
      );
    }

    /* ─── DealerManagerPanel ─── */
    function DealerManagerPanel({ onClose }) {
      const [dealers, setDealers] = useState([]);
      const [loading, setLoading] = useState(true);
      const [editing, setEditing] = useState(null);
      const [saving, setSaving] = useState(false);
      const blank = { name:'', group_name:'', contact_person:'', phone:'', email:'', address:'', region:'', notes:'' };
      const [form, setForm] = useState(blank);

      const load = async () => {
        const { data } = await sb.from('dealers').select('*').order('name');
        setDealers(data || []);
        setLoading(false);
      };
      useEffect(() => { load(); }, []);

      const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

      const startEdit = d => { setEditing(d.id || 'new'); setForm(d.id ? { ...d } : blank); };

      const handleSave = async () => {
        if (!form.name.trim()) { stockmoDialog.alert({ title: 'Required', message: 'Dealer name is required.' }); return; }
        setSaving(true);
        const { error } = editing === 'new'
          ? await sb.from('dealers').insert([form])
          : await sb.from('dealers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing);
        if (!error) { await load(); setEditing(null); }
        else stockmoDialog.alert({ title: 'Error', message: error.message });
        setSaving(false);
      };

      const handleDelete = async id => {
        const ok = await stockmoDialog.confirm({ title: 'Delete Dealer', message: 'Delete this dealer? Orders referencing it will keep the name.', confirmLabel: 'Delete', danger: true });
        if (!ok) return;
        await sb.from('dealers').delete().eq('id', id);
        await load();
      };

      return (
        <Modal open onClose={onClose} panelClassName="max-h-[90vh] flex flex-col lg:max-w-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <p className="font-black text-navy text-[15px]">Manage Dealers</p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Icon name="close" className="text-[16px] text-muted" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3">
            <button onClick={() => startEdit({ id: null })}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-white bg-primary rounded-full hover:bg-primary/80">
              <Icon name="add" className="text-base" /> Add Dealer
            </button>
            {loading && <p className="text-[12px] text-muted">Loading…</p>}
            {!loading && dealers.length === 0 && <p className="text-[12px] text-muted text-center py-4">No dealers yet.</p>}
            {dealers.map(d => (
              <div key={d.id} className="border border-gray-100 rounded-2xl p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-black text-navy">{d.name}</p>
                  {d.group_name && <p className="text-[11px] text-muted">{d.group_name}</p>}
                  <p className="text-[11px] text-muted">{[d.contact_person, d.phone, d.region].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => startEdit(d)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Icon name="edit" className="text-[13px] text-muted" /></button>
                  <button onClick={() => handleDelete(d.id)} className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100"><Icon name="delete" className="text-[13px] text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>

          {editing !== null && (
            <div className="fixed inset-0 bg-black/40 z-60 flex items-end md:items-center justify-center p-4">
              <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="font-black text-navy">{editing === 'new' ? 'New Dealer' : 'Edit Dealer'}</p>
                  <button onClick={() => setEditing(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Icon name="close" className="text-[14px] text-muted" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <OInput label="Name *" value={form.name} onChange={v => upd('name', v)} required className="col-span-2" />
                  <OInput label="Group / Franchise" value={form.group_name} onChange={v => upd('group_name', v)} className="col-span-2" />
                  <OInput label="Contact Person" value={form.contact_person} onChange={v => upd('contact_person', v)} />
                  <OInput label="Phone" value={form.phone} onChange={v => upd('phone', v)} />
                  <OInput label="Email" type="email" value={form.email} onChange={v => upd('email', v)} />
                  <OInput label="Region" value={form.region} onChange={v => upd('region', v)} />
                  <OTextarea label="Address" value={form.address} onChange={v => upd('address', v)} rows={2} className="col-span-2" />
                  <OTextarea label="Notes" value={form.notes} onChange={v => upd('notes', v)} rows={2} className="col-span-2" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(null)} className="px-4 py-2 text-[12px] font-bold text-muted rounded-full border border-gray-200 hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 text-[12px] font-black text-white bg-primary rounded-full hover:bg-primary/80 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </Modal>
      );
    }

    /* ─── OrdersScreen ─── */
    function OrdersScreen({ navigate, vehicles, onNotificationClick, unreadCount, t, role, session }) {
      const [orders, setOrders] = useState([]);
      const [loading, setLoading] = useState(true);
      const [models, setModels] = useState([]);
      const [dealers, setDealers] = useState([]);
      const [fleetVehicles, setFleetVehicles] = useState([]);
      const [statusFilter, setStatusFilter] = useState('all');
      const [search, setSearch] = useState('');
      const [newOrderOpen, setNewOrderOpen] = useState(false);
      const [dealerMgrOpen, setDealerMgrOpen] = useState(false);
      const [selectedOrder, setSelectedOrder] = useState(null);

      const isAdmin = role === 'admin';

      const loadData = async () => {
        setLoading(true);
        const [oRes, mRes, dRes, vRes] = await Promise.all([
          sb.from('orders').select('*').order('created_at', { ascending: false }),
          sb.from('vehicle_models').select('id, name').order('name'),
          sb.from('dealers').select('*').eq('active', true).order('name'),
          sb.from('vehicles').select('id, model, color, stage, lot, vin').order('created_at', { ascending: false }),
        ]);
        setOrders(oRes.data || []);
        setModels(mRes.data || []);
        setDealers(dRes.data || []);
        setFleetVehicles(vRes.data || []);
        setLoading(false);
      };

      useEffect(() => { loadData(); }, []);

      const filteredOrders = useMemo(() => {
        let list = orders;
        if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(o =>
            o.order_number.toLowerCase().includes(q) ||
            (o.model_name || '').toLowerCase().includes(q) ||
            (o.dealer_name || '').toLowerCase().includes(q) ||
            (o.invoice_number || '').toLowerCase().includes(q)
          );
        }
        return list;
      }, [orders, statusFilter, search]);

      const counts = useMemo(() => {
        const c = {};
        ORD_S.forEach(s => { c[s] = orders.filter(o => o.status === s).length; });
        c.all = orders.length;
        return c;
      }, [orders]);

      const handleOrderSaved = () => { setNewOrderOpen(false); loadData(); };

      const handleDetailRefresh = async newStatus => {
        await loadData();
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      };

      return (
        <div className="flex flex-col h-full bg-[#F5F5F5]">
          <header className="bg-white shadow-sm px-4 pt-safe flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top),12px)', paddingBottom: 12 }}>
            <div>
              <p className="text-[11px] text-muted font-medium">StockMo</p>
              <h1 className="text-[18px] font-black text-navy leading-tight">Orders</h1>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button onClick={() => setDealerMgrOpen(true)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                  <Icon name="store" className="text-[18px] text-muted" />
                </button>
              )}
              <button onClick={() => setNewOrderOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-black rounded-full hover:bg-primary/80">
                <Icon name="add" className="text-base" /> New Order
              </button>
              <button onClick={onNotificationClick} className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <Icon name="notifications" className="text-[20px] text-muted" />
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full text-white text-[9px] font-black flex items-center justify-center">{unreadCount}</span>}
              </button>
            </div>
          </header>

          <div className="px-4 pt-3 pb-1 flex gap-1.5 overflow-x-auto">
            {['all', ...ORD_S].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-white text-muted shadow-sm hover:bg-gray-50'}`}>
                {s !== 'all' && <Icon name={ORD_ICONS[s]} className="text-[12px]" />}
                {s === 'all' ? 'All' : ORD_LABELS[s]}
                <span className={`ml-0.5 ${statusFilter === s ? 'text-white/80' : 'text-muted'}`}>({counts[s] || 0})</span>
              </button>
            ))}
          </div>

          <div className="px-4 py-2">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[18px]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search orders…"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-gray-100 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <main className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-2">
            {loading && <p className="text-[13px] text-muted text-center py-12">Loading orders…</p>}
            {!loading && filteredOrders.length === 0 && (
              <div className="text-center py-16">
                <Icon name="receipt_long" className="text-5xl text-gray-200 mb-3" />
                <p className="text-[14px] font-bold text-muted">No orders found</p>
                <p className="text-[12px] text-muted">Create a new order to get started.</p>
              </div>
            )}
            {filteredOrders.map(o => (
              <button key={o.id} onClick={() => setSelectedOrder(o)}
                className="w-full text-left bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-black text-navy">{o.order_number}</span>
                      <OrdStatusBadge status={o.status} />
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${ORD_PRI[o.priority]}`}>{o.priority}</span>
                    </div>
                    <p className="text-[12px] text-muted mt-0.5 truncate">{o.model_name} {o.variant ? `· ${o.variant}` : ''}</p>
                    {o.dealer_name && <p className="text-[11px] text-muted truncate">{o.dealer_name}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-muted">{o.order_date}</p>
                    {o.expected_arrival && <p className="text-[10px] text-muted">ETA {o.expected_arrival}</p>}
                    <p className="text-[10px] font-bold text-navy mt-0.5">Qty {o.quantity}</p>
                  </div>
                </div>
              </button>
            ))}
          </main>

          <AdminBottomNav navigate={navigate} currentView="orders" vehicles={vehicles} t={t} role={role} />

          {newOrderOpen && (
            <OrderFormModal
              order={null} models={models} dealers={dealers}
              allVehicles={fleetVehicles} session={session}
              onClose={() => setNewOrderOpen(false)} onSave={handleOrderSaved}
            />
          )}
          {dealerMgrOpen && <DealerManagerPanel onClose={() => { setDealerMgrOpen(false); loadData(); }} />}
          {selectedOrder && (
            <OrderDetailPanel
              order={selectedOrder} allVehicles={fleetVehicles}
              models={models} dealers={dealers}
              onClose={() => setSelectedOrder(null)}
              onRefresh={handleDetailRefresh}
              session={session} role={role}
            />
          )}
        </div>
      );
    }
