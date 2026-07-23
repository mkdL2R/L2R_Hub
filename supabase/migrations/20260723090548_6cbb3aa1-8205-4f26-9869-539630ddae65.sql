REVOKE EXECUTE ON FUNCTION public.resolve_identity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_identity() TO authenticated;