-- ─── TABLE: operator_users ────────────────────────────────────────────────────
-- Master Dashboard users (manually provisioned — no self-signup).

CREATE TABLE operator.operator_users (
  id         UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT          NOT NULL UNIQUE
               CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role       TEXT          NOT NULL DEFAULT 'support'
               CHECK (role IN ('superadmin', 'support')),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER operator_users_updated_at
  BEFORE UPDATE ON operator.operator_users
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
