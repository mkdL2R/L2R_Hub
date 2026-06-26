
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'member');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'))
$$;

-- Auto-assign 'member' on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Articles
CREATE TABLE public.hub_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',
  hero_image_url text,
  author text,
  category text NOT NULL,
  reading_minutes integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'draft',
  publish_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hub_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_articles TO authenticated;
GRANT ALL ON public.hub_articles TO service_role;
ALTER TABLE public.hub_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are public" ON public.hub_articles FOR SELECT
  USING (status = 'published' AND publish_at <= now());
CREATE POLICY "Staff can read all articles" ON public.hub_articles FOR SELECT
  TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert articles" ON public.hub_articles FOR INSERT
  TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update articles" ON public.hub_articles FOR UPDATE
  TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete articles" ON public.hub_articles FOR DELETE
  TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER hub_articles_touch BEFORE UPDATE ON public.hub_articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Podcast episodes
CREATE TABLE public.hub_podcast_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  cover_url text,
  audio_url text,
  duration_seconds integer,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  publish_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hub_podcast_episodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_podcast_episodes TO authenticated;
GRANT ALL ON public.hub_podcast_episodes TO service_role;
ALTER TABLE public.hub_podcast_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published episodes are public" ON public.hub_podcast_episodes FOR SELECT
  USING (status = 'published' AND publish_at <= now());
CREATE POLICY "Staff can read all episodes" ON public.hub_podcast_episodes FOR SELECT
  TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert episodes" ON public.hub_podcast_episodes FOR INSERT
  TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update episodes" ON public.hub_podcast_episodes FOR UPDATE
  TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete episodes" ON public.hub_podcast_episodes FOR DELETE
  TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER hub_episodes_touch BEFORE UPDATE ON public.hub_podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Resources
CREATE TABLE public.hub_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  file_type text,
  category text NOT NULL,
  age_group text,
  status text NOT NULL DEFAULT 'draft',
  publish_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hub_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_resources TO authenticated;
GRANT ALL ON public.hub_resources TO service_role;
ALTER TABLE public.hub_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published resources are public" ON public.hub_resources FOR SELECT
  USING (status = 'published' AND publish_at <= now());
CREATE POLICY "Staff can read all resources" ON public.hub_resources FOR SELECT
  TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert resources" ON public.hub_resources FOR INSERT
  TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update resources" ON public.hub_resources FOR UPDATE
  TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete resources" ON public.hub_resources FOR DELETE
  TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER hub_resources_touch BEFORE UPDATE ON public.hub_resources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Saved items
CREATE TABLE public.hub_saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
GRANT SELECT, INSERT, DELETE ON public.hub_saved_items TO authenticated;
GRANT ALL ON public.hub_saved_items TO service_role;
ALTER TABLE public.hub_saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their saves" ON public.hub_saved_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
