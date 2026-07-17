
-- Instructor availability (recurring weekly windows)
CREATE TABLE public.instructor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructor_profiles(user_id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  slot_minutes int NOT NULL DEFAULT 30 CHECK (slot_minutes IN (15,30,45,60)),
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instructor_availability TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instructor_availability TO authenticated;
GRANT ALL ON public.instructor_availability TO service_role;
ALTER TABLE public.instructor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view availability"
  ON public.instructor_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors manage own availability"
  ON public.instructor_availability FOR ALL TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());
CREATE POLICY "Admins manage all availability"
  ON public.instructor_availability FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrator'::app_role) OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'administrator'::app_role) OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_instructor_availability_updated
  BEFORE UPDATE ON public.instructor_availability
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Alignment meetings
CREATE TABLE public.alignment_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructor_profiles(user_id) ON DELETE RESTRICT,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  meeting_notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent double-booking of the same instructor at the same start time (for active meetings)
CREATE UNIQUE INDEX alignment_meetings_no_double_booking
  ON public.alignment_meetings (instructor_id, scheduled_at)
  WHERE status IN ('pending','confirmed');

CREATE INDEX alignment_meetings_family_idx ON public.alignment_meetings (family_id);
CREATE INDEX alignment_meetings_instructor_idx ON public.alignment_meetings (instructor_id, scheduled_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alignment_meetings TO authenticated;
GRANT ALL ON public.alignment_meetings TO service_role;
ALTER TABLE public.alignment_meetings ENABLE ROW LEVEL SECURITY;

-- Parents (family members) can view/manage meetings for their family
CREATE POLICY "Family members view own meetings"
  ON public.alignment_meetings FOR SELECT TO authenticated
  USING (public.is_family_member(auth.uid(), family_id));
CREATE POLICY "Family members book meetings"
  ON public.alignment_meetings FOR INSERT TO authenticated
  WITH CHECK (public.is_family_member(auth.uid(), family_id));
CREATE POLICY "Family members update own meetings"
  ON public.alignment_meetings FOR UPDATE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id))
  WITH CHECK (public.is_family_member(auth.uid(), family_id));
CREATE POLICY "Family members cancel own meetings"
  ON public.alignment_meetings FOR DELETE TO authenticated
  USING (public.is_family_member(auth.uid(), family_id));

-- Instructors can view and manage meetings assigned to them
CREATE POLICY "Instructors view assigned meetings"
  ON public.alignment_meetings FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());
CREATE POLICY "Instructors update assigned meetings"
  ON public.alignment_meetings FOR UPDATE TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins view all meetings"
  ON public.alignment_meetings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'administrator'::app_role) OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage all meetings"
  ON public.alignment_meetings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrator'::app_role) OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'administrator'::app_role) OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_alignment_meetings_updated
  BEFORE UPDATE ON public.alignment_meetings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Onboarding progression: mark alignment_meeting step completed when a meeting is booked
CREATE OR REPLACE FUNCTION public.book_alignment_meeting(
  _instructor_id uuid,
  _scheduled_at timestamptz,
  _duration_minutes int DEFAULT 30,
  _notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  fid uuid;
  mid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _scheduled_at <= now() THEN RAISE EXCEPTION 'scheduled_in_past'; END IF;

  SELECT family_id INTO fid FROM public.family_members WHERE user_id = uid LIMIT 1;
  IF fid IS NULL THEN RAISE EXCEPTION 'no_family'; END IF;

  -- Verify instructor exists
  IF NOT EXISTS (SELECT 1 FROM public.instructor_profiles WHERE user_id = _instructor_id) THEN
    RAISE EXCEPTION 'invalid_instructor';
  END IF;

  -- Guard against double-booking (unique index also enforces this)
  IF EXISTS (
    SELECT 1 FROM public.alignment_meetings
    WHERE instructor_id = _instructor_id
      AND scheduled_at = _scheduled_at
      AND status IN ('pending','confirmed')
  ) THEN
    RAISE EXCEPTION 'slot_taken';
  END IF;

  INSERT INTO public.alignment_meetings
    (family_id, instructor_id, scheduled_at, duration_minutes, meeting_notes, status, created_by)
  VALUES (fid, _instructor_id, _scheduled_at, COALESCE(_duration_minutes,30), _notes, 'pending', uid)
  RETURNING id INTO mid;

  -- Record onboarding step completion
  INSERT INTO public.onboarding_status
    (family_id, journey, current_step, total_steps, completed_steps, status, completed_at)
  VALUES (fid, 'alignment_meeting', 1, 1, ARRAY['alignment_meeting'], 'completed', now());

  RETURN mid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_alignment_meeting(uuid, timestamptz, int, text) TO authenticated;
