-- Allow staff to upload/manage hub-media, and any signed-URL reader to read.
CREATE POLICY "Staff can upload hub-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'hub-media'
  AND (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'administrator'::app_role)
       OR public.has_role(auth.uid(), 'instructor'::app_role))
);

CREATE POLICY "Staff can update hub-media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'hub-media'
  AND (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'administrator'::app_role)
       OR public.has_role(auth.uid(), 'instructor'::app_role))
);

CREATE POLICY "Staff can delete hub-media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'hub-media'
  AND (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'administrator'::app_role)
       OR public.has_role(auth.uid(), 'instructor'::app_role))
);

-- Authenticated + anonymous readers can fetch objects (needed so signed URLs
-- resolve for public viewers of the Hub).
CREATE POLICY "Anyone can read hub-media"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'hub-media');
