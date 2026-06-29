-- 1. Tighten families INSERT: require user is not already in any family (or is admin)
DROP POLICY IF EXISTS "Authenticated can create a family" ON public.families;
CREATE POLICY "Users can create their first family"
ON public.families FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'administrator'::app_role)
    OR NOT EXISTS (
      SELECT 1 FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  )
);

-- 2. Instructor read-only access across family ecosystem tables
DROP POLICY IF EXISTS "Instructors can view families" ON public.families;
CREATE POLICY "Instructors can view families"
ON public.families FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'instructor'::app_role));

DROP POLICY IF EXISTS "Instructors can view parents" ON public.parents;
CREATE POLICY "Instructors can view parents"
ON public.parents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'instructor'::app_role));

DROP POLICY IF EXISTS "Instructors can view students" ON public.students;
CREATE POLICY "Instructors can view students"
ON public.students FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'instructor'::app_role));

DROP POLICY IF EXISTS "Instructors can view parent_responses" ON public.parent_responses;
CREATE POLICY "Instructors can view parent_responses"
ON public.parent_responses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'instructor'::app_role));

DROP POLICY IF EXISTS "Instructors can view student_responses" ON public.student_responses;
CREATE POLICY "Instructors can view student_responses"
ON public.student_responses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'instructor'::app_role));

DROP POLICY IF EXISTS "Instructors can view ecosystem_profiles" ON public.ecosystem_profiles;
CREATE POLICY "Instructors can view ecosystem_profiles"
ON public.ecosystem_profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'instructor'::app_role));

DROP POLICY IF EXISTS "Instructors can view onboarding_status" ON public.onboarding_status;
CREATE POLICY "Instructors can view onboarding_status"
ON public.onboarding_status FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'instructor'::app_role));

-- 3. Ensure RLS is enabled on every protected table (idempotent)
ALTER TABLE public.families            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_responses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_status   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_profiles  ENABLE ROW LEVEL SECURITY;