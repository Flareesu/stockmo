-- Migration 15: Order Form Config — admin-editable priorities, statuses,
-- and form fields, plus a custom_fields JSONB column on orders to hold
-- values for admin-added fields without further schema migrations.

CREATE TABLE IF NOT EXISTS public.order_priorities (
  key         TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  badge_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-600',
  ord         INT  NOT NULL DEFAULT 0,
  active      BOOL NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.order_statuses (
  key         TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'circle',
  badge_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-600',
  next_keys   TEXT[] NOT NULL DEFAULT '{}',
  ord         INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.order_form_fields (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key  TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  tab        TEXT NOT NULL CHECK (tab IN ('order','unit','dealer','logistics')),
  type       TEXT NOT NULL CHECK (type IN ('text','number','date','textarea','select')),
  options    JSONB NOT NULL DEFAULT '[]',
  required   BOOL NOT NULL DEFAULT false,
  ord        INT  NOT NULL DEFAULT 0,
  active     BOOL NOT NULL DEFAULT true,
  is_builtin BOOL NOT NULL DEFAULT false
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';

-- Drop the rigid CHECK constraints so admin-added priorities/statuses are usable.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_priority_check;

INSERT INTO order_priorities (key,label,badge_class,ord) VALUES
  ('low','Low','bg-gray-100 text-gray-500',1),
  ('normal','Normal','bg-blue-50 text-blue-600',2),
  ('high','High','bg-orange-100 text-orange-600',3),
  ('urgent','Urgent','bg-red-100 text-red-600',4)
ON CONFLICT (key) DO NOTHING;

INSERT INTO order_statuses (key,label,icon,badge_class,next_keys,ord) VALUES
  ('draft','Draft','edit_note','bg-gray-100 text-gray-600',ARRAY['pending','cancelled'],1),
  ('pending','Pending','hourglass_top','bg-amber-100 text-amber-700',ARRAY['approved','cancelled'],2),
  ('approved','Approved','thumb_up','bg-blue-100 text-blue-700',ARRAY['in_transit','cancelled'],3),
  ('in_transit','In Transit','local_shipping','bg-purple-100 text-purple-700',ARRAY['arrived'],4),
  ('arrived','Arrived','where_to_vote','bg-teal-100 text-teal-700',ARRAY['fulfilled','cancelled'],5),
  ('fulfilled','Fulfilled','check_circle','bg-emerald-100 text-emerald-700',ARRAY[]::text[],6),
  ('cancelled','Cancelled','cancel','bg-red-100 text-red-600',ARRAY[]::text[],7)
ON CONFLICT (key) DO NOTHING;

INSERT INTO order_form_fields (field_key,label,tab,type,required,ord,is_builtin) VALUES
  ('invoice_number','Invoice #','order','text',false,1,true),
  ('cs_number','CS #','order','text',false,2,true),
  ('order_date','Order Date','order','date',true,3,true),
  ('expected_arrival','Expected Arrival','order','date',false,4,true),
  ('priority','Priority','order','select',false,5,true),
  ('notes','Notes','order','textarea',false,6,true),
  ('model_id','Model','unit','select',true,1,true),
  ('variant','Variant','unit','text',false,2,true),
  ('color','Color','unit','text',false,3,true),
  ('engine','Engine','unit','text',false,4,true),
  ('fuel','Fuel','unit','text',false,5,true),
  ('quantity','Quantity','unit','number',true,6,true),
  ('dealer_id','Dealer','dealer','select',false,1,true),
  ('shipping_provider','Shipping Provider','logistics','text',false,1,true),
  ('tracking_number','Tracking #','logistics','text',false,2,true),
  ('shipped_date','Ship Date','logistics','date',false,3,true),
  ('shipping_contact','Contact Person','logistics','text',false,4,true),
  ('shipping_phone','Phone','logistics','text',false,5,true),
  ('shipping_notes','Shipping Notes','logistics','textarea',false,6,true)
ON CONFLICT (field_key) DO NOTHING;

ALTER TABLE order_priorities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_statuses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "op_read"   ON order_priorities  FOR SELECT USING (true);
CREATE POLICY "op_admin"  ON order_priorities  FOR ALL    USING (is_admin());
CREATE POLICY "os_read"   ON order_statuses    FOR SELECT USING (true);
CREATE POLICY "os_admin"  ON order_statuses    FOR ALL    USING (is_admin());
CREATE POLICY "off_read"  ON order_form_fields FOR SELECT USING (true);
CREATE POLICY "off_admin" ON order_form_fields FOR ALL    USING (is_admin());
