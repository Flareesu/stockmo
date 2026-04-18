-- ─── Philippines Data Privacy Act (RA 10173) Compliance Tables ────────────────

-- Consent records: evidence that data subjects consented to processing
CREATE TABLE operator.consent_records (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID          NOT NULL REFERENCES operator.clients(id) ON DELETE RESTRICT,
  data_type     TEXT          NOT NULL,
  basis         TEXT          NOT NULL
                  CHECK (basis IN ('consent','contract','legal_obligation','legitimate_interests')),
  collected_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  notes         TEXT
);

-- Data subject requests: right to erasure, data access, correction
CREATE TABLE operator.data_subject_requests (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID          NOT NULL REFERENCES operator.clients(id) ON DELETE RESTRICT,
  request_type     TEXT          NOT NULL
                     CHECK (request_type IN ('erasure','access','correction','portability')),
  status           TEXT          NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','in_progress','completed','rejected')),
  submitted_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  must_resolve_by  TIMESTAMPTZ   NOT NULL
                     GENERATED ALWAYS AS (submitted_at + INTERVAL '72 hours') STORED,
  resolved_at      TIMESTAMPTZ,
  notes            TEXT
);

CREATE INDEX dsrequests_pending_idx
  ON operator.data_subject_requests (must_resolve_by)
  WHERE status IN ('pending','in_progress');
