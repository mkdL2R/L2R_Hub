
-- Backfill: promote any existing user whose email matches a pending invitation
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT u.id AS user_id, i.id AS invite_id
    FROM auth.users u
    JOIN public.instructor_invitations i
      ON lower(i.email) = lower(u.email) AND i.status = 'pending'
  LOOP
    UPDATE public.instructor_invitations
      SET status = 'accepted', accepted_by = r.user_id, accepted_at = now()
      WHERE id = r.invite_id;

    INSERT INTO public.user_roles (user_id, role)
      VALUES (r.user_id, 'instructor')
      ON CONFLICT DO NOTHING;

    -- Remove non-instructor primary roles that were self-assigned before promotion
    DELETE FROM public.user_roles
      WHERE user_id = r.user_id AND role IN ('parent','student','member');

    INSERT INTO public.profiles (user_id, primary_role)
      VALUES (r.user_id, 'instructor')
      ON CONFLICT (user_id) DO UPDATE SET primary_role = 'instructor', updated_at = now();
  END LOOP;
END$$;
