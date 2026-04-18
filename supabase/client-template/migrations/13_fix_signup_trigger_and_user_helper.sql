-- Migration 13: Fix signup trigger to match live user_profiles schema,
--               and add a helper function for manual user creation.
--
-- Problem 1 — Migration 11 was written for a user_profiles schema with
-- columns (email, full_name, role), but the live DB has (id, name, role,
-- color, permissions, created_at). So the trigger threw column-not-found
-- errors on every signup, rolling back INSERTs into auth.users and
-- leaving no way to create new accounts.
--
-- Problem 2 — Creating users via raw INSERT INTO auth.users is brittle
-- (15+ columns, easy to get the password hash wrong, must include empty
-- strings for *_token fields to avoid NULL violations). Admins should
-- have a one-call helper.

-- ── Part 1: corrected trigger ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_tech_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_name     TEXT := NEW.raw_user_meta_data ->> 'name';
  v_role     TEXT := COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee');
  v_initials TEXT;
BEGIN
  -- Always create a user_profiles row so RLS helpers (is_admin / is_tech) work.
  INSERT INTO public.user_profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(v_name, ''), split_part(NEW.email, '@', 1)),
    CASE WHEN v_role IN ('admin', 'tech', 'employee') THEN v_role ELSE 'employee' END
  )
  ON CONFLICT (id) DO NOTHING;

  -- Tech-only: also create the technicians roster row.
  IF v_role = 'tech' THEN
    v_initials := upper(
      left(split_part(v_name, ' ', 1), 1) ||
      left(split_part(v_name, ' ', 2), 1)
    );
    IF v_initials = '' OR v_initials IS NULL THEN
      v_initials := upper(left(COALESCE(v_name, 'T'), 2));
    END IF;

    INSERT INTO public.technicians (name, initials, role, online, user_id, profile_id)
    VALUES (
      COALESCE(NULLIF(v_name, ''), 'Technician'),
      COALESCE(NULLIF(v_initials, ''), 'T'),
      'technician',
      false,
      NEW.id,
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill: any existing auth.user without a user_profiles row gets one now.
INSERT INTO public.user_profiles (id, name, role)
SELECT
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'name', ''),
    split_part(u.email, '@', 1)
  ),
  CASE
    WHEN u.raw_user_meta_data ->> 'role' IN ('admin', 'tech', 'employee')
      THEN u.raw_user_meta_data ->> 'role'
    ELSE 'employee'
  END
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ── Part 2: helper function for manual user creation ─────────────────────
-- Usage from SQL Editor:
--   SELECT public.create_user('alice@stockmo.com', 'Pass1!', 'admin', 'Alice');
--   SELECT public.create_user('bob@stockmo.com',   'Pass1!', 'tech',  'Bob');
--
-- Validates the role, creates auth.users (password bcrypt-hashed), relies
-- on the signup trigger above to create user_profiles (+ technicians row
-- if role = tech). Returns the new user's UUID.
CREATE OR REPLACE FUNCTION public.create_user(
  p_email    TEXT,
  p_password TEXT,
  p_role     TEXT DEFAULT 'employee',
  p_name     TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
  v_id UUID := gen_random_uuid();
BEGIN
  IF p_role NOT IN ('admin', 'tech', 'employee') THEN
    RAISE EXCEPTION 'role must be admin, tech, or employee — got %', p_role;
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role', p_role,
      'name', COALESCE(p_name, split_part(p_email, '@', 1))
    ),
    now(), now(),
    '', '', '', ''
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user(TEXT, TEXT, TEXT, TEXT) TO PUBLIC;
