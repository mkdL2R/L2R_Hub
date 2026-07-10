
-- ============ Extend existing tables ============
ALTER TABLE public.hub_articles
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS content_json jsonb,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.hub_podcast_episodes
  ADD COLUMN IF NOT EXISTS episode_number integer,
  ADD COLUMN IF NOT EXISTS spotify_url text,
  ADD COLUMN IF NOT EXISTS apple_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS transcript text;

ALTER TABLE public.hub_resources
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resource_type text;

-- ============ Categories ============
CREATE TABLE IF NOT EXISTS public.hub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text,
  kind text NOT NULL DEFAULT 'article' CHECK (kind IN ('article','podcast','download')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hub_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hub_categories TO authenticated;
GRANT ALL ON public.hub_categories TO service_role;
ALTER TABLE public.hub_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hub_categories read all" ON public.hub_categories FOR SELECT USING (true);
CREATE POLICY "hub_categories staff write" ON public.hub_categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER hub_categories_touch BEFORE UPDATE ON public.hub_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Tags ============
CREATE TABLE IF NOT EXISTS public.hub_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hub_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hub_tags TO authenticated;
GRANT ALL ON public.hub_tags TO service_role;
ALTER TABLE public.hub_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hub_tags read all" ON public.hub_tags FOR SELECT USING (true);
CREATE POLICY "hub_tags staff write" ON public.hub_tags FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ Article tags ============
CREATE TABLE IF NOT EXISTS public.hub_article_tags (
  article_id uuid NOT NULL REFERENCES public.hub_articles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.hub_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
GRANT SELECT ON public.hub_article_tags TO anon, authenticated;
GRANT INSERT, DELETE ON public.hub_article_tags TO authenticated;
GRANT ALL ON public.hub_article_tags TO service_role;
ALTER TABLE public.hub_article_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hub_article_tags read all" ON public.hub_article_tags FOR SELECT USING (true);
CREATE POLICY "hub_article_tags staff write" ON public.hub_article_tags FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ Reading history ============
CREATE TABLE IF NOT EXISTS public.hub_reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('article','podcast')),
  item_id uuid NOT NULL,
  progress numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_reading_history TO authenticated;
GRANT ALL ON public.hub_reading_history TO service_role;
ALTER TABLE public.hub_reading_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hub_reading_history owner" ON public.hub_reading_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ Newsletter ============
CREATE TABLE IF NOT EXISTS public.hub_newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text,
  confirmed boolean NOT NULL DEFAULT false,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.hub_newsletter_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.hub_newsletter_subscribers TO authenticated;
GRANT ALL ON public.hub_newsletter_subscribers TO service_role;
ALTER TABLE public.hub_newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "newsletter anyone subscribes" ON public.hub_newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "newsletter staff read" ON public.hub_newsletter_subscribers
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "newsletter staff manage" ON public.hub_newsletter_subscribers
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ Counter RPCs ============
CREATE OR REPLACE FUNCTION public.increment_article_view(_article_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.hub_articles SET view_count = view_count + 1 WHERE id = _article_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_article_view(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_download(_resource_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.hub_resources SET download_count = download_count + 1 WHERE id = _resource_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_download(uuid) TO anon, authenticated;
