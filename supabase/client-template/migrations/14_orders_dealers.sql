-- ─── Migration 14: Dealers entity + Order Management System ──────────────────
--
-- Adds:
--   is_employee()   — role helper (missing from migration 10, needed for RLS)
--   dealers         — proper dealer entity (replaces free-text vehicles.dealer)
--   orders          — vehicle order requests (pre-arrival or pre-assignment)
--   order_history   — audit trail for order state changes
--   order_notes     — threaded comments on an order
--   order_vehicles  — junction table linking orders to specific fleet units
--
-- DB functions:
--   assign_vehicle_to_order   — prevents double-assignment, logs history
--   unassign_vehicle_from_order — removes assignment, logs history
--   generate_order_number     — returns next ORD-NNNN string
--
-- NOTE: vehicles.dealer (TEXT) is intentionally kept for backward compatibility
-- with the existing release flow. When a vehicle is released via the normal
-- workflow it still writes to vehicles.dealer. The orders system is a parallel
-- pre-arrival/requisition layer — not a replacement.

-- ─── is_employee() helper ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_employee() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'employee'
  );
$$;

-- ─── TABLE: dealers ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dealers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  group_name      TEXT,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  region          TEXT,
  active          BOOLEAN     NOT NULL DEFAULT true,
  notes           TEXT,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dealers_name_idx   ON dealers (name);
CREATE INDEX IF NOT EXISTS dealers_active_idx ON dealers (active) WHERE active = true;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dealers_read"  ON dealers FOR SELECT USING (is_authenticated_user());
CREATE POLICY "dealers_admin" ON dealers FOR ALL    USING (is_admin() AND NOT is_maintenance_mode());

-- ─── TABLE: orders ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  order_number      TEXT        NOT NULL UNIQUE,
  invoice_number    TEXT,
  cs_number         TEXT,

  -- What is being ordered
  model_id          UUID        REFERENCES vehicle_models(id) ON DELETE SET NULL,
  model_name        TEXT        NOT NULL DEFAULT '',      -- denormalised
  variant           TEXT,
  quantity          INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  color             TEXT,
  engine            TEXT,
  fuel              TEXT,

  -- Dealer
  dealer_id         UUID        REFERENCES dealers(id) ON DELETE SET NULL,
  dealer_name       TEXT        NOT NULL DEFAULT '',      -- denormalised

  -- Dates
  order_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  expected_arrival  DATE,
  actual_arrival    DATE,

  -- Lifecycle
  status            TEXT        NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','pending','approved','in_transit','arrived','fulfilled','cancelled')),
  priority          TEXT        NOT NULL DEFAULT 'normal'
                      CHECK (priority IN ('low','normal','high','urgent')),

  -- Notes
  notes             TEXT,

  -- Metadata
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_status_idx  ON orders (status);
CREATE INDEX IF NOT EXISTS orders_dealer_idx  ON orders (dealer_id);
CREATE INDEX IF NOT EXISTS orders_model_idx   ON orders (model_id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_number_idx  ON orders (order_number);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read orders
CREATE POLICY "orders_read"            ON orders FOR SELECT USING (is_authenticated_user());
-- Admins manage any order
CREATE POLICY "orders_admin"           ON orders FOR ALL    USING (is_admin() AND NOT is_maintenance_mode());
-- Employees can create orders
CREATE POLICY "orders_employee_insert" ON orders FOR INSERT WITH CHECK (is_employee() AND NOT is_maintenance_mode());
-- Employees can update their own orders while still in draft/pending
CREATE POLICY "orders_employee_update" ON orders FOR UPDATE
  USING (is_employee() AND created_by = auth.uid() AND status IN ('draft','pending') AND NOT is_maintenance_mode());

-- ─── TABLE: order_history ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  status_from TEXT,
  status_to   TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_history_order_idx
  ON order_history (order_id, created_at DESC);
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_history_read"   ON order_history FOR SELECT USING (is_authenticated_user());
CREATE POLICY "order_history_insert" ON order_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND NOT is_maintenance_mode());
CREATE POLICY "order_history_admin"  ON order_history FOR ALL    USING (is_admin() AND NOT is_maintenance_mode());

