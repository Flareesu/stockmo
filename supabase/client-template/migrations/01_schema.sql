-- ─── PER-CLIENT STOCKMO SCHEMA ────────────────────────────────────────────────
-- Applied to every new dealership's Supabase project during provisioning.
-- Each client project is fully isolated — no cross-client data here.

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "moddatetime" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABLE: dropdown_options ──────────────────────────────────────────────────
-- Admin-configurable vehicle form dropdowns. Admins can add/edit/deactivate.
CREATE TABLE dropdown_options (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  field      TEXT    NOT NULL CHECK (field IN ('model', 'color', 'engine', 'fuel')),
  label      TEXT    NOT NULL,
  sort_order INT     NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (field, label)
);

CREATE TRIGGER dropdown_options_updated_at
  BEFORE UPDATE ON dropdown_options
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Seed default GAC vehicle options
INSERT INTO dropdown_options (field, label, sort_order) VALUES
  ('model', 'GS3 Emzoom', 1),
  ('model', 'GS3 EMPOW',  2),
  ('model', 'Emkoo',      3),
  ('model', 'GS8',        4),
  ('model', 'M6 Pro',     5),
  ('model', 'M8',         6),
  ('model', 'GN6',        7),
  ('color', 'White Pearl',    1),
  ('color', 'Phantom Black',  2),
  ('color', 'Galaxy Grey',    3),
  ('color', 'Space Silver',   4),
  ('color', 'Scarlet Red',    5),
  ('color', 'Aurora Blue',    6),
  ('color', 'Champagne Gold', 7),
  ('engine', '1.5T',     1),
  ('engine', '2.0T',     2),
  ('engine', '1.5NA',    3),
  ('engine', 'Electric', 4),
  ('fuel', 'Gasoline', 1),
  ('fuel', 'Diesel',   2),
  ('fuel', 'Electric', 3),
  ('fuel', 'Hybrid',   4);

