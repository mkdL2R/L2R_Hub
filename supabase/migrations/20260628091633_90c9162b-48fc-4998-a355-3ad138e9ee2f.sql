
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS family_motto text,
  ADD COLUMN IF NOT EXISTS family_photo_url text;

-- LIVING TREE ENTRIES
CREATE TABLE IF NOT EXISTS public.living_tree_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  entry_type text NOT NULL,
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.living_tree_entries TO authenticated;
GRANT ALL ON public.living_tree_entries TO service_role;
ALTER TABLE public.living_tree_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family or staff can view entries" ON public.living_tree_entries
  FOR SELECT TO authenticated
  USING (
    public.is_family_member(auth.uid(), family_id)
    OR public.has_role(auth.uid(), 'instructor'::app_role)
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  );

CREATE POLICY "Family or staff can insert entries" ON public.living_tree_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_user_id
    AND (
      public.is_family_member(auth.uid(), family_id)
      OR public.has_role(auth.uid(), 'instructor'::app_role)
      OR public.has_role(auth.uid(), 'administrator'::app_role)
    )
  );

CREATE POLICY "Author or admin can update entries" ON public.living_tree_entries
  FOR UPDATE TO authenticated
  USING (
    author_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  )
  WITH CHECK (
    author_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  );

CREATE POLICY "Author or admin can delete entries" ON public.living_tree_entries
  FOR DELETE TO authenticated
  USING (
    author_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  );

CREATE INDEX IF NOT EXISTS living_tree_entries_family_idx
  ON public.living_tree_entries (family_id, occurred_on DESC);

CREATE TRIGGER trg_living_tree_entries_updated
  BEFORE UPDATE ON public.living_tree_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- FAMILY GOALS
CREATE TABLE IF NOT EXISTS public.family_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  year integer NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'in_progress',
  progress_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_goals TO authenticated;
GRANT ALL ON public.family_goals TO service_role;
ALTER TABLE public.family_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family or staff can view goals" ON public.family_goals
  FOR SELECT TO authenticated
  USING (
    public.is_family_member(auth.uid(), family_id)
    OR public.has_role(auth.uid(), 'instructor'::app_role)
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  );

CREATE POLICY "Family can insert goals" ON public.family_goals
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_family_member(auth.uid(), family_id)
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  );

CREATE POLICY "Family can update goals" ON public.family_goals
  FOR UPDATE TO authenticated
  USING (
    public.is_family_member(auth.uid(), family_id)
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  )
  WITH CHECK (
    public.is_family_member(auth.uid(), family_id)
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  );

CREATE POLICY "Family can delete goals" ON public.family_goals
  FOR DELETE TO authenticated
  USING (
    public.is_family_member(auth.uid(), family_id)
    OR public.has_role(auth.uid(), 'administrator'::app_role)
  );

CREATE TRIGGER trg_family_goals_updated
  BEFORE UPDATE ON public.family_goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
