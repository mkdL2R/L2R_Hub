CREATE POLICY "Users self-assign primary role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND role IN ('parent'::app_role, 'student'::app_role, 'member'::app_role));