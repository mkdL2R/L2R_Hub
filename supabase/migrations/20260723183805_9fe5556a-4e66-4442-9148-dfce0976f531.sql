
-- Update the guard to allow a transaction-scoped bypass set ONLY by
-- SECURITY DEFINER RPCs that have already validated an authorization
-- source (e.g. a valid pending instructor invitation).
CREATE OR REPLACE FUNCTION public.prevent_privileged_self_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller uuid := auth.uid();
  bypass text;
BEGIN
  -- Trusted server-side paths (service role, SECURITY DEFINER without a JWT).
  IF caller IS NULL THEN
    RETURN NEW;
  END IF;

  -- Transaction-scoped bypass. Only set inside a SECURITY DEFINER RPC that
  -- has verified an out-of-band authorization (invitation token, admin
  -- action, etc.). The `true` third arg on set_config scopes it to the
  -- current transaction so it cannot leak across requests.
  bypass := current_setting('app.role_assignment_authorized', true);
  IF bypass = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id <> caller THEN
    RAISE EXCEPTION 'Cannot assign roles to other users';
  END IF;

  IF NEW.role NOT IN ('parent'::app_role, 'student'::app_role, 'member'::app_role) THEN
    RAISE EXCEPTION 'Privileged roles cannot be self-assigned';
  END IF;

  RETURN NEW;
END;
$$;

-- Token claim: set the bypass AFTER validating the invitation, then insert.
CREATE OR REPLACE FUNCTION public.claim_instructor_invitation_by_token(_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  inv public.instructor_invitations%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _token IS NULL THEN RETURN false; END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = uid) THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  SELECT * INTO inv FROM public.instructor_invitations WHERE token = _token;
  IF NOT FOUND THEN RETURN false; END IF;

  IF inv.status = 'accepted' AND inv.accepted_by = uid THEN
    RETURN true;
  ELSIF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invitation_%', inv.status;
  END IF;

  IF inv.expires_at < now() THEN
    UPDATE public.instructor_invitations SET status='expired' WHERE id = inv.id;
    RAISE EXCEPTION 'invitation_expired';
  END IF;

  -- Invitation validated. Authorize privileged role assignment for the
  -- remainder of this transaction only.
  PERFORM set_config('app.role_assignment_authorized', 'on', true);

  INSERT INTO public.profiles (user_id, primary_role, membership_status)
    VALUES (uid, 'instructor', 'instructor')
    ON CONFLICT (user_id) DO UPDATE
      SET primary_role = 'instructor',
          membership_status = 'instructor',
          updated_at = now();

  INSERT INTO public.instructor_profiles (user_id) VALUES (uid)
    ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'instructor')
    ON CONFLICT DO NOTHING;

  UPDATE public.instructor_invitations
     SET status = 'accepted',
         accepted_by = uid,
         accepted_at = COALESCE(accepted_at, now())
   WHERE id = inv.id;

  -- Clear the bypass explicitly (also auto-clears at txn end).
  PERFORM set_config('app.role_assignment_authorized', 'off', true);

  RETURN true;
END;
$$;

-- Legacy email-based claim path uses the same bypass after validation.
CREATE OR REPLACE FUNCTION public.claim_instructor_invitation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  ok boolean;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  PERFORM set_config('app.role_assignment_authorized', 'on', true);
  ok := app_security.claim_instructor_invitation(uid);
  PERFORM set_config('app.role_assignment_authorized', 'off', true);
  IF ok THEN
    UPDATE public.profiles
       SET membership_status = 'instructor',
           primary_role = 'instructor'::app_role,
           updated_at = now()
     WHERE user_id = uid;
  END IF;
  RETURN COALESCE(ok, false);
END;
$$;
