
-- 1. Add student email column
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email text;
CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_key ON public.students (user_id) WHERE user_id IS NOT NULL;

-- 2. family_invitations table
CREATE TABLE IF NOT EXISTS public.family_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('student','parent')),
  email text NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS family_invitations_family_idx ON public.family_invitations(family_id);
CREATE INDEX IF NOT EXISTS family_invitations_email_idx ON public.family_invitations(lower(email));

GRANT SELECT, INSERT, UPDATE ON public.family_invitations TO authenticated;
GRANT ALL ON public.family_invitations TO service_role;

ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family members read invitations"
  ON public.family_invitations FOR SELECT TO authenticated
  USING (public.is_family_member(auth.uid(), family_id));

CREATE POLICY "family parents create invitations"
  ON public.family_invitations FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_family_member(auth.uid(), family_id)
  );

CREATE POLICY "family parents update invitations"
  ON public.family_invitations FOR UPDATE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id))
  WITH CHECK (public.is_family_member(auth.uid(), family_id));

-- 3. RPC: create_family_invitation
CREATE OR REPLACE FUNCTION public.create_family_invitation(
  _kind text,
  _email text,
  _student_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  fid uuid;
  clean_email text := lower(trim(_email));
  tok uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _kind NOT IN ('student','parent') THEN RAISE EXCEPTION 'invalid_kind'; END IF;
  IF clean_email IS NULL OR clean_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  SELECT family_id INTO fid FROM public.family_members WHERE user_id = uid LIMIT 1;
  IF fid IS NULL THEN RAISE EXCEPTION 'no_family'; END IF;

  IF _student_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.students WHERE id = _student_id AND family_id = fid
  ) THEN
    RAISE EXCEPTION 'student_not_in_family';
  END IF;

  -- Revoke any pending invitation for the same (family, email, kind)
  UPDATE public.family_invitations
     SET status = 'revoked'
   WHERE family_id = fid
     AND kind = _kind
     AND lower(email) = clean_email
     AND status = 'pending';

  INSERT INTO public.family_invitations (family_id, student_id, kind, email, created_by)
  VALUES (fid, _student_id, _kind, clean_email, uid)
  RETURNING token INTO tok;

  RETURN tok;
END;
$$;

-- 4. RPC: claim_family_invitation
CREATE OR REPLACE FUNCTION public.claim_family_invitation(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  inv public.family_invitations%ROWTYPE;
  existing_family uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO inv FROM public.family_invitations WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'invitation_not_found'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'invitation_%', inv.status; END IF;
  IF inv.expires_at < now() THEN
    UPDATE public.family_invitations SET status='expired' WHERE id = inv.id;
    RAISE EXCEPTION 'invitation_expired';
  END IF;

  -- Prevent same-account claiming their own family invitation
  SELECT family_id INTO existing_family FROM public.family_members WHERE user_id = uid LIMIT 1;
  IF existing_family IS NOT NULL AND existing_family <> inv.family_id THEN
    RAISE EXCEPTION 'user_already_in_other_family';
  END IF;

  IF inv.kind = 'student' THEN
    -- Bind auth user to family as student
    INSERT INTO public.family_members (family_id, user_id, relation)
    VALUES (inv.family_id, uid, 'student')
    ON CONFLICT (user_id) DO NOTHING;

    IF inv.student_id IS NOT NULL THEN
      UPDATE public.students
         SET user_id = uid,
             email = COALESCE(email, inv.email)
       WHERE id = inv.student_id
         AND (user_id IS NULL OR user_id = uid);
    END IF;

    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'student')
      ON CONFLICT DO NOTHING;

    UPDATE public.profiles
       SET primary_role = 'student'::app_role,
           membership_status = CASE WHEN membership_status IN ('visitor','applicant') OR membership_status IS NULL
                                    THEN 'enrolled' ELSE membership_status END,
           updated_at = now()
     WHERE user_id = uid;

  ELSIF inv.kind = 'parent' THEN
    INSERT INTO public.family_members (family_id, user_id, relation)
    VALUES (inv.family_id, uid, 'parent')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'parent')
      ON CONFLICT DO NOTHING;

    UPDATE public.profiles
       SET primary_role = COALESCE(primary_role, 'parent'::app_role),
           membership_status = CASE WHEN membership_status IN ('visitor','applicant') OR membership_status IS NULL
                                    THEN 'enrolled' ELSE membership_status END,
           updated_at = now()
     WHERE user_id = uid;
  END IF;

  UPDATE public.family_invitations
     SET status = 'accepted',
         accepted_by = uid,
         accepted_at = now()
   WHERE id = inv.id;

  RETURN jsonb_build_object(
    'kind', inv.kind,
    'family_id', inv.family_id,
    'student_id', inv.student_id
  );
END;
$$;

-- 5. Update submit_student_journey to persist student email
CREATE OR REPLACE FUNCTION public.submit_student_journey(_payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  fid uuid;
  sid uuid;
  stu jsonb := COALESCE(_payload->'student', '{}'::jsonb);
  responses jsonb := COALESCE(_payload->'responses', '[]'::jsonb);
  r jsonb;
  total int := COALESCE((_payload->>'total_steps')::int, 4);
  caller_role app_role;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  fid := public.ensure_user_family();

  SELECT primary_role INTO caller_role FROM public.profiles WHERE user_id = uid;

  INSERT INTO public.students (family_id, user_id, full_name, date_of_birth, grade_level,
                               school_name, preferred_subjects, learning_style, email)
  VALUES (fid,
          CASE WHEN caller_role IS NULL OR caller_role = 'student'::app_role THEN uid ELSE NULL END,
          COALESCE(stu->>'full_name',''),
          NULLIF(stu->>'date_of_birth','')::date,
          stu->>'grade_level', stu->>'school_name',
          CASE WHEN stu ? 'preferred_subjects'
               THEN ARRAY(SELECT jsonb_array_elements_text(stu->'preferred_subjects')) END,
          stu->>'learning_style',
          NULLIF(lower(trim(stu->>'email')), ''))
  RETURNING id INTO sid;

  IF jsonb_typeof(responses) = 'array' THEN
    FOR r IN SELECT * FROM jsonb_array_elements(responses) LOOP
      INSERT INTO public.student_responses (student_id, step_key, question_key, answer)
      VALUES (sid, r->>'step_key', r->>'question_key', r->'answer');
    END LOOP;
  END IF;

  INSERT INTO public.onboarding_status
    (family_id, student_id, journey, current_step, total_steps, completed_steps, status, completed_at)
  VALUES (fid, sid, 'student', total, total,
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(_payload->'completed_steps','[]'::jsonb))),
          'completed', now());

  IF caller_role IS NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'student')
      ON CONFLICT DO NOTHING;
    UPDATE public.profiles
       SET primary_role = 'student'::app_role,
           membership_status = CASE WHEN membership_status = 'visitor' OR membership_status IS NULL
                                    THEN 'applicant' ELSE membership_status END,
           updated_at = now()
     WHERE user_id = uid;
  ELSE
    UPDATE public.profiles
       SET membership_status = CASE WHEN membership_status = 'visitor' OR membership_status IS NULL
                                    THEN 'applicant' ELSE membership_status END,
           updated_at = now()
     WHERE user_id = uid;
  END IF;

  RETURN sid;
END;
$function$;
