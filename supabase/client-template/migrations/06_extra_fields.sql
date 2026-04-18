-- ─── MIGRATION: Dynamic Extra Fields + Import Tracking ──────────────────────
-- Adds JSONB column to vehicles for storing arbitrary Excel columns,
-- and a vehicle_imports table for tracking bulk import operations.

-- ─── Add extra_fields JSONB column to vehicles ──────────────────────────────
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS extra_fields JSONB DEFAULT '{}'::jsonb;

-- GIN index for querying inside extra_fields
CREATE INDEX IF NOT EXISTS vehicles_extra_fields_idx ON vehicles USING GIN (extra_fields);

-- ─── TABLE: vehicle_imports ──────────────────────────────────────────────────
-- Tracks each bulk import operation (S3 Lambda or browser-side).
CREATE TABLE IF NOT EXISTS vehicle_imports (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name      TEXT         NOT NULL,
  source         TEXT         NOT NULL DEFAULT 's3'
                   CHECK (source IN ('s3', 'browser')),
  total_rows     INT          NOT NULL DEFAULT 0,
  imported       INT          NOT NULL DEFAULT 0,
  skipped        INT          NOT NULL DEFAULT 0,
  extra_columns  TEXT[],      -- list of extra column names discovered in the file
  status         TEXT         NOT NULL DEFAULT 'processing'
                   CHECK (status IN ('processing', 'done', 'error')),
  error_log      JSONB,
  created_by     UUID         REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX vehicle_imports_status_idx ON vehicle_imports (status, created_at DESC);
