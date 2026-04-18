-- ─── TABLE: client_credentials ────────────────────────────────────────────────
-- Stores Vault secret *names* (references), NEVER the actual keys.
-- Only the get_client_secret() SECURITY DEFINER function can decrypt.

CREATE TABLE operator.client_credentials (
  client_id              UUID          NOT NULL PRIMARY KEY
                           REFERENCES operator.clients(id) ON DELETE RESTRICT,
  service_role_vault_ref TEXT          NOT NULL,
  anon_vault_ref         TEXT          NOT NULL,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON COLUMN operator.client_credentials.service_role_vault_ref IS
  'Name in vault.secrets — never stores the actual service role key';
COMMENT ON COLUMN operator.client_credentials.anon_vault_ref IS
  'Name in vault.secrets — never stores the actual anon key';
