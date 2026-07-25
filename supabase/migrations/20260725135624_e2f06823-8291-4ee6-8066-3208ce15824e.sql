-- 1) Widen onboarding_status.journey to include the two admissions journeys
ALTER TABLE public.onboarding_status DROP CONSTRAINT IF EXISTS onboarding_status_journey_check;
ALTER TABLE public.onboarding_status ADD CONSTRAINT onboarding_status_journey_check
  CHECK (journey = ANY (ARRAY['parent','student','alignment_meeting','family_commitment']));

-- 2) Instructor directory: readable name/bio/specialties for booking UI
CREATE OR REPLACE FUNCTION public.list_bookable_instructors()
RETURNS TABLE(user_id uuid, preferred_name text, bio text, specialties text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ip.user_id,
         COALESCE(p.preferred_name, split_part(p.email,'@',1), 'Instructor'),
         ip.bio,
         ip.specialties
  FROM public.instructor_profiles ip
  LEFT JOIN public.profiles p ON p.user_id = ip.user_id
  ORDER BY COALESCE(p.preferred_name, p.email);
$$;
GRANT EXECUTE ON FUNCTION public.list_bookable_instructors() TO authenticated;

-- 3) Public-taken-slots helper (does not leak family info)
CREATE OR REPLACE FUNCTION public.list_taken_slots(_instructor_id uuid, _from timestamptz, _to timestamptz)
RETURNS TABLE(scheduled_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT scheduled_at FROM public.alignment_meetings
   WHERE instructor_id = _instructor_id
     AND status IN ('pending','confirmed')
     AND scheduled_at >= _from AND scheduled_at < _to;
$$;
GRANT EXECUTE ON FUNCTION public.list_taken_slots(uuid, timestamptz, timestamptz) TO authenticated;

-- 4) Shared instructor team: all instructors can see & manage all meetings
DROP POLICY IF EXISTS "Instructors view assigned meetings" ON public.alignment_meetings;
DROP POLICY IF EXISTS "Instructors update assigned meetings" ON public.alignment_meetings;
CREATE POLICY "Instructors view all meetings"
  ON public.alignment_meetings FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Instructors update all meetings"
  ON public.alignment_meetings FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 5) Instructor "family admissions" review dashboard
CREATE OR REPLACE FUNCTION public.admin_list_families()
RETURNS TABLE(
  family_id uuid,
  family_name text,
  primary_email text,
  created_at timestamptz,
  parent_name text,
  student_count int,
  compass_generated boolean,
  parent_completed boolean,
  student_completed boolean,
  alignment_status text,
  alignment_at timestamptz,
  commitment_signed boolean,
  final_enrolled boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    f.id,
    f.family_name,
    f.primary_email,
    f.created_at,
    (SELECT full_name FROM public.parents WHERE family_id=f.id AND is_primary ORDER BY created_at LIMIT 1),
    (SELECT count(*)::int FROM public.students WHERE family_id=f.id),
    EXISTS(SELECT 1 FROM public.ecosystem_profiles WHERE family_id=f.id),
    EXISTS(SELECT 1 FROM public.onboarding_status WHERE family_id=f.id AND journey='parent' AND status='completed'),
    EXISTS(SELECT 1 FROM public.onboarding_status WHERE family_id=f.id AND journey='student' AND status='completed'),
    (SELECT status FROM public.alignment_meetings WHERE family_id=f.id ORDER BY scheduled_at DESC LIMIT 1),
    (SELECT scheduled_at FROM public.alignment_meetings WHERE family_id=f.id ORDER BY scheduled_at DESC LIMIT 1),
    EXISTS(SELECT 1 FROM public.family_commitments WHERE family_id=f.id AND status='signed'),
    EXISTS(SELECT 1 FROM public.onboarding_status WHERE family_id=f.id AND final_enrolled=true)
  FROM public.families f
  WHERE public.is_staff(auth.uid())
  ORDER BY f.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_families() TO authenticated;