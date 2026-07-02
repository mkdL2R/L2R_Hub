
CREATE SCHEMA IF NOT EXISTS app_security;

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

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION app_security.claim_instructor_invitation(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_instructor_invitation()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT app_security.claim_instructor_invitation(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.claim_instructor_invitation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_instructor_invitation() TO authenticated;
