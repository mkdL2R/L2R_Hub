
-- 1) Add created_by to families to tie ownership to a specific user
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS families_created_by_idx ON public.families(created_by);

-- Backfill from existing family_members (earliest member is treated as creator)
UPDATE public.families f
SET created_by = fm.user_id
FROM (
  SELECT DISTINCT ON (family_id) family_id, user_id
  FROM public.family_members
  ORDER BY family_id, created_at ASC NULLS LAST
) fm
WHERE fm.family_id = f.id AND f.created_by IS NULL;

-- 2) Replace families INSERT policy to require created_by = auth.uid()
DROP POLICY IF EXISTS "Users can create their first family" ON public.families;
CREATE POLICY "Users can create their first family"
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND (
    has_role(auth.uid(), 'administrator'::app_role)
    OR NOT EXISTS (
      SELECT 1 FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  )
);

-- 3) Replace family_members bootstrap policy to require the target family
--    was created by the current user (prevents joining arbitrary families)
DROP POLICY IF EXISTS "Users bootstrap own family membership" ON public.family_members;
CREATE POLICY "Users bootstrap own family membership"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.family_members fm WHERE fm.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.id = family_id AND f.created_by = auth.uid()
  )
);

-- 4) Harden user_roles self-assignment: tighten policy AND add a trigger
--    guard so privileged roles can never be self-inserted, even if the
--    policy is later relaxed.
DROP POLICY IF EXISTS "Users self-assign primary role" ON public.user_roles;
CREATE POLICY "Users self-assign primary role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role IN ('parent'::app_role, 'student'::app_role, 'member'::app_role)
);

CREATE OR REPLACE FUNCTION public.prevent_privileged_self_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  -- Only guard user-initiated inserts. Service role / SECURITY DEFINER
  -- functions (e.g. claim_instructor_invitation) run without auth.uid()
  -- and are trusted.
  IF caller IS NULL THEN
    RETURN NEW;
  END IF;

  -- Never allow a user to insert a role row for someone else.
  IF NEW.user_id <> caller THEN
    RAISE EXCEPTION 'Cannot assign roles to other users';
  END IF;

  -- Restrict self-assignable roles to the non-privileged allow-list.
  IF NEW.role NOT IN ('parent'::app_role, 'student'::app_role, 'member'::app_role) THEN
    RAISE EXCEPTION 'Privileged roles cannot be self-assigned';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_privileged_self_role_assignment ON public.user_roles;
CREATE TRIGGER prevent_privileged_self_role_assignment
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_privileged_self_role_assignment();
