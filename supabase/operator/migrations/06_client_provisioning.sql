-- ─── TABLE: client_provisioning ───────────────────────────────────────────────
-- Tracks onboarding steps for each client project.

CREATE TABLE operator.client_provisioning (
  client_id         UUID          NOT NULL PRIMARY KEY
                      REFERENCES operator.clients(id) ON DELETE CASCADE,
  steps_completed   JSONB         NOT NULL DEFAULT '{
    "project_created": false,
    "schema_deployed": false,
    "admin_created":   false,
    "rls_applied":     false,
    "credentials_stored": false,
    "health_check_passed": false
  }'::jsonb,
  provisioned_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER client_provisioning_updated_at
  BEFORE UPDATE ON operator.client_provisioning
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
