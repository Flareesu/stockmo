-- ─── EXTENSIONS ───────────────────────────────────────────────────────────────
-- Required before any other migration runs.

CREATE EXTENSION IF NOT EXISTS "supabase_vault" SCHEMA vault;
CREATE EXTENSION IF NOT EXISTS "moddatetime" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Revoke Vault decryption from all public roles.
-- Only service_role (Edge Functions) can read decrypted secrets.
REVOKE ALL ON vault.decrypted_secrets FROM anon, authenticated;
REVOKE ALL ON vault.secrets FROM anon, authenticated;

-- ─── SCHEMA ───────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS operator;
