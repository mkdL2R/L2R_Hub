-- 1) Clean up: for any student row whose user_id points at a parent (i.e.
-- that user is a 'parent' in family_members), detach it so the unique
-- constraint on students.user_id stops blocking a second child.
UPDATE public.students s
   SET user_id = NULL
  FROM public.family_members fm
 WHERE s.user_id = fm.user_id
   AND fm.relation = 'parent';

-- 2) Rewrite submit_student_journey so it never attaches the caller's uid
-- to a student row unless the caller is genuinely acting as a student
-- (their profile role is 'student'). Parents adding children get user_id NULL.
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
  is_parent_member boolean;
  already_owns_student boolean;
  attach_uid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  fid := public.ensure_user_family();

  SELECT primary_role INTO caller_role FROM public.profiles WHERE user_id = uid;

  SELECT EXISTS(
    SELECT 1 FROM public.family_members
     WHERE user_id = uid AND relation = 'parent'
  ) INTO is_parent_member;

  SELECT EXISTS(
    SELECT 1 FROM public.students WHERE user_id = uid
  ) INTO already_owns_student;

  -- Only attach the auth user to the new student row when the caller is
  -- actually the student themselves (role = student, not a parent-member,
  -- and no existing student row already claims their uid).
  IF caller_role = 'student'::app_role
     AND NOT is_parent_member
     AND NOT already_owns_student THEN
    attach_uid := uid;
  ELSE
    attach_uid := NULL;
  END IF;

  INSERT INTO public.students (family_id, user_id, full_name, date_of_birth, grade_level,
                               school_name, preferred_subjects, learning_style, email)
  VALUES (fid, attach_uid,
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

  -- Role/membership bookkeeping: only self-assign the student role when the
  -- caller has no primary role AND isn't already acting as a parent.
  IF caller_role IS NULL AND NOT is_parent_member THEN
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