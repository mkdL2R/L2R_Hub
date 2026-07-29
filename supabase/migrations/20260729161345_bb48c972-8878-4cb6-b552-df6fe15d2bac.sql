GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructor_availability TO authenticated;
GRANT ALL ON public.instructor_availability TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alignment_meetings TO authenticated;
GRANT ALL ON public.alignment_meetings TO service_role;