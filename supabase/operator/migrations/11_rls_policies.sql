-- ─── ROW LEVEL SECURITY — Operator Project ────────────────────────────────────
-- All tables: only authenticated operator users can access.
-- Superadmins: full access everywhere.
-- Support: read-only on clients, feature flags, sync cache.
-- Audit log: INSERT only — no UPDATE or DELETE for anyone.

-- Enable RLS on all operator tables
ALTER TABLE operator.plans                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.clients                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.client_credentials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.operator_users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.feature_flag_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.feature_flag_overrides   ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.client_provisioning      ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.client_sync_cache        ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.operator_audit_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.operator_alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.consent_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator.data_subject_requests    ENABLE ROW LEVEL SECURITY;

-- Helper: is caller an operator user?
CREATE OR REPLACE FUNCTION operator.is_operator_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM operator.operator_users WHERE id = auth.uid()
  );
$$;

-- Helper: is caller a superadmin?
CREATE OR REPLACE FUNCTION operator.is_superadmin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM operator.operator_users WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- ── plans: readable by all operator users ──────────────────────────────────────
CREATE POLICY "plans_read" ON operator.plans
  FOR SELECT USING (operator.is_operator_user());

-- ── clients: superadmin full access, support read-only ────────────────────────
CREATE POLICY "clients_superadmin" ON operator.clients
  FOR ALL USING (operator.is_superadmin());
CREATE POLICY "clients_support_read" ON operator.clients
  FOR SELECT USING (operator.is_operator_user());

-- ── client_credentials: superadmin only ───────────────────────────────────────
CREATE POLICY "credentials_superadmin" ON operator.client_credentials
  FOR ALL USING (operator.is_superadmin());

-- ── operator_users: superadmin full, support reads own row ────────────────────
CREATE POLICY "op_users_superadmin" ON operator.operator_users
  FOR ALL USING (operator.is_superadmin());
CREATE POLICY "op_users_self_read" ON operator.operator_users
  FOR SELECT USING (id = auth.uid());

-- ── feature flags: superadmin full, support read ──────────────────────────────
CREATE POLICY "flags_def_superadmin" ON operator.feature_flag_definitions
  FOR ALL USING (operator.is_superadmin());
CREATE POLICY "flags_def_read" ON operator.feature_flag_definitions
  FOR SELECT USING (operator.is_operator_user());
CREATE POLICY "flags_override_superadmin" ON operator.feature_flag_overrides
  FOR ALL USING (operator.is_superadmin());
CREATE POLICY "flags_override_read" ON operator.feature_flag_overrides
  FOR SELECT USING (operator.is_operator_user());

-- ── provisioning, sync cache, alerts: superadmin full, support read ───────────
CREATE POLICY "prov_superadmin" ON operator.client_provisioning
  FOR ALL USING (operator.is_superadmin());
CREATE POLICY "prov_read" ON operator.client_provisioning
  FOR SELECT USING (operator.is_operator_user());
CREATE POLICY "cache_superadmin" ON operator.client_sync_cache
  FOR ALL USING (operator.is_superadmin());
CREATE POLICY "cache_read" ON operator.client_sync_cache
  FOR SELECT USING (operator.is_operator_user());
CREATE POLICY "alerts_superadmin" ON operator.operator_alerts
  FOR ALL USING (operator.is_superadmin());
CREATE POLICY "alerts_read" ON operator.operator_alerts
  FOR SELECT USING (operator.is_operator_user());

-- ── audit log: INSERT only — immutable once written ───────────────────────────
CREATE POLICY "audit_insert" ON operator.operator_audit_log
  FOR INSERT WITH CHECK (operator.is_operator_user() AND actor_id = auth.uid());
CREATE POLICY "audit_read" ON operator.operator_audit_log
  FOR SELECT USING (operator.is_operator_user());
-- Intentionally: NO UPDATE or DELETE policies → append-only

-- ── DPA tables: superadmin only ───────────────────────────────────────────────
CREATE POLICY "consent_superadmin" ON operator.consent_records
  FOR ALL USING (operator.is_superadmin());
CREATE POLICY "dsr_superadmin" ON operator.data_subject_requests
  FOR ALL USING (operator.is_superadmin());
