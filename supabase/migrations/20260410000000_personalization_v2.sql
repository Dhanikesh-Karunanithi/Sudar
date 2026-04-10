-- Personalization v2: overlays, learner groups, consent
-- Apply via Supabase SQL editor or supabase db push / prisma migrate

ALTER TABLE learner_profiles
  ADD COLUMN IF NOT EXISTS generative_ai_consent_at timestamptz;

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS personalization_overlays jsonb;

CREATE TABLE IF NOT EXISTS learner_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learner_group_members (
  group_id uuid NOT NULL REFERENCES learner_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_groups_org ON learner_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_learner_group_members_user ON learner_group_members(user_id);