-- ─── TABLE: vehicles ──────────────────────────────────────────────────────────
CREATE TABLE vehicles (
  id               TEXT         PRIMARY KEY,  -- STK-001 format
  vin              TEXT         NOT NULL,
  make             TEXT         NOT NULL DEFAULT 'GAC',
  model            TEXT         NOT NULL,
  year             INT          NOT NULL CHECK (year >= 2020 AND year <= 2030),
  color            TEXT         NOT NULL,
  engine           TEXT         NOT NULL,
  fuel             TEXT         NOT NULL,
  lot              TEXT,
  location         TEXT,         -- stockyard physical location (free text)
  stage            TEXT         NOT NULL DEFAULT 'port'
                     CHECK (stage IN ('port', 'pdi', 'stock', 'ready', 'released', 'hold')),
  arrival_date     DATE,
  pdi_date         DATE,
  stock_date       DATE,
  final_date       DATE,
  release_date     DATE,
  dealer           TEXT,
  notes            TEXT,
  cover_photo_url  TEXT,
  retention_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX vehicles_stage_idx ON vehicles (stage);
CREATE INDEX vehicles_created_idx ON vehicles (created_at DESC);

-- ─── TABLE: technicians ───────────────────────────────────────────────────────
-- No color column (removed per spec).
CREATE TABLE technicians (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT         NOT NULL,
  initials   TEXT         NOT NULL,
  role       TEXT         NOT NULL DEFAULT 'technician'
               CHECK (role IN ('senior', 'pdi_specialist', 'technician')),
  online     BOOLEAN      NOT NULL DEFAULT false,
  user_id    UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX technicians_user_id_idx ON technicians (user_id);

-- ─── TABLE: vehicle_assignments ───────────────────────────────────────────────
CREATE TABLE vehicle_assignments (
  vehicle_id  TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  tech_id     UUID         NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (vehicle_id, tech_id)
);

-- ─── TABLE: pdi_checks ────────────────────────────────────────────────────────
-- 'na' state intentionally removed — only pending, done, issue.
CREATE TABLE pdi_checks (
  vehicle_id TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  item_id    TEXT         NOT NULL,
  section    TEXT         NOT NULL,
  name       TEXT         NOT NULL,
  priority   TEXT         NOT NULL CHECK (priority IN ('high', 'med', 'low')),
  state      TEXT         NOT NULL DEFAULT 'pending'
               CHECK (state IN ('pending', 'done', 'issue')),
  note       TEXT,
  checked_at TIMESTAMPTZ,
  checked_by UUID         REFERENCES auth.users(id),
  PRIMARY KEY (vehicle_id, item_id)
);

CREATE INDEX pdi_checks_vehicle_idx ON pdi_checks (vehicle_id);

-- ─── TABLE: stock_maintenance ─────────────────────────────────────────────────
CREATE TABLE stock_maintenance (
  vehicle_id TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  task_id    TEXT         NOT NULL,
  name       TEXT         NOT NULL,
  freq_days  INT          NOT NULL CHECK (freq_days > 0),
  priority   TEXT         NOT NULL CHECK (priority IN ('high', 'med', 'low')),
  state      TEXT         NOT NULL DEFAULT 'pending'
               CHECK (state IN ('pending', 'done', 'issue')),
  last_done  DATE,
  next_due   DATE,
  note       TEXT,
  PRIMARY KEY (vehicle_id, task_id)
);

-- ─── TABLE: final_checks ──────────────────────────────────────────────────────
-- 'na' state intentionally removed — only pending, done, issue.
CREATE TABLE final_checks (
  vehicle_id TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  item_id    TEXT         NOT NULL,
  section    TEXT         NOT NULL,
  name       TEXT         NOT NULL,
  priority   TEXT         NOT NULL CHECK (priority IN ('high', 'med', 'low')),
  state      TEXT         NOT NULL DEFAULT 'pending'
               CHECK (state IN ('pending', 'done', 'issue')),
  note       TEXT,
  checked_at TIMESTAMPTZ,
  checked_by UUID         REFERENCES auth.users(id),
  PRIMARY KEY (vehicle_id, item_id)
);

CREATE INDEX final_checks_vehicle_idx ON final_checks (vehicle_id);

-- ─── TABLE: photos ────────────────────────────────────────────────────────────
-- Attached to vehicles (cover photo) or to specific check issues.
CREATE TABLE photos (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  context       TEXT         NOT NULL CHECK (context IN ('vehicle', 'pdi', 'stockyard', 'final')),
  check_item_id TEXT,        -- item_id or task_id from the relevant check table (nullable for vehicle cover)
  storage_path  TEXT         NOT NULL,
  url           TEXT         NOT NULL,
  caption       TEXT,
  uploaded_by   UUID         REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX photos_vehicle_idx ON photos (vehicle_id);
CREATE INDEX photos_check_idx   ON photos (vehicle_id, check_item_id) WHERE check_item_id IS NOT NULL;

-- ─── TABLE: admin_alerts ──────────────────────────────────────────────────────
-- Auto-created by DB trigger when any check state becomes 'issue'.
CREATE TABLE admin_alerts (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  source        TEXT         NOT NULL CHECK (source IN ('pdi', 'stockyard', 'final')),
  check_item_id TEXT         NOT NULL,
  check_name    TEXT         NOT NULL,
  note          TEXT,
  resolved      BOOLEAN      NOT NULL DEFAULT false,
  resolved_by   UUID         REFERENCES auth.users(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX admin_alerts_unresolved_idx
  ON admin_alerts (vehicle_id, created_at DESC)
  WHERE resolved = false;

-- ─── TABLE: repairs ───────────────────────────────────────────────────────────
-- Admin-managed repair tracking for vehicles with unresolved issues.
CREATE TABLE repairs (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id           UUID         NOT NULL REFERENCES admin_alerts(id) ON DELETE CASCADE,
  vehicle_id         TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  person_responsible TEXT         NOT NULL,
  contact            TEXT         NOT NULL,
  status             TEXT         NOT NULL DEFAULT 'Repairing'
                       CHECK (status IN ('Repairing', 'Done', 'Hold')),
  notes              TEXT,
  created_by         UUID         REFERENCES auth.users(id),
  updated_by         UUID         REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER repairs_updated_at
  BEFORE UPDATE ON repairs
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX repairs_status_idx ON repairs (status);
CREATE INDEX repairs_vehicle_idx ON repairs (vehicle_id);

-- ─── TABLE: vehicle_history ───────────────────────────────────────────────────
CREATE TABLE vehicle_history (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  actor_id   UUID         REFERENCES auth.users(id),
  action     TEXT         NOT NULL,
  stage_from TEXT,
  stage_to   TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX vehicle_history_vehicle_idx ON vehicle_history (vehicle_id, created_at DESC);

-- ─── TABLE: client_config ─────────────────────────────────────────────────────
-- Key-value config for this client project.
-- maintenance_mode=true activates the kill switch via RLS policy.
CREATE TABLE client_config (
  key        TEXT    PRIMARY KEY,
  value      JSONB   NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO client_config (key, value) VALUES
  ('maintenance_mode', 'false'::jsonb),
  ('app_version',      '"2.0.0"'::jsonb);
