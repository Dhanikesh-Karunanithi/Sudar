-- Historical: clean-slate data wipe applied 2026-09-15 on project qnsrrboprydmjyormlky.
-- Data deletes (orgs, courses, telemetry, sim rows, invites, sudar_notes_sessions) were
-- executed via Supabase SQL (see docs/CLEAN_SLATE_WIPE_PLAN.md). Local JSON backup:
--   .local-backups/clean-slate-2026-09-15T12-54-49/
--
-- This migration records the orphan Jobsy schema drop for fresh environments that still
-- have those tables (created outside Sudar app code; zero rows / zero app references).

DROP TABLE IF EXISTS public.jobsy_applications CASCADE;
DROP TABLE IF EXISTS public.jobsy_contacts CASCADE;
DROP TABLE IF EXISTS public.jobsy_companies CASCADE;
DROP TABLE IF EXISTS public.jobsy_user_settings CASCADE;
DROP TABLE IF EXISTS public.jobsy_profiles CASCADE;
