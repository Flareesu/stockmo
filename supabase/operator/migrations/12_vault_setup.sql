-- ─── Vault Setup + Credential Retrieval ───────────────────────────────────────
-- SECURITY DEFINER function: callable only by service_role (Edge Functions).
-- Reads Vault ref from client_credentials, returns the decrypted secret.
-- Statement logging must be disabled before inserting secrets to prevent
-- plaintext keys appearing in Supabase logs.

CREATE OR REPLACE FUNCTION operator.get_client_secret(
  p_client_id UUID,
  p_key_type  TEXT  -- 'service_role' | 'anon'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operator, vault, public
AS $$
DECLARE
  v_vault_ref TEXT;
  v_secret    TEXT;
BEGIN
  -- Only service_role may call this function
  IF current_role NOT IN ('service_role') THEN
    RAISE EXCEPTION 'Unauthorized: get_client_secret requires service_role';
  END IF;

  -- Look up the Vault secret name for this client + key type
  SELECT
    CASE p_key_type
      WHEN 'service_role' THEN service_role_vault_ref
      WHEN 'anon'         THEN anon_vault_ref
      ELSE NULL
    END
  INTO v_vault_ref
  FROM operator.client_credentials
  WHERE client_id = p_client_id;

  IF v_vault_ref IS NULL THEN
    RAISE EXCEPTION 'No credentials found for client % (key_type: %)', p_client_id, p_key_type;
  END IF;

  -- Decrypt via Vault view (only accessible to service_role after REVOKE above)
  SELECT decrypted_secret
  INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = v_vault_ref;

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Vault secret not found: %', v_vault_ref;
  END IF;

  RETURN v_secret;
END;
$$;

REVOKE ALL ON FUNCTION operator.get_client_secret FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION operator.get_client_secret TO service_role;

-- ─── Helper: store a new client's credentials in Vault ────────────────────────
-- Call this from the provisioning Edge Function (server-side only).
-- Usage:
--   SELECT operator.store_client_credentials(
--     '<client_id>',
--     '<service_role_key>',
--     '<anon_key>'
--   );

CREATE OR REPLACE FUNCTION operator.store_client_credentials(
  p_client_id        UUID,
  p_service_role_key TEXT,
  p_anon_key         TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = operator, vault, public
AS $$
DECLARE
  v_service_ref TEXT := 'client_' || p_client_id::text || '_service_role';
  v_anon_ref    TEXT := 'client_' || p_client_id::text || '_anon';
BEGIN
  IF current_role NOT IN ('service_role') THEN
    RAISE EXCEPTION 'Unauthorized: store_client_credentials requires service_role';
  END IF;

  -- Store in Vault (encrypted at rest)
  PERFORM vault.create_secret(p_service_role_key, v_service_ref,
    'Service role key for client ' || p_client_id::text);
  PERFORM vault.create_secret(p_anon_key, v_anon_ref,
    'Anon key for client ' || p_client_id::text);

  -- Store Vault references (not the actual keys)
  INSERT INTO operator.client_credentials (client_id, service_role_vault_ref, anon_vault_ref)
  VALUES (p_client_id, v_service_ref, v_anon_ref)
  ON CONFLICT (client_id) DO UPDATE
    SET service_role_vault_ref = v_service_ref,
        anon_vault_ref         = v_anon_ref;
END;
$$;

REVOKE ALL ON FUNCTION operator.store_client_credentials FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION operator.store_client_credentials TO service_role;

-- ─── pg_cron: sync-analytics every 5 minutes ──────────────────────────────────
-- Run after Edge Functions are deployed and SUPABASE_FUNCTIONS_URL is set.
-- Uncomment and run manually after deployment:
--
-- SELECT cron.schedule(
--   'sync-analytics-5m',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--     url     := current_setting('app.functions_url') || '/sync-analytics',
--     headers := ('{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}')::jsonb
--   );
--   $$
-- );
--
-- SELECT cron.schedule(
--   'health-check-15m',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url     := current_setting('app.functions_url') || '/health-check',
--     headers := ('{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}')::jsonb
--   );
--   $$
-- );
