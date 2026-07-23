
-- 1) Backfill missing instructor_profiles for existing instructors/admins
INSERT INTO public.instructor_profiles (user_id)
SELECT DISTINCT ur.user_id
FROM public.user_roles ur
LEFT JOIN public.instructor_profiles ip ON ip.user_id = ur.user_id
WHERE ur.role IN ('instructor'::app_role, 'administrator'::app_role, 'admin'::app_role)
  AND ip.user_id IS NULL;

-- 2) Ensure claim_instructor_invitation creates an instructor_profiles row
CREATE OR REPLACE FUNCTION app_security.claim_instructor_invitation(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_invite_id uuid;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = _user_id;
  IF v_email IS NULL THEN RETURN false; END IF;

  SELECT id INTO v_invite_id
  FROM public.instructor_invitations
  WHERE lower(email) = lower(v_email) AND status = 'pending'
  ORDER BY created_at ASC LIMIT 1;

  IF v_invite_id IS NULL THEN RETURN false; END IF;

  UPDATE public.instructor_invitations
  SET status = 'accepted', accepted_by = _user_id, accepted_at = now()
  WHERE id = v_invite_id;

  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'instructor')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (user_id, primary_role) VALUES (_user_id, 'instructor')
  ON CONFLICT (user_id) DO UPDATE SET primary_role = 'instructor', updated_at = now();

  -- Ensure an instructor_profiles row exists so FKs (availability, meetings) resolve
  INSERT INTO public.instructor_profiles (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN true;
END;
$$;
