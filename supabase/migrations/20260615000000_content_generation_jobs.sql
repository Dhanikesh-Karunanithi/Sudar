-- Sudar Create — async content generation jobs for LMS integrations
CREATE TABLE IF NOT EXISTS content_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('from_document', 'media')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  progress numeric NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_payload jsonb,
  error_message text,
  webhook_url text,
  webhook_delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_generation_jobs_org_status_idx
  ON content_generation_jobs (org_id, status, created_at DESC);

ALTER TABLE content_generation_jobs ENABLE ROW LEVEL SECURITY;

-- No permissive policies: only service-role backend (Learn ALP routes) accesses this table.

COMMENT ON TABLE content_generation_jobs IS 'Async Sudar Create jobs (document-to-course, media) for ALP LMS integrations';
