-- Migration 11: Auto-create user_profiles row on signup and backfill existing users.
--
-- Why: migrations 09+10 made user_profiles the source of truth for role
-- (is_admin/is_tech now read it). But the existing auth trigger only creates
-- a `technicians` row for tech signups. Admins and employees never got a
-- user_profiles row, so is_admin() returned false, and RLS silently blocked
-- INSERT/UPDATE on pipeline_stages, pdi_item_templates, maint_task_templates,
-- and final_check_templates. Config screens "saved" but nothing persisted.
--
-- Fix: extend the trigger to insert into user_profiles for every signup (with
-- role taken from raw_user_meta_data.role, defaulting to 'employee') and
-- backfill any existing auth.users that don't have a profile yet.

-- Ensure technicians.profile_id exists (live dev DB has it; migration was missing).
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS profile_id UUID
    REFERENCES public.user_profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS technicians_profile_id_idx ON public.technicians (profile_id);

-- Backfill profile_id from user_id where we can.
UPDATE public.technicians SET profile_id = user_id
  WHERE profile_id IS NULL AND user_id IS NOT NULL;

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
  -- Always create a user_profiles row so RLS helpers (is_admin/is_tech) work.
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
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

-- Backfill: any existing auth.user without a profile gets one now.
-- Role inferred from raw_user_meta_data, falls back to 'employee'.
INSERT INTO public.user_profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'name', ''),
    split_part(u.email, '@', 1)
  ) AS full_name,
  CASE
    WHEN u.raw_user_meta_data ->> 'role' IN ('admin', 'tech', 'employee')
      THEN u.raw_user_meta_data ->> 'role'
    ELSE 'employee'
  END AS role
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Promote the canonical test accounts to their intended roles, in case they
-- signed up before the trigger was fixed.
UPDATE public.user_profiles SET role = 'admin'
  WHERE email = 'admin@stockmo.com' AND role <> 'admin';
UPDATE public.user_profiles SET role = 'tech'
  WHERE email = 'tech@stockmo.com' AND role <> 'tech';
