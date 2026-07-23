
-- Add token + expiry to instructor_invitations, plus a token-based claim RPC.
ALTER TABLE public.instructor_invitations
  ADD COLUMN IF NOT EXISTS token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');

CREATE UNIQUE INDEX IF NOT EXISTS instructor_invitations_token_key
  ON public.instructor_invitations(token);

-- Token-based claim: binds ANY signed-in user (regardless of email) to the invitation.
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

  SELECT * INTO inv FROM public.instructor_invitations WHERE token = _token;
  IF NOT FOUND THEN RETURN false; END IF;

  IF inv.status = 'accepted' AND inv.accepted_by = uid THEN
    -- Idempotent: already claimed by this user; ensure identity is set.
    NULL;
  ELSIF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invitation_%', inv.status;
  END IF;

  IF inv.expires_at < now() AND inv.status = 'pending' THEN
    UPDATE public.instructor_invitations SET status='expired' WHERE id = inv.id;
    RAISE EXCEPTION 'invitation_expired';
  END IF;

  UPDATE public.instructor_invitations
     SET status = 'accepted', accepted_by = uid, accepted_at = COALESCE(accepted_at, now())
   WHERE id = inv.id;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'instructor')
    ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (user_id, primary_role, membership_status)
    VALUES (uid, 'instructor', 'instructor')
    ON CONFLICT (user_id) DO UPDATE
      SET primary_role = 'instructor',
          membership_status = 'instructor',
          updated_at = now();

  INSERT INTO public.instructor_profiles (user_id) VALUES (uid)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_instructor_invitation_by_token(uuid) TO authenticated;
