I want-- Learner-controlled feature toggles (NULL = legacy backward-compatible defaults in app code).
ALTER TABLE public.learner_profiles
  ADD COLUMN IF NOT EXISTS learner_preferences jsonb DEFAULT NULL;

COMMENT ON COLUMN public.learner_profiles.learner_preferences IS 'JSON: tutor pacing, nudges, memory digest, modality inference opt-in, etc.';
