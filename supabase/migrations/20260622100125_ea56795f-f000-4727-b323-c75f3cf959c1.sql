
-- families
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  household_size INT,
  household_languages TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO anon, authenticated;
GRANT ALL ON public.families TO service_role;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage families" ON public.families FOR ALL USING (true) WITH CHECK (true);

-- parents
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT,
  email TEXT,
  phone TEXT,
  occupation TEXT,
  education_level TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parents TO anon, authenticated;
GRANT ALL ON public.parents TO service_role;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage parents" ON public.parents FOR ALL USING (true) WITH CHECK (true);

-- students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  grade_level TEXT,
  school_name TEXT,
  preferred_subjects TEXT[],
  learning_style TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon, authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- parent_responses
CREATE TABLE public.parent_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
  step_key TEXT NOT NULL,
  question_key TEXT NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_responses TO anon, authenticated;
GRANT ALL ON public.parent_responses TO service_role;
ALTER TABLE public.parent_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage parent_responses" ON public.parent_responses FOR ALL USING (true) WITH CHECK (true);

-- student_responses
CREATE TABLE public.student_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  question_key TEXT NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_responses TO anon, authenticated;
GRANT ALL ON public.student_responses TO service_role;
ALTER TABLE public.student_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage student_responses" ON public.student_responses FOR ALL USING (true) WITH CHECK (true);

-- ecosystem_profiles
CREATE TABLE public.ecosystem_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL UNIQUE REFERENCES public.families(id) ON DELETE CASCADE,
  values_summary TEXT,
  parenting_style TEXT,
  goals TEXT[],
  challenges TEXT[],
  support_network TEXT,
  daily_routine JSONB,
  tech_usage TEXT,
  cultural_background TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecosystem_profiles TO anon, authenticated;
GRANT ALL ON public.ecosystem_profiles TO service_role;
ALTER TABLE public.ecosystem_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage ecosystem_profiles" ON public.ecosystem_profiles FOR ALL USING (true) WITH CHECK (true);

-- onboarding_status
CREATE TABLE public.onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  journey TEXT NOT NULL CHECK (journey IN ('parent','student')),
  current_step INT NOT NULL DEFAULT 0,
  total_steps INT NOT NULL,
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_status TO anon, authenticated;
GRANT ALL ON public.onboarding_status TO service_role;
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage onboarding_status" ON public.onboarding_status FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_parent_responses_family ON public.parent_responses(family_id);
CREATE INDEX idx_student_responses_student ON public.student_responses(student_id);
CREATE INDEX idx_onboarding_family ON public.onboarding_status(family_id);
CREATE INDEX idx_onboarding_student ON public.onboarding_status(student_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_families_updated BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_parents_updated BEFORE UPDATE ON public.parents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_ecosystem_updated BEFORE UPDATE ON public.ecosystem_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_onboarding_updated BEFORE UPDATE ON public.onboarding_status FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
