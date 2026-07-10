
-- Fix 1: Tighten family_members bootstrap. Only allow bootstrapping into a family the user created AND that has no existing members yet.
DROP POLICY IF EXISTS "Users bootstrap own family membership" ON public.family_members;
CREATE POLICY "Users bootstrap own family membership"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_members.family_id AND f.created_by = auth.uid())
  AND NOT EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = family_members.family_id)
  AND NOT EXISTS (SELECT 1 FROM public.family_members fm2 WHERE fm2.user_id = auth.uid())
);

-- Fix 2: Prevent users from inserting more than one role row for themselves.
DROP POLICY IF EXISTS "Users self-assign primary role" ON public.user_roles;
CREATE POLICY "Users self-assign primary role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = ANY (ARRAY['parent'::app_role, 'student'::app_role, 'member'::app_role])
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['parent'::app_role, 'student'::app_role, 'member'::app_role])
  )
);

-- Fix 3: Remove blanket public read on the private hub-media bucket. Content is served via long-lived signed URLs, which do not require a SELECT policy.
DROP POLICY IF EXISTS "Anyone can read hub-media" ON storage.objects;
CREATE POLICY "Staff can read hub-media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'hub-media'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'administrator'::app_role)
    OR public.has_role(auth.uid(), 'instructor'::app_role)
  )
);
