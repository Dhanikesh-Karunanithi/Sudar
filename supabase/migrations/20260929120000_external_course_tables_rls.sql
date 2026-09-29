-- 20260602120000_external_courses_extended created three tables without RLS.
-- external_course_providers stores provider api_key/api_secret, so these must never be
-- readable through PostgREST. Access is server-side (service role) only; no JWT policies.

ALTER TABLE IF EXISTS public.external_course_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.external_course_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.external_course_sync_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.external_course_providers FROM anon, authenticated;
