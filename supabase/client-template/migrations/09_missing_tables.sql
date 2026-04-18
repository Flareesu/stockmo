-- Migration 09: Create tables referenced elsewhere but previously undefined.
--   - pdi_item_templates      (seeded in 08, was never created)
--   - maint_task_templates    (seeded in 08, was never created)
--   - final_check_templates   (seeded in 08, was never created)
--   - pipeline_stages         (used by PipelineManagerScreen)
--   - user_profiles           (used by TeamScreen + RLS in 07_vehicle_columns.sql)
-- Without this, migration 08 fails on a fresh database and the admin screens
-- that query these tables receive 404s.

-- ─── TABLE: pdi_item_templates ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pdi_item_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  section    TEXT        NOT NULL,
  priority   TEXT        NOT NULL CHECK (priority IN ('high', 'med', 'low')),
  ord        INT         NOT NULL DEFAULT 0,
  required   BOOLEAN     NOT NULL DEFAULT true,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pdi_item_templates_active_idx
  ON pdi_item_templates (active, ord);

ALTER TABLE pdi_item_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pdi_templates_read"  ON pdi_item_templates
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "pdi_templates_admin" ON pdi_item_templates
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());

-- ─── TABLE: maint_task_templates ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maint_task_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  freq_days  INT         NOT NULL CHECK (freq_days > 0),
  priority   TEXT        NOT NULL CHECK (priority IN ('high', 'med', 'low')),
  ord        INT         NOT NULL DEFAULT 0,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS maint_task_templates_active_idx
  ON maint_task_templates (active, ord);

ALTER TABLE maint_task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maint_templates_read"  ON maint_task_templates
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "maint_templates_admin" ON maint_task_templates
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());

-- ─── TABLE: final_check_templates ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS final_check_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  section    TEXT        NOT NULL,
  priority   TEXT        NOT NULL CHECK (priority IN ('high', 'med', 'low')),
  ord        INT         NOT NULL DEFAULT 0,
  required   BOOLEAN     NOT NULL DEFAULT true,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS final_check_templates_active_idx
  ON final_check_templates (active, ord);

ALTER TABLE final_check_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "final_templates_read"  ON final_check_templates
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "final_templates_admin" ON final_check_templates
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());

-- ─── TABLE: pipeline_stages ───────────────────────────────────────────────────
-- Admin-configurable workflow stages. The `vehicles.stage` CHECK constraint still
-- enforces the core set (port/pdi/stock/ready/released/hold); this table lets
-- admins rename/recolor/reorder them in the UI.
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT        UNIQUE,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#6b7280',
  ord        INT         NOT NULL DEFAULT 0,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pipeline_stages_ord_idx
  ON pipeline_stages (ord);

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_read"  ON pipeline_stages
  FOR SELECT USING (is_authenticated_user());
CREATE POLICY "pipeline_admin" ON pipeline_stages
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());

INSERT INTO pipeline_stages (key, name, color, ord) VALUES
  ('port',     'Port',     '#3b82f6', 1),
  ('pdi',      'PDI',      '#f59e0b', 2),
  ('stock',    'Stock',    '#6366f1', 3),
  ('ready',    'Ready',    '#10b981', 4),
  ('released', 'Released', '#6b7280', 5),
  ('hold',     'Hold',     '#ef4444', 6)
ON CONFLICT (key) DO NOTHING;

-- ─── TABLE: user_profiles ─────────────────────────────────────────────────────
-- One row per auth user. Keeps role/permissions/profile fields queryable without
-- round-tripping through auth.users metadata.
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  role        TEXT        NOT NULL DEFAULT 'employee'
                CHECK (role IN ('admin', 'tech', 'employee')),
  permissions JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles (role);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_read" ON user_profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_admin"     ON user_profiles
  FOR ALL USING (is_admin() AND NOT is_maintenance_mode());
