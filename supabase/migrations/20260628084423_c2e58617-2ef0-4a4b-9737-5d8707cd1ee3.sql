
-- Drop overly permissive public policies
DROP POLICY IF EXISTS "Public can manage families" ON public.families;
DROP POLICY IF EXISTS "Public can manage parents" ON public.parents;
DROP POLICY IF EXISTS "Public can manage students" ON public.students;
DROP POLICY IF EXISTS "Public can manage parent_responses" ON public.parent_responses;
DROP POLICY IF EXISTS "Public can manage student_responses" ON public.student_responses;
DROP POLICY IF EXISTS "Public can manage ecosystem_profiles" ON public.ecosystem_profiles;
DROP POLICY IF EXISTS "Public can manage onboarding_status" ON public.onboarding_status;

-- Revoke anon grants; keep authenticated + service_role
REVOKE ALL ON public.families, public.parents, public.students,
  public.parent_responses, public.student_responses,
  public.ecosystem_profiles, public.onboarding_status FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecosystem_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_status TO authenticated;

-- FAMILIES: members can read/update; any authenticated user can create (then becomes member via app logic); admin full access
CREATE POLICY "Family members can view their family"
  ON public.families FOR SELECT TO authenticated
  USING (public.is_family_member(auth.uid(), id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Authenticated can create a family"
  ON public.families FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Family members can update their family"
  ON public.families FOR UPDATE TO authenticated
  USING (public.is_family_member(auth.uid(), id) OR public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.is_family_member(auth.uid(), id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Admins can delete families"
  ON public.families FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'));

-- PARENTS
CREATE POLICY "Family members can view parents"
  ON public.parents FOR SELECT TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can insert parents"
  ON public.parents FOR INSERT TO authenticated
  WITH CHECK (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can update parents"
  ON public.parents FOR UPDATE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can delete parents"
  ON public.parents FOR DELETE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

-- STUDENTS
CREATE POLICY "Family members can view students"
  ON public.students FOR SELECT TO authenticated
  USING (family_id IS NOT NULL AND (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator')));

CREATE POLICY "Family members can insert students"
  ON public.students FOR INSERT TO authenticated
  WITH CHECK (family_id IS NOT NULL AND (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator')));

CREATE POLICY "Family members can update students"
  ON public.students FOR UPDATE TO authenticated
  USING (family_id IS NOT NULL AND (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator')))
  WITH CHECK (family_id IS NOT NULL AND (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator')));

CREATE POLICY "Family members can delete students"
  ON public.students FOR DELETE TO authenticated
  USING (family_id IS NOT NULL AND (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator')));

-- PARENT_RESPONSES
CREATE POLICY "Family members can view parent_responses"
  ON public.parent_responses FOR SELECT TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can insert parent_responses"
  ON public.parent_responses FOR INSERT TO authenticated
  WITH CHECK (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can update parent_responses"
  ON public.parent_responses FOR UPDATE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can delete parent_responses"
  ON public.parent_responses FOR DELETE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

-- STUDENT_RESPONSES (via student -> family)
CREATE POLICY "Family members can view student_responses"
  ON public.student_responses FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator') OR
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.family_id IS NOT NULL
              AND public.is_family_member(auth.uid(), s.family_id))
  );

CREATE POLICY "Family members can insert student_responses"
  ON public.student_responses FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'administrator') OR
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.family_id IS NOT NULL
              AND public.is_family_member(auth.uid(), s.family_id))
  );

CREATE POLICY "Family members can update student_responses"
  ON public.student_responses FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator') OR
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.family_id IS NOT NULL
              AND public.is_family_member(auth.uid(), s.family_id))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'administrator') OR
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.family_id IS NOT NULL
              AND public.is_family_member(auth.uid(), s.family_id))
  );

CREATE POLICY "Family members can delete student_responses"
  ON public.student_responses FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator') OR
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.family_id IS NOT NULL
              AND public.is_family_member(auth.uid(), s.family_id))
  );

-- ECOSYSTEM_PROFILES
CREATE POLICY "Family members can view ecosystem_profiles"
  ON public.ecosystem_profiles FOR SELECT TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can insert ecosystem_profiles"
  ON public.ecosystem_profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can update ecosystem_profiles"
  ON public.ecosystem_profiles FOR UPDATE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Family members can delete ecosystem_profiles"
  ON public.ecosystem_profiles FOR DELETE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id) OR public.has_role(auth.uid(), 'administrator'));

-- ONBOARDING_STATUS
CREATE POLICY "Family members can view onboarding_status"
  ON public.onboarding_status FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator') OR
    (family_id IS NOT NULL AND public.is_family_member(auth.uid(), family_id)) OR
    (student_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.students s WHERE s.id = student_id
        AND s.family_id IS NOT NULL AND public.is_family_member(auth.uid(), s.family_id)
    ))
  );

CREATE POLICY "Family members can insert onboarding_status"
  ON public.onboarding_status FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'administrator') OR
    (family_id IS NOT NULL AND public.is_family_member(auth.uid(), family_id)) OR
    (student_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.students s WHERE s.id = student_id
        AND s.family_id IS NOT NULL AND public.is_family_member(auth.uid(), s.family_id)
    ))
  );

CREATE POLICY "Family members can update onboarding_status"
  ON public.onboarding_status FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator') OR
    (family_id IS NOT NULL AND public.is_family_member(auth.uid(), family_id)) OR
    (student_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.students s WHERE s.id = student_id
        AND s.family_id IS NOT NULL AND public.is_family_member(auth.uid(), s.family_id)
    ))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'administrator') OR
    (family_id IS NOT NULL AND public.is_family_member(auth.uid(), family_id)) OR
    (student_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.students s WHERE s.id = student_id
        AND s.family_id IS NOT NULL AND public.is_family_member(auth.uid(), s.family_id)
    ))
  );

CREATE POLICY "Admins can delete onboarding_status"
  ON public.onboarding_status FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'));

-- Lock down SECURITY DEFINER functions: revoke PUBLIC EXECUTE; grant only where needed.
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_family_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_family_member(uuid, uuid) TO authenticated;
