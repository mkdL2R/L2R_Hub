
-- 1) Drop unscoped instructor SELECT policies across family-scoped tables
DROP POLICY IF EXISTS "Instructors can view parent_responses" ON public.parent_responses;
DROP POLICY IF EXISTS "Instructors can view student_responses" ON public.student_responses;
DROP POLICY IF EXISTS "Instructors can view ecosystem_profiles" ON public.ecosystem_profiles;
DROP POLICY IF EXISTS "Instructors can view students" ON public.students;
DROP POLICY IF EXISTS "Instructors can view parents" ON public.parents;
DROP POLICY IF EXISTS "Instructors can view families" ON public.families;
DROP POLICY IF EXISTS "Instructors can view onboarding_status" ON public.onboarding_status;

-- 2) Restrict family_members INSERT: users can only add themselves,
--    and only if they are not already a member of any family.
DROP POLICY IF EXISTS "Users add themselves to a family" ON public.family_members;

CREATE POLICY "Users bootstrap own family membership"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.family_members fm WHERE fm.user_id = auth.uid()
  )
);

-- 3) Restrict instructor_profiles SELECT to staff or self
DROP POLICY IF EXISTS "Instructors view all instructor profiles" ON public.instructor_profiles;

CREATE POLICY "Staff or self can view instructor profiles"
ON public.instructor_profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_staff(auth.uid())
);
