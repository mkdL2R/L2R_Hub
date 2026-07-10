CREATE OR REPLACE FUNCTION public.assign_primary_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  existing_count int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF _role NOT IN ('parent'::app_role, 'student'::app_role) THEN
    RAISE EXCEPTION 'role_not_self_assignable';
  END IF;

  SELECT count(*) INTO existing_count
  FROM public.user_roles
  WHERE user_id = uid
    AND role IN ('parent'::app_role, 'student'::app_role, 'instructor'::app_role, 'administrator'::app_role, 'admin'::app_role);

  IF existing_count > 0 THEN
    RAISE EXCEPTION 'primary_role_already_set';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, _role)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (user_id, primary_role)
  VALUES (uid, _role)
  ON CONFLICT (user_id) DO UPDATE SET primary_role = EXCLUDED.primary_role, updated_at = now();
END;
$function$;