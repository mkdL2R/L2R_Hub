
-- Tighten newsletter insert
DROP POLICY IF EXISTS "newsletter anyone subscribes" ON public.hub_newsletter_subscribers;
CREATE POLICY "newsletter anyone subscribes" ON public.hub_newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' AND length(email) <= 320);

-- Convert counter RPCs to SECURITY INVOKER with column-level UPDATE grants
CREATE OR REPLACE FUNCTION public.increment_article_view(_article_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  UPDATE public.hub_articles SET view_count = view_count + 1 WHERE id = _article_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_download(_resource_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  UPDATE public.hub_resources SET download_count = download_count + 1 WHERE id = _resource_id;
$$;

-- Allow public UPDATE on just the counter columns (RLS still applies)
GRANT UPDATE (view_count) ON public.hub_articles TO anon, authenticated;
GRANT UPDATE (download_count) ON public.hub_resources TO anon, authenticated;

-- Permit counter-only UPDATE via RLS (staff policies already allow full updates)
DROP POLICY IF EXISTS "hub_articles anon increment view" ON public.hub_articles;
CREATE POLICY "hub_articles anon increment view" ON public.hub_articles
  FOR UPDATE TO anon, authenticated
  USING (status = 'published')
  WITH CHECK (status = 'published');

DROP POLICY IF EXISTS "hub_resources anon increment download" ON public.hub_resources;
CREATE POLICY "hub_resources anon increment download" ON public.hub_resources
  FOR UPDATE TO anon, authenticated
  USING (status = 'published')
  WITH CHECK (status = 'published');
