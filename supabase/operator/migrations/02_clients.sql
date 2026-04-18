-- ─── TABLE: clients ───────────────────────────────────────────────────────────

CREATE TABLE operator.clients (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT          NOT NULL,
  slug                    TEXT          NOT NULL
                            CHECK (slug ~ '^[a-z0-9-]+$'),
  plan_id                 UUID          NOT NULL REFERENCES operator.plans(id),
  status                  TEXT          NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'suspended', 'inactive')),
  contact_email           TEXT          NOT NULL
                            CHECK (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  supabase_url            TEXT          NOT NULL,
  dpa_signed_at           TIMESTAMPTZ,
  npc_registration_number TEXT,
  deleted_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Unique slug only among non-deleted clients
CREATE UNIQUE INDEX clients_slug_active_unique
  ON operator.clients (slug)
  WHERE deleted_at IS NULL;

-- Fast lookup for active clients
CREATE INDEX clients_status_active_idx
  ON operator.clients (status)
  WHERE status = 'active';

-- Auto-update updated_at
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON operator.clients
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
