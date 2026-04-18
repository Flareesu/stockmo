-- ─── TABLE: feature_flag_definitions ──────────────────────────────────────────
-- Global flag definitions with default values.

CREATE TABLE operator.feature_flag_definitions (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key     TEXT    NOT NULL UNIQUE,
  description     TEXT,
  default_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial flags
INSERT INTO operator.feature_flag_definitions (feature_key, description, default_enabled) VALUES
  ('offline_sync_v2',      'IndexedDB-based offline sync with background queue', false),
  ('photo_capture',        'Photo upload for vehicle add and issue logging',      true),
  ('export_reports',       'CSV/Excel export for admin reports',                   true),
  ('repair_table',         'Admin repair tracking table',                          true),
  ('stockyard_location',   'Location text field in stockyard view',                true),
  ('dropdown_config',      'Admin-configurable vehicle form dropdown options',     true);

-- ─── TABLE: feature_flag_overrides ────────────────────────────────────────────
-- Per-client overrides that take precedence over defaults.

CREATE TABLE operator.feature_flag_overrides (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID    NOT NULL REFERENCES operator.feature_flag_definitions(id) ON DELETE CASCADE,
  client_id     UUID    NOT NULL REFERENCES operator.clients(id) ON DELETE CASCADE,
  enabled       BOOLEAN NOT NULL,
  UNIQUE (definition_id, client_id)
);

-- ─── VIEW: effective_feature_flags ────────────────────────────────────────────
-- Resolves the effective flag value per client (override beats default).

CREATE VIEW operator.effective_feature_flags AS
  SELECT
    d.id            AS definition_id,
    d.feature_key,
    d.description,
    c.id            AS client_id,
    c.slug          AS client_slug,
    COALESCE(o.enabled, d.default_enabled) AS enabled
  FROM operator.feature_flag_definitions d
  CROSS JOIN operator.clients c
  LEFT JOIN operator.feature_flag_overrides o
    ON o.definition_id = d.id AND o.client_id = c.id
  WHERE c.deleted_at IS NULL;
