-- ============================================================
-- SudarPlay schema additions
-- NOTE: Spec uses "course_modules"; this codebase uses table "modules".
-- All references use "modules" to match byteos-studio Prisma schema.
-- Run: supabase db push (or apply via Supabase dashboard SQL)
-- ============================================================

-- 1. Create sudarplay_maps first (so we can reference it from modules)
CREATE TABLE IF NOT EXISTS sudarplay_maps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id         UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  status            TEXT NOT NULL DEFAULT 'generating'
                    CHECK (status IN ('generating', 'ready', 'error', 'archived')),
  map_file_url      TEXT,
  tileset_urls       JSONB DEFAULT '[]'::jsonb,
  npc_scripts_url   TEXT,
  quiz_gates_url    TEXT,
  generation_prompt  TEXT,
  generator_model   TEXT,
  version           INTEGER NOT NULL DEFAULT 1,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sudarplay_maps_module ON sudarplay_maps(module_id);
CREATE INDEX IF NOT EXISTS idx_sudarplay_maps_status ON sudarplay_maps(status);


-- 2. Add SudarPlay columns to modules (existing table; map to Prisma Module)
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS sudarplay_map_url       TEXT,
  ADD COLUMN IF NOT EXISTS sudarplay_map_id       UUID REFERENCES sudarplay_maps(id),
  ADD COLUMN IF NOT EXISTS sudarplay_config       JSONB DEFAULT '{}'::jsonb;

-- sudarplay_config shape (documentation):
-- {
--   "room_count": 4,
--   "quiz_pass_threshold": 0.70,
--   "has_code_lab": true,
--   "npc_personas": {
--     "room_1": { "name": "Py", "concept": "Python variables" },
--     "room_2": { "name": "Func", "concept": "Python functions" }
--   },
--   "generated_at": "2026-03-13T00:00:00Z",
--   "generator_model": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
-- }


-- 3. learner_profiles: modality_affinity — no column change.
-- Document: modality_scores (or modality_affinity) can include key "sudarplay" (float 0.0–1.0).
-- Default seed in profile creation can add "sudarplay": 0.5.


-- 4. sudarplay_sessions — one row per learner game session
CREATE TABLE IF NOT EXISTS sudarplay_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id        UUID NOT NULL REFERENCES auth.users(id),
  map_id            UUID NOT NULL REFERENCES sudarplay_maps(id),
  module_id         UUID NOT NULL REFERENCES modules(id),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  completed         BOOLEAN NOT NULL DEFAULT FALSE,
  rooms_visited     JSONB DEFAULT '[]'::jsonb,
  quiz_results      JSONB DEFAULT '{}'::jsonb,
  total_duration_s  INTEGER,
  cert_issued       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sudarplay_sessions_learner ON sudarplay_sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sudarplay_sessions_module  ON sudarplay_sessions(module_id);


-- 5. learning_events: no schema change. New event_type values (documentation):
--   'sudarplay_room_enter', 'sudarplay_room_exit', 'sudarplay_npc_interaction',
--   'sudarplay_object_interact', 'sudarplay_quiz_attempt', 'sudarplay_quiz_pass',
--   'sudarplay_quiz_fail', 'sudarplay_code_run', 'sudarplay_complete'


-- 6. RLS Policies

ALTER TABLE sudarplay_maps ENABLE ROW LEVEL SECURITY;

-- enrollments uses user_id (not learner_id)
CREATE POLICY "sudarplay_maps_select_enrolled"
  ON sudarplay_maps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = sudarplay_maps.course_id
        AND e.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "sudarplay_maps_insert_owner"
  ON sudarplay_maps FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "sudarplay_maps_update_owner"
  ON sudarplay_maps FOR UPDATE
  USING (created_by = auth.uid());


ALTER TABLE sudarplay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sudarplay_sessions_own"
  ON sudarplay_sessions FOR ALL
  USING (learner_id = auth.uid());


-- 7. Trigger: update updated_at on sudarplay_maps
CREATE OR REPLACE FUNCTION update_sudarplay_maps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sudarplay_maps_updated_at ON sudarplay_maps;
CREATE TRIGGER sudarplay_maps_updated_at
  BEFORE UPDATE ON sudarplay_maps
  FOR EACH ROW EXECUTE FUNCTION update_sudarplay_maps_updated_at();
