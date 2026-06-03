-- External courses extended: metadata, tutor access, provider config, engagement tracking

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS external_metadata jsonb,
  ADD COLUMN IF NOT EXISTS provider_course_id text,
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS allow_tutor_discussion boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS content_access_mode text NOT NULL DEFAULT 'both';

COMMENT ON COLUMN public.courses.external_metadata IS 'Normalized provider metadata (rating, instructor, sections, cert, etc.)';
COMMENT ON COLUMN public.courses.provider_course_id IS 'External platform course ID for sync/re-import';
COMMENT ON COLUMN public.courses.sync_status IS 'pending | synced | error | outdated';
COMMENT ON COLUMN public.courses.content_access_mode IS 'iframe_only | tutor_access | both';

CREATE INDEX IF NOT EXISTS courses_provider_course_id_idx
  ON public.courses (provider_course_id)
  WHERE provider_course_id IS NOT NULL;

ALTER TABLE public.learner_profiles
  ADD COLUMN IF NOT EXISTS external_course_engagement jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.learner_profiles.external_course_engagement IS
  'Per-course external engagement: { course_id: { views, clicks, duration_secs, completed, last_visited } }';

CREATE TABLE IF NOT EXISTS public.external_course_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
  course_description text,
  instructor_bio text,
  section_titles text[] NOT NULL DEFAULT '{}',
  key_topics text[] NOT NULL DEFAULT '{}',
  requires_sign_in boolean NOT NULL DEFAULT false,
  sign_in_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_course_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  provider_slug text NOT NULL,
  api_key text,
  api_secret text,
  sync_enabled boolean NOT NULL DEFAULT false,
  auto_tag_enabled boolean NOT NULL DEFAULT true,
  tag_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, provider_slug)
);

CREATE TABLE IF NOT EXISTS public.external_course_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_msg text,
  courses_imported int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS external_course_sync_log_org_idx
  ON public.external_course_sync_log (org_id, created_at DESC);
