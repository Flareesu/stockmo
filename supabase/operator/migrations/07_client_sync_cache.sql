-- ─── TABLE: client_sync_cache ─────────────────────────────────────────────────
-- Replaces the anti-pattern of storing seats_used in a billing row.
-- Populated by the sync-analytics Edge Function every 5 minutes.
-- synced_at makes staleness explicit — the dashboard shows "as of X min ago".

CREATE TABLE operator.client_sync_cache (
  client_id          UUID          NOT NULL PRIMARY KEY
                       REFERENCES operator.clients(id) ON DELETE CASCADE,
  active_users       INT           NOT NULL DEFAULT 0,
  total_users        INT           NOT NULL DEFAULT 0,
  total_vehicles     INT           NOT NULL DEFAULT 0,
  vehicles_by_stage  JSONB         NOT NULL DEFAULT '{}'::jsonb,
  storage_used_mb    NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_user_activity TIMESTAMPTZ,
  latency_ms         INT,
  healthy            BOOLEAN       NOT NULL DEFAULT true,
  synced_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);
