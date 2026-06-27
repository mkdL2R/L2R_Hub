
-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  preferred_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  primary_role public.app_role,
  notification_prefs JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "product_updates": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, preferred_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'preferred_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Family members link
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relation TEXT NOT NULL CHECK (relation IN ('parent','student','guardian')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Security-definer to avoid recursive RLS when checking family membership
CREATE OR REPLACE FUNCTION public.is_family_member(_user_id uuid, _family_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.family_members WHERE user_id = _user_id AND family_id = _family_id)
$$;

CREATE POLICY "Members view their family links" ON public.family_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_family_member(auth.uid(), family_id)
    OR public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Users add themselves to a family" ON public.family_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Family members can add others" ON public.family_members
  FOR INSERT TO authenticated WITH CHECK (public.is_family_member(auth.uid(), family_id));
CREATE POLICY "Admins manage family members" ON public.family_members
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users remove themselves from family" ON public.family_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Instructor profiles
CREATE TABLE IF NOT EXISTS public.instructor_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructor_profiles TO authenticated;
GRANT ALL ON public.instructor_profiles TO service_role;
ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view all instructor profiles" ON public.instructor_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors manage own profile" ON public.instructor_profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage instructor profiles" ON public.instructor_profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER instructor_profiles_touch_updated_at BEFORE UPDATE ON public.instructor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Update is_staff to include administrator
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor','administrator'))
$$;
