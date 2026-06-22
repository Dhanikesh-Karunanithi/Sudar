-- Preview metadata for SudarSim test sessions (author preview before publish)
ALTER TABLE sim_sessions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN sim_sessions.metadata IS 'Session flags e.g. { "preview": true } for author test runs';
