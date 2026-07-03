
-- Auto-populate families.created_by from auth.uid() so existing app code
-- that doesn't set the column still satisfies the tightened RLS policy.
CREATE OR REPLACE FUNCTION public.set_family_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_family_created_by ON public.families;
CREATE TRIGGER set_family_created_by
BEFORE INSERT ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.set_family_created_by();

-- Revoke direct EXECUTE on the trigger guard function; it should only run
-- via the trigger, not be callable through the Data API.
REVOKE ALL ON FUNCTION public.prevent_privileged_self_role_assignment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_family_created_by() FROM PUBLIC, anon, authenticated;