-- ─── TABLE: order_notes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT        NOT NULL DEFAULT '',
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_notes_order_idx ON order_notes (order_id, created_at ASC);
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_notes_read"       ON order_notes FOR SELECT USING (is_authenticated_user());
CREATE POLICY "order_notes_insert"     ON order_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND NOT is_maintenance_mode());
CREATE POLICY "order_notes_update_own" ON order_notes FOR UPDATE
  USING (author_id = auth.uid() AND NOT is_maintenance_mode());
CREATE POLICY "order_notes_admin"      ON order_notes FOR ALL    USING (is_admin() AND NOT is_maintenance_mode());

-- ─── TABLE: order_vehicles ────────────────────────────────────────────────────
-- Junction table linking specific fleet vehicles to an order.
-- A vehicle can only be in ONE active order at a time (enforced by function).

CREATE TABLE IF NOT EXISTS order_vehicles (
  order_id    UUID  NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vehicle_id  TEXT  NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID  REFERENCES auth.users(id) ON DELETE SET NULL,
  note        TEXT,
  PRIMARY KEY (order_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS ov_order_idx   ON order_vehicles (order_id);
CREATE INDEX IF NOT EXISTS ov_vehicle_idx ON order_vehicles (vehicle_id);
ALTER TABLE order_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ov_read"             ON order_vehicles FOR SELECT USING (is_authenticated_user());
CREATE POLICY "ov_admin"            ON order_vehicles FOR ALL    USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "ov_employee_insert"  ON order_vehicles FOR INSERT WITH CHECK (is_employee() AND NOT is_maintenance_mode());
CREATE POLICY "ov_employee_delete"  ON order_vehicles FOR DELETE USING (is_employee() AND NOT is_maintenance_mode());

-- ─── FUNCTION: generate_order_number ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT 'ORD-' || LPAD(
    (COALESCE((SELECT COUNT(*) FROM orders), 0) + 1)::TEXT,
    4, '0'
  );
$$;

-- ─── FUNCTION: assign_vehicle_to_order ───────────────────────────────────────
-- Inserts into order_vehicles, blocking if vehicle is already in another
-- active (non-fulfilled, non-cancelled) order. Logs to order_history.
CREATE OR REPLACE FUNCTION assign_vehicle_to_order(p_order_id UUID, p_vehicle_id TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM order_vehicles ov
    JOIN orders o ON o.id = ov.order_id
    WHERE ov.vehicle_id = p_vehicle_id
      AND o.status NOT IN ('fulfilled', 'cancelled')
      AND ov.order_id <> p_order_id
  ) THEN
    RAISE EXCEPTION 'Vehicle % is already assigned to another active order', p_vehicle_id;
  END IF;

  INSERT INTO order_vehicles (order_id, vehicle_id, assigned_by)
  VALUES (p_order_id, p_vehicle_id, auth.uid())
  ON CONFLICT DO NOTHING;

  INSERT INTO order_history (order_id, actor_id, action, note)
  VALUES (p_order_id, auth.uid(), 'vehicle_assigned', p_vehicle_id);
END;
$$;

-- ─── FUNCTION: unassign_vehicle_from_order ────────────────────────────────────
CREATE OR REPLACE FUNCTION unassign_vehicle_from_order(p_order_id UUID, p_vehicle_id TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM order_vehicles
  WHERE order_id = p_order_id AND vehicle_id = p_vehicle_id;

  INSERT INTO order_history (order_id, actor_id, action, note)
  VALUES (p_order_id, auth.uid(), 'vehicle_unassigned', p_vehicle_id);
END;
$$;

GRANT EXECUTE ON FUNCTION generate_order_number()                          TO authenticated;
GRANT EXECUTE ON FUNCTION assign_vehicle_to_order(UUID, TEXT)              TO authenticated;
GRANT EXECUTE ON FUNCTION unassign_vehicle_from_order(UUID, TEXT)          TO authenticated;
