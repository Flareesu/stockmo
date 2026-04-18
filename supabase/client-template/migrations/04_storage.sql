-- ─── Supabase Storage Bucket Setup ────────────────────────────────────────────
-- Run via Supabase Dashboard or CLI after provisioning the client project.
-- Storage buckets cannot be created via SQL migrations directly —
-- use the Supabase Management API or Dashboard UI.

-- This file documents the expected bucket configuration.

-- Bucket name: vehicle-photos
-- Public: false (use signed URLs or admin-only public access)
-- File size limit: 10 MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage RLS policies (applied via Storage > Policies in Dashboard):

-- Policy: Authenticated users can upload photos
-- INSERT: (auth.uid() IS NOT NULL)
-- Path pattern: vehicle-photos/*

-- Policy: Admins can delete photos
-- DELETE: ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')

-- Policy: All authenticated users can view photos
-- SELECT: (auth.uid() IS NOT NULL)

-- ─── File path conventions ────────────────────────────────────────────────────
-- Vehicle cover photo:  vehicle-photos/{vehicle_id}/cover.{ext}
-- Issue photos:         vehicle-photos/{vehicle_id}/issues/{check_item_id}/{uuid}.{ext}
-- General vehicle docs: vehicle-photos/{vehicle_id}/docs/{uuid}.{ext}

-- ─── Edge Function storage helper note ───────────────────────────────────────
-- In production, generate signed URLs with 1-hour expiry for viewing.
-- Use the Supabase client's storage.createSignedUrl() for private buckets.
-- The `url` column in the photos table stores the storage_path, not a signed URL.
-- Signed URLs are generated on-the-fly in the React app via:
--   supabase.storage.from('vehicle-photos').createSignedUrl(path, 3600)
