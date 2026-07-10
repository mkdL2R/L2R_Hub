
-- 1. Add unique constraint on family_members.user_id to prevent race-condition abuse
--    (users can only belong to one family; bootstrap policy relies on this)
DELETE FROM public.family_members a USING public.family_members b
  WHERE a.ctid < b.ctid AND a.user_id = b.user_id;
ALTER TABLE public.family_members
  ADD CONSTRAINT family_members_user_id_unique UNIQUE (user_id);

-- 2. Restrict SECURITY DEFINER RPC EXECUTE to the minimum required role
REVOKE EXECUTE ON FUNCTION public.assign_primary_role(app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_primary_role(app_role) TO authenticated;

-- increment_article_view / increment_download are intentionally callable by
-- anon (public view/download tracking) and only mutate a single counter column
-- for published rows. Keep anon EXECUTE but explicitly deny PUBLIC to make the
-- allow-list intentional.
REVOKE EXECUTE ON FUNCTION public.increment_article_view(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_download(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.subscribe_to_newsletter(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_download(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_to_newsletter(text, text) TO anon, authenticated;
