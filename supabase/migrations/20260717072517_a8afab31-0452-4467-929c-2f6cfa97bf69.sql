
-- Family Commitments table (final admissions step)
CREATE TABLE public.family_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  signed_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  agreement_version text NOT NULL,
  agreement_text text NOT NULL,
  signature_name text,
  signature_type text NOT NULL DEFAULT 'typed',
  signed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.family_commitments TO authenticated;
GRANT ALL ON public.family_commitments TO service_role;

ALTER TABLE public.family_commitments ENABLE ROW LEVEL SECURITY;

-- Parents: view own family commitments
CREATE POLICY "family_members_view_own_commitments"
  ON public.family_commitments FOR SELECT TO authenticated
  USING (public.is_family_member(auth.uid(), family_id));

-- Instructors: view all commitments
CREATE POLICY "instructors_view_commitments"
  ON public.family_commitments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'::app_role));

-- Admins: full access
CREATE POLICY "admins_manage_commitments"
  ON public.family_commitments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_family_commitments_updated_at
  BEFORE UPDATE ON public.family_commitments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Add final_enrolled marker to onboarding_status
ALTER TABLE public.onboarding_status
  ADD COLUMN IF NOT EXISTS final_enrolled boolean NOT NULL DEFAULT false;

-- RPC: sign the family commitment (immutable insert + enrollment mark)
CREATE OR REPLACE FUNCTION public.sign_family_commitment(
  _agreement_version text,
  _agreement_text text,
  _signature_name text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  fid uuid;
  cid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _signature_name IS NULL OR length(trim(_signature_name)) = 0 THEN
    RAISE EXCEPTION 'signature_required';
  END IF;

  SELECT family_id INTO fid FROM public.family_members WHERE user_id = uid LIMIT 1;
  IF fid IS NULL THEN RAISE EXCEPTION 'no_family'; END IF;

  -- Prevent duplicate signed commitments for same version
  IF EXISTS (
    SELECT 1 FROM public.family_commitments
    WHERE family_id = fid AND agreement_version = _agreement_version AND status = 'signed'
  ) THEN
    RAISE EXCEPTION 'already_signed';
  END IF;

  INSERT INTO public.family_commitments
    (family_id, signed_by, agreement_version, agreement_text,
     signature_name, signature_type, signed_at, status)
  VALUES
    (fid, uid, _agreement_version, _agreement_text,
     trim(_signature_name), 'typed', now(), 'signed')
  RETURNING id INTO cid;

  INSERT INTO public.onboarding_status
    (family_id, journey, current_step, total_steps, completed_steps, status, completed_at, final_enrolled)
  VALUES
    (fid, 'family_commitment', 1, 1, ARRAY['family_commitment'], 'completed', now(), true);

  UPDATE public.profiles
     SET membership_status = 'enrolled', updated_at = now()
   WHERE user_id = uid;

  RETURN cid;
END;
$$;

REVOKE ALL ON FUNCTION public.sign_family_commitment(text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sign_family_commitment(text, text, text) TO authenticated;
