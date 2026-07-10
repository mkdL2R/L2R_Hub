
CREATE OR REPLACE FUNCTION public.ensure_user_family()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  fid uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT family_id INTO fid
  FROM public.family_members
  WHERE user_id = uid
  LIMIT 1;

  IF fid IS NOT NULL THEN
    RETURN fid;
  END IF;

  INSERT INTO public.families (created_by)
  VALUES (uid)
  RETURNING id INTO fid;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (fid, uid, 'primary')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN fid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_family() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_family() TO authenticated;
