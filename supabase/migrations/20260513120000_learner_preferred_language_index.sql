-- Optional index for analytics on learner language choice (localization v1)
CREATE INDEX IF NOT EXISTS idx_learner_profiles_preferred_language
  ON public.learner_profiles (preferred_language);
