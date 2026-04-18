-- Migration 07: Add new vehicle columns, vehicle_models table, vehicle_reports table

-- New columns on vehicles table
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS variant        TEXT,
  ADD COLUMN IF NOT EXISTS exterior_color TEXT,
  ADD COLUMN IF NOT EXISTS interior_color TEXT,
  ADD COLUMN IF NOT EXISTS cs_number      TEXT,
  ADD COLUMN IF NOT EXISTS engine_number  TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS bl_number      TEXT,
  ADD COLUMN IF NOT EXISTS contract_no    TEXT,
  ADD COLUMN IF NOT EXISTS sales_status   TEXT,
  ADD COLUMN IF NOT EXISTS dealer_group   TEXT,
  ADD COLUMN IF NOT EXISTS region         TEXT;

-- vehicle_models table
CREATE TABLE IF NOT EXISTS vehicle_models (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL UNIQUE,
  variant       TEXT,
  engine        TEXT,
  fuel_type     TEXT        NOT NULL DEFAULT 'Gasoline',
  color_options TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for vehicle_models
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "vehicle_models_read" ON vehicle_models FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "vehicle_models_write" ON vehicle_models FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- vehicle_reports table
CREATE TABLE IF NOT EXISTS vehicle_reports (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_by UUID        REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vehicle_reports_vehicle_idx ON vehicle_reports (vehicle_id, created_at DESC);

-- RLS for vehicle_reports
ALTER TABLE vehicle_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "vehicle_reports_read" ON vehicle_reports FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "vehicle_reports_insert" ON vehicle_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "vehicle_reports_admin_delete" ON vehicle_reports FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
