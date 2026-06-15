-- SudarSim — roleplay scenarios, CRM skins, sessions, coaching results
-- Modality: sudarsim (distinct from sudarplay)

CREATE TABLE IF NOT EXISTS sim_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'fr', 'es', 'pt', 'ta')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  persona jsonb NOT NULL DEFAULT '{}'::jsonb,
  channels jsonb NOT NULL DEFAULT '{"phone": true, "chat": true, "email": true}'::jsonb,
  channel_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  rubric jsonb NOT NULL DEFAULT '{}'::jsonb,
  completion_rule jsonb NOT NULL DEFAULT '{"enabled": false, "min_overall_score": 70, "require_must_pass": true}'::jsonb,
  compliance jsonb NOT NULL DEFAULT '{"record_audio": false, "record_transcript": true, "retention_days": 90}'::jsonb,
  persona_state_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  source jsonb NOT NULL DEFAULT '{"type": "manual"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sim_crm_skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES sim_scenarios(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  width integer NOT NULL DEFAULT 1920,
  height integer NOT NULL DEFAULT 1080,
  overlays jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scenario_id)
);

CREATE TABLE IF NOT EXISTS sim_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES sim_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid REFERENCES modules(id) ON DELETE SET NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  persona_state jsonb NOT NULL DEFAULT '{"mood": 0.5, "difficulty": 0.5, "trust": 0.5}'::jsonb,
  active_channel text NOT NULL DEFAULT 'phone' CHECK (active_channel IN ('phone', 'chat', 'email')),
  livekit_room text,
  crm_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sim_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sim_sessions(id) ON DELETE CASCADE,
  turns jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

CREATE TABLE IF NOT EXISTS sim_rubric_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sim_sessions(id) ON DELETE CASCADE,
  dimension_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score numeric NOT NULL DEFAULT 0,
  coach_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  replay_moments jsonb NOT NULL DEFAULT '[]'::jsonb,
  passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS sim_scenario_id uuid REFERENCES sim_scenarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sim_config jsonb;

CREATE INDEX IF NOT EXISTS sim_scenarios_org_status_idx ON sim_scenarios (org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS sim_sessions_user_idx ON sim_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS sim_sessions_org_idx ON sim_sessions (org_id, status, started_at DESC);

ALTER TABLE sim_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_crm_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_rubric_results ENABLE ROW LEVEL SECURITY;

-- Service role (Learn/Studio backends) uses service key; no permissive anon policies.

COMMENT ON TABLE sim_scenarios IS 'SudarSim reusable roleplay scenarios (org library + module attach)';
COMMENT ON TABLE sim_sessions IS 'Learner SudarSim practice sessions';
