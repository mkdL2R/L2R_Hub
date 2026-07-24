
-- 1) Extend staff to include instructors; add admin-only helper
CREATE OR REPLACE FUNCTION app_security.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','editor','administrator','instructor')
  )
$$;

CREATE OR REPLACE FUNCTION app_security.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','administrator')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path='public' AS $$
  SELECT app_security.is_admin(_user_id)
$$;

-- 2) Ownership + audit columns on the three CMS tables
ALTER TABLE public.hub_articles
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_role app_role,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.hub_podcast_episodes
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_role app_role,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.hub_resources
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_role app_role,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- updated_at triggers (touch_updated_at exists already)
DROP TRIGGER IF EXISTS trg_hub_articles_touch ON public.hub_articles;
CREATE TRIGGER trg_hub_articles_touch BEFORE UPDATE ON public.hub_articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_hub_podcast_episodes_touch ON public.hub_podcast_episodes;
CREATE TRIGGER trg_hub_podcast_episodes_touch BEFORE UPDATE ON public.hub_podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_hub_resources_touch ON public.hub_resources;
CREATE TRIGGER trg_hub_resources_touch BEFORE UPDATE ON public.hub_resources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Default author_id / author_role on insert
CREATE OR REPLACE FUNCTION public.set_hub_author()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  IF NEW.author_id IS NULL THEN NEW.author_id := auth.uid(); END IF;
  IF NEW.author_role IS NULL AND NEW.author_id IS NOT NULL THEN
    SELECT role INTO NEW.author_role FROM public.user_roles
     WHERE user_id = NEW.author_id
     ORDER BY CASE role
       WHEN 'administrator' THEN 1 WHEN 'admin' THEN 2
       WHEN 'editor' THEN 3 WHEN 'instructor' THEN 4 ELSE 9 END
     LIMIT 1;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_hub_articles_author ON public.hub_articles;
CREATE TRIGGER trg_hub_articles_author BEFORE INSERT ON public.hub_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_hub_author();
DROP TRIGGER IF EXISTS trg_hub_podcast_episodes_author ON public.hub_podcast_episodes;
CREATE TRIGGER trg_hub_podcast_episodes_author BEFORE INSERT ON public.hub_podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION public.set_hub_author();
DROP TRIGGER IF EXISTS trg_hub_resources_author ON public.hub_resources;
CREATE TRIGGER trg_hub_resources_author BEFORE INSERT ON public.hub_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_hub_author();

-- 3) Replace UPDATE/DELETE policies with ownership rules; keep INSERT + SELECT
-- Articles
DROP POLICY IF EXISTS "Staff can update articles" ON public.hub_articles;
DROP POLICY IF EXISTS "Staff can delete articles" ON public.hub_articles;
CREATE POLICY "Admins or authors can update articles" ON public.hub_articles
  FOR UPDATE USING (app_security.is_admin(auth.uid()) OR author_id = auth.uid())
  WITH CHECK  (app_security.is_admin(auth.uid()) OR author_id = auth.uid());
CREATE POLICY "Admins or authors can delete articles" ON public.hub_articles
  FOR DELETE USING (app_security.is_admin(auth.uid()) OR author_id = auth.uid());

-- Podcasts
DROP POLICY IF EXISTS "Staff can update episodes" ON public.hub_podcast_episodes;
DROP POLICY IF EXISTS "Staff can delete episodes" ON public.hub_podcast_episodes;
CREATE POLICY "Admins or authors can update episodes" ON public.hub_podcast_episodes
  FOR UPDATE USING (app_security.is_admin(auth.uid()) OR author_id = auth.uid())
  WITH CHECK  (app_security.is_admin(auth.uid()) OR author_id = auth.uid());
CREATE POLICY "Admins or authors can delete episodes" ON public.hub_podcast_episodes
  FOR DELETE USING (app_security.is_admin(auth.uid()) OR author_id = auth.uid());

-- Resources
DROP POLICY IF EXISTS "Staff can update resources" ON public.hub_resources;
DROP POLICY IF EXISTS "Staff can delete resources" ON public.hub_resources;
CREATE POLICY "Admins or authors can update resources" ON public.hub_resources
  FOR UPDATE USING (app_security.is_admin(auth.uid()) OR author_id = auth.uid())
  WITH CHECK  (app_security.is_admin(auth.uid()) OR author_id = auth.uid());
CREATE POLICY "Admins or authors can delete resources" ON public.hub_resources
  FOR DELETE USING (app_security.is_admin(auth.uid()) OR author_id = auth.uid());
