
-- 1) Remove anon UPDATE policies; harden RPCs
DROP POLICY IF EXISTS "hub_articles anon increment view" ON public.hub_articles;
DROP POLICY IF EXISTS "hub_resources anon increment download" ON public.hub_resources;

CREATE OR REPLACE FUNCTION public.increment_article_view(_article_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.hub_articles
     SET view_count = view_count + 1
   WHERE id = _article_id AND status = 'published';
$$;

CREATE OR REPLACE FUNCTION public.increment_download(_resource_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.hub_resources
     SET download_count = download_count + 1
   WHERE id = _resource_id AND status = 'published';
$$;

REVOKE ALL ON FUNCTION public.increment_article_view(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_download(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_download(uuid) TO anon, authenticated;

-- 2) Newsletter: replace open INSERT policy with a definer function that swallows duplicates
DROP POLICY IF EXISTS "newsletter anyone subscribes" ON public.hub_newsletter_subscribers;

CREATE OR REPLACE FUNCTION public.subscribe_to_newsletter(_email text, _source text DEFAULT 'hub')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email text := lower(trim(_email));
BEGIN
  IF clean_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  INSERT INTO public.hub_newsletter_subscribers (email, source)
  VALUES (clean_email, _source)
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.subscribe_to_newsletter(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_to_newsletter(text, text) TO anon, authenticated;

-- 3) user_roles self-assign: replace INSERT policy with a definer function that validates eligibility
DROP POLICY IF EXISTS "Users self-assign primary role" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.assign_primary_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  UPDATE public.profiles
     SET primary_role = _role::text
   WHERE user_id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_primary_role(app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_primary_role(app_role) TO authenticated;
