
-- Instructor invitations table
CREATE TABLE public.instructor_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX instructor_invitations_email_pending_idx
  ON public.instructor_invitations (lower(email))
  WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE ON public.instructor_invitations TO authenticated;
GRANT ALL ON public.instructor_invitations TO service_role;

ALTER TABLE public.instructor_invitations ENABLE ROW LEVEL SECURITY;

-- Only existing instructors/staff can view or create invitations
CREATE POLICY "Instructors view invitations"
  ON public.instructor_invitations FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'instructor')
    OR public.has_role(auth.uid(), 'administrator')
    OR public.is_staff(auth.uid())
  );

CREATE POLICY "Instructors create invitations"
  ON public.instructor_invitations FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'instructor')
      OR public.has_role(auth.uid(), 'administrator')
      OR public.is_staff(auth.uid())
    )
  );

CREATE POLICY "Instructors revoke invitations"
  ON public.instructor_invitations FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'instructor')
    OR public.has_role(auth.uid(), 'administrator')
    OR public.is_staff(auth.uid())
  );

CREATE TRIGGER instructor_invitations_touch
  BEFORE UPDATE ON public.instructor_invitations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed the two initial instructor emails so first login auto-provisions them
INSERT INTO public.instructor_invitations (email, full_name, status)
VALUES
  ('gwenastone@gmail.com', 'Gwen Astone', 'pending'),
  ('left.2.right.325@gmail.com', 'L2R Instructor', 'pending')
ON CONFLICT DO NOTHING;

-- Function: claim a pending instructor invitation for the current user
CREATE OR REPLACE FUNCTION public.claim_instructor_invitation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_invite_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO v_invite_id
  FROM public.instructor_invitations
  WHERE lower(email) = lower(v_email) AND status = 'pending'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_invite_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.instructor_invitations
  SET status = 'accepted', accepted_by = v_user_id, accepted_at = now()
  WHERE id = v_invite_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'instructor')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (user_id, primary_role)
  VALUES (v_user_id, 'instructor')
  ON CONFLICT (user_id) DO UPDATE SET primary_role = 'instructor', updated_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_instructor_invitation() TO authenticated;
