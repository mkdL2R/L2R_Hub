
-- Idempotent backfill
INSERT INTO public.instructor_profiles (user_id)
SELECT DISTINCT ur.user_id
FROM public.user_roles ur
WHERE ur.role IN ('instructor'::app_role, 'administrator'::app_role, 'admin'::app_role)
ON CONFLICT (user_id) DO NOTHING;

-- Trigger: whenever an instructor-family role is granted, ensure a profile exists.
CREATE OR REPLACE FUNCTION public.ensure_instructor_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('instructor'::app_role, 'administrator'::app_role, 'admin'::app_role) THEN
    INSERT INTO public.instructor_profiles (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_instructor_profile ON public.user_roles;
CREATE TRIGGER trg_ensure_instructor_profile
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.ensure_instructor_profile();
