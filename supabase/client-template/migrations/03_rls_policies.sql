-- ─── ROW LEVEL SECURITY — Per-Client Schema ───────────────────────────────────
-- Two roles in each client project:
--   admin  → full CRUD on all tables (user_metadata.role = 'admin')
--   tech   → limited: read vehicles, update checks, insert history/photos

-- Enable RLS on all tables
ALTER TABLE dropdown_options    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_checks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_maintenance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_checks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_config       ENABLE ROW LEVEL SECURITY;

-- ─── Kill switch: block ALL operations when maintenance_mode is active ─────────
-- This policy must evaluate before any other policy (Supabase evaluates with OR,
-- so we invert it: only allow when NOT suspended).
CREATE OR REPLACE FUNCTION is_maintenance_mode() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT value::text = 'true' FROM client_config WHERE key = 'maintenance_mode'),
    false
  );
$$;

-- ─── Role helpers ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
$$;

CREATE OR REPLACE FUNCTION is_tech() RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'tech';
$$;

CREATE OR REPLACE FUNCTION is_authenticated_user() RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT auth.uid() IS NOT NULL AND NOT is_maintenance_mode();
$$;

-- ─── dropdown_options: admins full CRUD, techs read ───────────────────────────
CREATE POLICY "dropdown_admin" ON dropdown_options
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "dropdown_tech_read" ON dropdown_options
  FOR SELECT USING (is_authenticated_user());

-- ─── vehicles: admins full CRUD, techs read + update location/stage ───────────
CREATE POLICY "vehicles_admin" ON vehicles
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "vehicles_tech_read" ON vehicles
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "vehicles_tech_update" ON vehicles
  FOR UPDATE USING (is_tech() AND NOT is_maintenance_mode())
  WITH CHECK (is_tech());

-- ─── technicians: admins full CRUD, techs read + insert own row on signup ─────
CREATE POLICY "technicians_admin" ON technicians
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "technicians_tech_read" ON technicians
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "technicians_tech_insert_own" ON technicians
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'tech'
    AND user_id = auth.uid()
    AND NOT is_maintenance_mode()
  );

-- ─── vehicle_assignments: admins manage, techs read ───────────────────────────
CREATE POLICY "assignments_admin" ON vehicle_assignments
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "assignments_tech_read" ON vehicle_assignments
  FOR SELECT USING (is_authenticated_user());

-- ─── pdi_checks: admins full CRUD, techs read + update ───────────────────────
CREATE POLICY "pdi_admin" ON pdi_checks
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "pdi_tech_read" ON pdi_checks
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "pdi_tech_update" ON pdi_checks
  FOR UPDATE USING (is_tech() AND NOT is_maintenance_mode());

-- ─── stock_maintenance: same as pdi ──────────────────────────────────────────
CREATE POLICY "stock_admin" ON stock_maintenance
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "stock_tech_read" ON stock_maintenance
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "stock_tech_update" ON stock_maintenance
  FOR UPDATE USING (is_tech() AND NOT is_maintenance_mode());

-- ─── final_checks: same as pdi ───────────────────────────────────────────────
CREATE POLICY "final_admin" ON final_checks
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "final_tech_read" ON final_checks
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "final_tech_update" ON final_checks
  FOR UPDATE USING (is_tech() AND NOT is_maintenance_mode());

-- ─── photos: techs can upload, admins full CRUD ───────────────────────────────
CREATE POLICY "photos_admin" ON photos
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "photos_tech_read" ON photos
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "photos_tech_insert" ON photos
  FOR INSERT WITH CHECK (is_tech() AND NOT is_maintenance_mode());

-- ─── admin_alerts: admins only ────────────────────────────────────────────────
CREATE POLICY "alerts_admin" ON admin_alerts
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());

-- ─── repairs: admins only ─────────────────────────────────────────────────────
CREATE POLICY "repairs_admin" ON repairs
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());

-- ─── vehicle_history: techs can insert, admins full CRUD ─────────────────────
CREATE POLICY "history_admin" ON vehicle_history
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
CREATE POLICY "history_tech_read" ON vehicle_history
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "history_tech_insert" ON vehicle_history
  FOR INSERT WITH CHECK (is_tech() AND NOT is_maintenance_mode());

-- ─── client_config: admins read/update, no public access ─────────────────────
CREATE POLICY "config_admin" ON client_config
  FOR ALL USING (is_admin());
-- Note: maintenance_mode check is intentionally NOT on client_config itself,
-- as the kill switch function reads it. The is_maintenance_mode() function
-- is SECURITY DEFINER and reads the table directly.
