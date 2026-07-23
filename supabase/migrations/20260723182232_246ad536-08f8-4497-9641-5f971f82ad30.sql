
-- Reorder claim RPCs so the referenced auth.users row is verified and all
-- dependent identity rows are created BEFORE writing accepted_by (which FKs
-- auth.users(id)). Also validate uid exists in auth.users to guard against
-- stale JWTs.

CREATE OR REPLACE FUNCTION public.claim_instructor_invitation_by_token(_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  inv public.instructor_invitations%ROWTYPE;
BEGIN
  -- 1. Authenticate
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _token IS NULL THEN RETURN false; END IF;

  -- 2. Verify caller exists in auth.users (guards against stale JWT / deleted user)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = uid) THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- 3. Validate token
  SELECT * INTO inv FROM public.instructor_invitations WHERE token = _token;
  IF NOT FOUND THEN RETURN false; END IF;

  IF inv.status = 'accepted' AND inv.accepted_by = uid THEN
    RETURN true; -- idempotent
  ELSIF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invitation_%', inv.status;
  END IF;

  IF inv.expires_at < now() THEN
    UPDATE public.instructor_invitations SET status='expired' WHERE id = inv.id;
    RAISE EXCEPTION 'invitation_expired';
  END IF;

  -- 4. Create/verify profile (FK -> auth.users)
  INSERT INTO public.profiles (user_id, primary_role, membership_status)
    VALUES (uid, 'instructor', 'instructor')
    ON CONFLICT (user_id) DO UPDATE
      SET primary_role = 'instructor',
          membership_status = 'instructor',
          updated_at = now();

  -- 5. Create/verify instructor_profile (FK -> auth.users)
  INSERT INTO public.instructor_profiles (user_id) VALUES (uid)
    ON CONFLICT (user_id) DO NOTHING;

  -- 6. Assign role
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'instructor')
    ON CONFLICT DO NOTHING;

  -- 7. Mark invitation accepted (accepted_by FK now safe: identity rows exist)
  UPDATE public.instructor_invitations
     SET status = 'accepted',
         accepted_by = uid,
         accepted_at = COALESCE(accepted_at, now())
   WHERE id = inv.id;

  RETURN true;
END;
$function$;

-- Apply the same ordering to the email-based auto-claim used by loadIdentity().
CREATE OR REPLACE FUNCTION app_security.claim_instructor_invitation(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_invite_id uuid;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;

  -- Verify caller exists in auth.users before writing accepted_by
  SELECT email INTO v_email FROM auth.users WHERE id = _user_id;
  IF v_email IS NULL THEN RETURN false; END IF;

  SELECT id INTO v_invite_id
  FROM public.instructor_invitations
  WHERE lower(email) = lower(v_email) AND status = 'pending'
  ORDER BY created_at ASC LIMIT 1;

  IF v_invite_id IS NULL THEN RETURN false; END IF;

  -- Create identity rows first (all FK -> auth.users)
  INSERT INTO public.profiles (user_id, primary_role)
    VALUES (_user_id, 'instructor')
    ON CONFLICT (user_id) DO UPDATE
      SET primary_role = 'instructor', updated_at = now();

  INSERT INTO public.instructor_profiles (user_id) VALUES (_user_id)
    ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'instructor')
    ON CONFLICT DO NOTHING;

  -- Only then set accepted_by
  UPDATE public.instructor_invitations
     SET status = 'accepted', accepted_by = _user_id, accepted_at = now()
   WHERE id = v_invite_id;

  RETURN true;
END;
$function$;
