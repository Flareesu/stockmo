-- Migration 10: Point is_admin() and is_tech() at user_profiles instead of JWT metadata.
--
-- Why: the frontend treats user_profiles as the source of truth for role
-- (loadUserProfile at StockMo-V2.html:5377). Leaving the RLS helpers on JWT
-- metadata means a role change in user_profiles has no effect until the user
-- re-authenticates. Migration 09 created user_profiles; this migration rewires
-- the helpers against it.

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_tech() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'tech'
  );
$$;
