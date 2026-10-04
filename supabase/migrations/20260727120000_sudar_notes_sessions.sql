-- SudarNotes session state (conversational tutor + living notebook).
-- Client still keeps a local cache; this table enables multi-device / Twin-adjacent persistence.

CREATE TABLE IF NOT EXISTS public.sudar_notes_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  thread_key text,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sudar_notes_sessions_user_updated_idx
  ON public.sudar_notes_sessions (user_id, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS sudar_notes_sessions_user_thread_uidx
  ON public.sudar_notes_sessions (user_id, thread_key)
  WHERE thread_key IS NOT NULL;

ALTER TABLE public.sudar_notes_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sudar_notes_sessions_select_own" ON public.sudar_notes_sessions;
CREATE POLICY "sudar_notes_sessions_select_own"
  ON public.sudar_notes_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sudar_notes_sessions_insert_own" ON public.sudar_notes_sessions;
CREATE POLICY "sudar_notes_sessions_insert_own"
  ON public.sudar_notes_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sudar_notes_sessions_update_own" ON public.sudar_notes_sessions;
CREATE POLICY "sudar_notes_sessions_update_own"
  ON public.sudar_notes_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sudar_notes_sessions_delete_own" ON public.sudar_notes_sessions;
CREATE POLICY "sudar_notes_sessions_delete_own"
  ON public.sudar_notes_sessions FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.sudar_notes_sessions IS
  'SudarNotes pedagogical session state (working memory, mode cadence). Service role may upsert; learners own their rows via RLS.';
