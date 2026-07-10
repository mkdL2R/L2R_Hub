
-- 1) Profile approval status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected'));

-- 2) submit_parent_journey — auth required. Creates/updates family, parent, ecosystem, responses, status.
CREATE OR REPLACE FUNCTION public.submit_parent_journey(_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    VALUES (fid,
            COALESCE(par->>'full_name',''),
            par->>'relationship',
            par->>'email',
            par->>'phone',
            par->>'occupation',
            par->>'education_level',
            true)
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

  RETURN fid;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_parent_journey(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_parent_journey(jsonb) TO authenticated;

-- 3) submit_student_journey
CREATE OR REPLACE FUNCTION public.submit_student_journey(_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  VALUES (fid,
          COALESCE(stu->>'full_name',''),
          NULLIF(stu->>'date_of_birth','')::date,
          stu->>'grade_level',
          stu->>'school_name',
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
  RETURN sid;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_student_journey(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_student_journey(jsonb) TO authenticated;

-- 4) Admin listing view via RPC
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  user_id uuid,
  email text,
  preferred_name text,
  primary_role app_role,
  status text,
  created_at timestamptz,
  family_id uuid,
  family_name text,
  journey text,
  onboarding_status text,
  current_step int,
  total_steps int
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.user_id, p.email, p.preferred_name, p.primary_role, p.status, p.created_at,
         f.id, f.family_name,
         os.journey, os.status, os.current_step, os.total_steps
  FROM public.profiles p
  LEFT JOIN public.family_members fm ON fm.user_id = p.user_id
  LEFT JOIN public.families f ON f.id = fm.family_id
  LEFT JOIN LATERAL (
    SELECT journey, status, current_step, total_steps
    FROM public.onboarding_status
    WHERE family_id = f.id
    ORDER BY updated_at DESC LIMIT 1
  ) os ON true
  WHERE public.has_role(auth.uid(), 'administrator'::app_role)
     OR public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;

-- 5) Admin set status
CREATE OR REPLACE FUNCTION public.admin_set_profile_status(_user_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'administrator'::app_role)
          OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;
  UPDATE public.profiles SET status = _status WHERE user_id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_profile_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_status(uuid, text) TO authenticated;

-- 6) Admin delete profile (data only; auth.users removal happens via server fn using service role)
CREATE OR REPLACE FUNCTION public.admin_delete_profile_data(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fid uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'administrator'::app_role)
          OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT family_id INTO fid FROM public.family_members WHERE user_id = _user_id LIMIT 1;
  IF fid IS NOT NULL THEN
    DELETE FROM public.families WHERE id = fid;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_profile_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_profile_data(uuid) TO authenticated;
