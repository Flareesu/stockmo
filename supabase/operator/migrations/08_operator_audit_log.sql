-- ─── TABLE: operator_audit_log ────────────────────────────────────────────────
-- Append-only audit trail for all operator actions.
-- RLS prevents UPDATE and DELETE — only INSERT is allowed.

CREATE TABLE operator.operator_audit_log (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID          REFERENCES operator.operator_users(id),
  action      TEXT          NOT NULL,
  target_type TEXT,
  target_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Append-only: no UPDATE or DELETE allowed even for superadmin
CREATE INDEX operator_audit_log_actor_idx ON operator.operator_audit_log (actor_id);
CREATE INDEX operator_audit_log_created_idx ON operator.operator_audit_log (created_at DESC);
