
-- 1. Permanent link: students.user_id
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_unique
  ON public.students(user_id) WHERE user_id IS NOT NULL;

-- 2. Update submit_parent_journey to seal identity
CREATE OR REPLACE FUNCTION public.submit_parent_journey(_payload jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
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

  -- IDENTITY SEAL: bind user to the parent role permanently.
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'parent')
    ON CONFLICT DO NOTHING;
  UPDATE public.profiles
     SET primary_role = COALESCE(primary_role, 'parent'::app_role),
         membership_status = CASE WHEN membership_status = 'visitor' OR membership_status IS NULL
                                  THEN 'applicant' ELSE membership_status END,
         updated_at = now()
   WHERE user_id = uid;

  RETURN fid;
END;
$function$;

-- 3. Update submit_student_journey to seal identity + link students.user_id
CREATE OR REPLACE FUNCTION public.submit_student_journey(_payload jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
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
                               school_name, preferred_subjects, learning_style)
  VALUES (fid,
          -- Link the student record to the auth user only when the caller
          -- is the learner themselves (not a parent adding a child).
          CASE WHEN caller_role IS NULL OR caller_role = 'student'::app_role THEN uid ELSE NULL END,
          COALESCE(stu->>'full_name',''),
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

  -- IDENTITY SEAL: only assign the student role when the caller has no
  -- prior primary role (parents adding a child keep their parent identity).
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

-- 4. Backfill: any user with a completed parent journey but no primary_role
UPDATE public.profiles p
   SET primary_role = 'parent'::app_role,
       membership_status = CASE WHEN membership_status IS NULL OR membership_status = 'visitor'
                                THEN 'applicant' ELSE membership_status END,
       updated_at = now()
 WHERE p.primary_role IS NULL
   AND EXISTS (
     SELECT 1 FROM public.family_members fm
     JOIN public.onboarding_status os ON os.family_id = fm.family_id
     WHERE fm.user_id = p.user_id AND os.journey = 'parent' AND os.status = 'completed'
   );

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT fm.user_id, 'parent'::app_role
  FROM public.family_members fm
  JOIN public.onboarding_status os ON os.family_id = fm.family_id
 WHERE os.journey = 'parent' AND os.status = 'completed'
ON CONFLICT DO NOTHING;

-- Backfill student primary role for users who only completed the student journey
UPDATE public.profiles p
   SET primary_role = 'student'::app_role,
       membership_status = CASE WHEN membership_status IS NULL OR membership_status = 'visitor'
                                THEN 'applicant' ELSE membership_status END,
       updated_at = now()
 WHERE p.primary_role IS NULL
   AND EXISTS (
     SELECT 1 FROM public.family_members fm
     JOIN public.onboarding_status os ON os.family_id = fm.family_id
     WHERE fm.user_id = p.user_id AND os.journey = 'student' AND os.status = 'completed'
   );

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT fm.user_id, 'student'::app_role
  FROM public.family_members fm
  JOIN public.onboarding_status os ON os.family_id = fm.family_id
  JOIN public.profiles p ON p.user_id = fm.user_id
 WHERE os.journey = 'student' AND os.status = 'completed'
   AND p.primary_role = 'student'::app_role
ON CONFLICT DO NOTHING;

-- Backfill students.user_id for single-student families where the family
-- primary member has student primary_role.
UPDATE public.students s
   SET user_id = fm.user_id
  FROM public.family_members fm
  JOIN public.profiles p ON p.user_id = fm.user_id
 WHERE s.user_id IS NULL
   AND s.family_id = fm.family_id
   AND p.primary_role = 'student'::app_role
   AND (SELECT count(*) FROM public.students s2 WHERE s2.family_id = s.family_id) = 1;

-- 5. Single resolver used by every post-auth entry point.
CREATE OR REPLACE FUNCTION public.resolve_identity()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'user_id', uid,
    'profile', to_jsonb(p.*),
    'roles', COALESCE((SELECT array_agg(role::text) FROM public.user_roles WHERE user_id = uid), ARRAY[]::text[]),
    'family_id', fm.family_id,
    'family', to_jsonb(f.*),
    'parent', to_jsonb(par.*),
    'student', to_jsonb(stu.*),
    'instructor', to_jsonb(ins.*),
    'onboarding', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'journey', journey, 'status', status, 'final_enrolled', final_enrolled
      )) FROM public.onboarding_status WHERE family_id = fm.family_id
    ), '[]'::jsonb)
  ) INTO result
  FROM public.profiles p
  LEFT JOIN public.family_members fm ON fm.user_id = p.user_id
  LEFT JOIN public.families f ON f.id = fm.family_id
  LEFT JOIN LATERAL (
    SELECT * FROM public.parents
     WHERE family_id = fm.family_id AND (email = p.email OR is_primary = true)
     ORDER BY is_primary DESC LIMIT 1
  ) par ON true
  LEFT JOIN public.students stu ON stu.user_id = uid
  LEFT JOIN public.instructor_profiles ins ON ins.user_id = uid
  WHERE p.user_id = uid;
  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.resolve_identity() TO authenticated;
