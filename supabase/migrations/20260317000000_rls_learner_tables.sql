-- ============================================================
-- RLS for learner-scoped and analytics tables
-- Enforces auth.uid() = user_id for learner data; protects against
-- IDOR and accidental exposure when using anon key.
-- Service role (Studio/Learn server) bypasses RLS.
-- ============================================================

-- learner_profiles: learners can only read/update their own Digital Learner Twin
ALTER TABLE IF EXISTS public.learner_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learner_profiles_select_own" ON public.learner_profiles;
CREATE POLICY "learner_profiles_select_own"
  ON public.learner_profiles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "learner_profiles_insert_own" ON public.learner_profiles;
CREATE POLICY "learner_profiles_insert_own"
  ON public.learner_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "learner_profiles_update_own" ON public.learner_profiles;
CREATE POLICY "learner_profiles_update_own"
  ON public.learner_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- learning_events: learners can only insert and read their own events
ALTER TABLE IF EXISTS public.learning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learning_events_select_own" ON public.learning_events;
CREATE POLICY "learning_events_select_own"
  ON public.learning_events FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "learning_events_insert_own" ON public.learning_events;
CREATE POLICY "learning_events_insert_own"
  ON public.learning_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ai_interactions: learners can only insert and read their own tutor interactions
ALTER TABLE IF EXISTS public.ai_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_interactions_select_own" ON public.ai_interactions;
CREATE POLICY "ai_interactions_select_own"
  ON public.ai_interactions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_interactions_insert_own" ON public.ai_interactions;
CREATE POLICY "ai_interactions_insert_own"
  ON public.ai_interactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- enrollments: learners can only read/update their own enrollments; can self-enroll
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_select_own" ON public.enrollments;
CREATE POLICY "enrollments_select_own"
  ON public.enrollments FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "enrollments_insert_own" ON public.enrollments;
CREATE POLICY "enrollments_insert_own"
  ON public.enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "enrollments_update_own" ON public.enrollments;
CREATE POLICY "enrollments_update_own"
  ON public.enrollments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- certifications: learners can only read their own; issue and public verification by code
-- are done server-side with service role (createAdminClient)
ALTER TABLE IF EXISTS public.certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certifications_select_own" ON public.certifications;
CREATE POLICY "certifications_select_own"
  ON public.certifications FOR SELECT
  USING (user_id = auth.uid());

-- content_chunks: authenticated users can read chunks for published courses only (RAG)
DO $$
BEGIN
  IF to_regclass('public.content_chunks') IS NOT NULL THEN
    ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "content_chunks_select_published" ON public.content_chunks;
    CREATE POLICY "content_chunks_select_published"
      ON public.content_chunks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c
          WHERE c.id = content_chunks.course_id
            AND c.status = 'published'
        )
      );

    -- No INSERT/UPDATE/DELETE policies for content_chunks: only service role (Studio) writes
  END IF;
END
$$;
