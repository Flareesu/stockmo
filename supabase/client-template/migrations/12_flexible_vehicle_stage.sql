-- Migration 12: Drop hardcoded stage CHECK constraint so pipeline stages can be dynamic.
--
-- Previously vehicles.stage had CHECK (stage IN ('port','pdi','stock','ready','released','hold')).
-- With dynamic pipeline_stages support, the import lambda now resolves inventory status values
-- to slugs and auto-creates pipeline_stages rows as needed. vehicles.stage stores those slugs.

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_stage_check,
  ALTER COLUMN stage DROP DEFAULT;
