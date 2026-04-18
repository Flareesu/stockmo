-- ─── TABLE: operator_alerts ───────────────────────────────────────────────────
-- System-level alerts for the Master Dashboard (e.g. client offline, health failures).

CREATE TABLE operator.operator_alerts (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID          REFERENCES operator.clients(id) ON DELETE CASCADE,
  type        TEXT          NOT NULL
                CHECK (type IN ('client_offline','health_failure','provisioning_failed','dpa_missing')),
  message     TEXT          NOT NULL,
  resolved    BOOLEAN       NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX operator_alerts_unresolved_idx
  ON operator.operator_alerts (client_id, created_at DESC)
  WHERE resolved = false;
