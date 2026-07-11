
-- 1. Membership status column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_status text NOT NULL DEFAULT 'visitor';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_membership_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_membership_status_check
  CHECK (membership_status IN ('visitor','applicant','enrolled','alumni','instructor'));

-- 2. Update parent journey to mark applicant
CREATE OR REPLACE FUNCTION public.submit_parent_journey(_payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  fid uuid;
  pid uuid;
  fam jsonb := COALESCE(_payload->'family', '{}'::jsonb);
  par jsonb := COALESCE(_payload->'parent', '{}'::jsonb);
  eco jsonb := COALESCE(_payload->'ecosystem', '{}'::jsonb);
  responses jsonb := COALESCE(_payload->'responses', '[]'::jsonb);
  r jsonb;
  total int := COALESCE((_payload->>'total_steps')::int, 5);
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  fid := public.ensure_user_family();

  UPDATE public.families SET
    family_name = COALESCE(fam->>'family_name', family_name),
    primary_email = COALESCE(fam->>'primary_email', primary_email),
    primary_phone = COALESCE(fam->>'primary_phone', primary_phone),
    household_size = COALESCE((fam->>'household_size')::int, household_size),
    address = COALESCE(fam->>'address', address),
    city = COALESCE(fam->>'city', city),
    state = COALESCE(fam->>'state', state),
    postal_code = COALESCE(fam->>'postal_code', postal_code),
    country = COALESCE(fam->>'country', country),
    household_languages = CASE WHEN fam ? 'household_languages'
      THEN ARRAY(SELECT jsonb_array_elements_text(fam->'household_languages'))
      ELSE household_languages END
  WHERE id = fid;

  SELECT id INTO pid FROM public.parents
    WHERE family_id = fid AND is_primary = true LIMIT 1;
  IF pid IS NULL THEN
    INSERT INTO public.parents (family_id, full_name, relationship, email, phone,
                                occupation, education_level, is_primary)
    VALUES (fid, COALESCE(par->>'full_name',''), par->>'relationship', par->>'email',
            par->>'phone', par->>'occupation', par->>'education_level', true)
    RETURNING id INTO pid;
  ELSE
    UPDATE public.parents SET
      full_name = COALESCE(par->>'full_name', full_name),
      relationship = COALESCE(par->>'relationship', relationship),
      email = COALESCE(par->>'email', email),
      phone = COALESCE(par->>'phone', phone),
      occupation = COALESCE(par->>'occupation', occupation),
      education_level = COALESCE(par->>'education_level', education_level)
    WHERE id = pid;
  END IF;

  INSERT INTO public.ecosystem_profiles (family_id, parenting_style, values_summary,
    cultural_background, support_network, tech_usage, goals, challenges, notes)
  VALUES (fid,
    eco->>'parenting_style', eco->>'values_summary', eco->>'cultural_background',
    eco->>'support_network', eco->>'tech_usage',
    CASE WHEN eco ? 'goals' THEN ARRAY(SELECT jsonb_array_elements_text(eco->'goals')) END,
    CASE WHEN eco ? 'challenges' THEN ARRAY(SELECT jsonb_array_elements_text(eco->'challenges')) END,
    eco->>'notes')
  ON CONFLICT (family_id) DO UPDATE SET
    parenting_style = EXCLUDED.parenting_style,
    values_summary = EXCLUDED.values_summary,
    cultural_background = EXCLUDED.cultural_background,
    support_network = EXCLUDED.support_network,
    tech_usage = EXCLUDED.tech_usage,
    goals = EXCLUDED.goals,
    challenges = EXCLUDED.challenges,
    notes = EXCLUDED.notes;

  IF jsonb_typeof(responses) = 'array' THEN
    FOR r IN SELECT * FROM jsonb_array_elements(responses) LOOP
      INSERT INTO public.parent_responses (family_id, parent_id, step_key, question_key, answer)
      VALUES (fid, pid, r->>'step_key', r->>'question_key', r->'answer');
    END LOOP;
  END IF;

  INSERT INTO public.onboarding_status
    (family_id, journey, current_step, total_steps, completed_steps, status, completed_at)
  VALUES (fid, 'parent', total, total,
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(_payload->'completed_steps','[]'::jsonb))),
          'completed', now());

  -- Mark user as applicant after completing the discovery journey
  UPDATE public.profiles
     SET membership_status = 'applicant', updated_at = now()
   WHERE user_id = uid
     AND membership_status IN ('visitor');

  RETURN fid;
END;
$function$;

-- 3. Update student journey similarly
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
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  fid := public.ensure_user_family();

  INSERT INTO public.students (family_id, full_name, date_of_birth, grade_level,
                               school_name, preferred_subjects, learning_style)
  VALUES (fid, COALESCE(stu->>'full_name',''),
          NULLIF(stu->>'date_of_birth','')::date,
          stu->>'grade_level', stu->>'school_name',
          CASE WHEN stu ? 'preferred_subjects'
               THEN ARRAY(SELECT jsonb_array_elements_text(stu->'preferred_subjects')) END,
          stu->>'learning_style')
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

  UPDATE public.profiles
     SET membership_status = 'applicant', updated_at = now()
   WHERE user_id = uid
     AND membership_status IN ('visitor');

  RETURN sid;
END;
$function$;

-- 4. Instructor invitation claim: also mark membership + profile role
CREATE OR REPLACE FUNCTION public.claim_instructor_invitation()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  ok boolean;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  ok := app_security.claim_instructor_invitation(uid);
  IF ok THEN
    UPDATE public.profiles
       SET membership_status = 'instructor',
           primary_role = 'instructor'::app_role,
           updated_at = now()
     WHERE user_id = uid;
  END IF;
  RETURN COALESCE(ok, false);
END;
$function$;

-- Keep API surface minimal; only authenticated users should call these
REVOKE ALL ON FUNCTION public.submit_parent_journey(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_student_journey(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_instructor_invitation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_parent_journey(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_student_journey(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_instructor_invitation() TO authenticated;
