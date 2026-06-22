-- Early-access tester feedback submitted via Sudar chat
CREATE TABLE IF NOT EXISTS early_access_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organisations(id) ON DELETE SET NULL,
  surface text NOT NULL CHECK (surface IN ('learn', 'studio')),
  category text NOT NULL CHECK (category IN ('bug', 'ux', 'feature', 'other')),
  message text NOT NULL,
  page_route text,
  urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachment_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS early_access_feedback_status_idx ON early_access_feedback (status, created_at DESC);
CREATE INDEX IF NOT EXISTS early_access_feedback_user_idx ON early_access_feedback (user_id, created_at DESC);

ALTER TABLE early_access_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY early_access_feedback_insert_own ON early_access_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE early_access_feedback IS 'Structured feedback from early-access testers via Sudar chat';
