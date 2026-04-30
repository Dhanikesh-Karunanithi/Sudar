-- LMS / LTI identity bridge: map external LMS user ids to Sudar profiles.id (UUID).
-- Server-side (Studio/Learn service role) only; RLS enabled with no anon/authenticated policies.

CREATE TABLE IF NOT EXISTS public.lms_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'moodle',
  external_user_id text NOT NULL,
  external_email text,
  sudar_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lms_identity_links_org_provider_external
  ON public.lms_identity_links (org_id, provider, external_user_id);

CREATE INDEX IF NOT EXISTS idx_lms_identity_links_sudar_user
  ON public.lms_identity_links (sudar_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS lms_identity_links_active_unique
  ON public.lms_identity_links (org_id, provider, external_user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.lms_identity_links ENABLE ROW LEVEL SECURITY;

-- LTI 1.3 platform deployment registry (issuer + client + deployment -> org).
CREATE TABLE IF NOT EXISTS public.lti_platform_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  issuer text NOT NULL,
  client_id text NOT NULL,
  deployment_id text NOT NULL,
  platform_jwks_uri text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, client_id, deployment_id)
);

CREATE INDEX IF NOT EXISTS idx_lti_deployments_org ON public.lti_platform_deployments (org_id);

ALTER TABLE public.lti_platform_deployments ENABLE ROW LEVEL SECURITY;
