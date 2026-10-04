-- Sudar Teaching OS spine: domain claim graph, mastery, surface-agnostic sessions.
-- See docs/TEACHING_OS.md

-- ── Domains ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  source text NOT NULL DEFAULT 'studio'
    CHECK (source IN ('course', 'studio', 'import')),
  source_course_id uuid REFERENCES public.courses (id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_domains_org_idx
  ON public.learning_domains (org_id, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS learning_domains_org_course_uidx
  ON public.learning_domains (org_id, source_course_id)
  WHERE source_course_id IS NOT NULL;

-- ── Claims ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES public.learning_domains (id) ON DELETE CASCADE,
  stem text NOT NULL,
  misconceptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  bloom text,
  evidence_types jsonb NOT NULL DEFAULT '["explain_back","quiz"]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_claims_domain_idx
  ON public.learning_claims (domain_id, sort_order);

-- ── Edges ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.claim_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES public.learning_domains (id) ON DELETE CASCADE,
  from_claim_id uuid NOT NULL REFERENCES public.learning_claims (id) ON DELETE CASCADE,
  to_claim_id uuid NOT NULL REFERENCES public.learning_claims (id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'prerequisite'
    CHECK (kind IN ('prerequisite', 'related')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_claim_id, to_claim_id, kind)
);

CREATE INDEX IF NOT EXISTS claim_edges_domain_idx
  ON public.claim_edges (domain_id);

-- ── Content links (bridge to 1.x modules / sim / chunks) ─────────────────
CREATE TABLE IF NOT EXISTS public.claim_content_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.learning_claims (id) ON DELETE CASCADE,
  link_kind text NOT NULL
    CHECK (link_kind IN ('module', 'chunk', 'sim_scenario', 'flashcard_set')),
  target_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (claim_id, link_kind, target_id)
);

CREATE INDEX IF NOT EXISTS claim_content_links_target_idx
  ON public.claim_content_links (link_kind, target_id);

-- ── Mastery ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learner_claim_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES public.learning_claims (id) ON DELETE CASCADE,
  p_know double precision NOT NULL DEFAULT 0.3
    CHECK (p_know >= 0 AND p_know <= 1),
  confidence double precision NOT NULL DEFAULT 0.3
    CHECK (confidence >= 0 AND confidence <= 1),
  streak integer NOT NULL DEFAULT 0,
  easiness double precision NOT NULL DEFAULT 2.5,
  interval_days double precision NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  last_evidence_at timestamptz,
  next_review_at timestamptz,
  evidence_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, claim_id)
);

CREATE INDEX IF NOT EXISTS learner_claim_mastery_due_idx
  ON public.learner_claim_mastery (user_id, next_review_at);

CREATE INDEX IF NOT EXISTS learner_claim_mastery_claim_idx
  ON public.learner_claim_mastery (claim_id);

-- ── Sessions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organisations (id) ON DELETE SET NULL,
  domain_id uuid REFERENCES public.learning_domains (id) ON DELETE SET NULL,
  surface text NOT NULL DEFAULT 'conversational'
    CHECK (surface IN (
      'course', 'conversational', 'sim', 'flashcards', 'review', 'alp', 'dashboard'
    )),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  twin_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_sessions_user_updated_idx
  ON public.learning_sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS learning_sessions_domain_idx
  ON public.learning_sessions (domain_id)
  WHERE domain_id IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.learning_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_content_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_claim_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

-- Domains / claims / edges / links: org members can read; writes via service role (Studio/Learn BFFs)
DROP POLICY IF EXISTS "learning_domains_select_org" ON public.learning_domains;
CREATE POLICY "learning_domains_select_org"
  ON public.learning_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = learning_domains.org_id AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "learning_claims_select_org" ON public.learning_claims;
CREATE POLICY "learning_claims_select_org"
  ON public.learning_claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_domains d
      JOIN public.org_members om ON om.org_id = d.org_id AND om.user_id = auth.uid()
      WHERE d.id = learning_claims.domain_id
    )
  );

DROP POLICY IF EXISTS "claim_edges_select_org" ON public.claim_edges;
CREATE POLICY "claim_edges_select_org"
  ON public.claim_edges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_domains d
      JOIN public.org_members om ON om.org_id = d.org_id AND om.user_id = auth.uid()
      WHERE d.id = claim_edges.domain_id
    )
  );

DROP POLICY IF EXISTS "claim_content_links_select_org" ON public.claim_content_links;
CREATE POLICY "claim_content_links_select_org"
  ON public.claim_content_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_claims c
      JOIN public.learning_domains d ON d.id = c.domain_id
      JOIN public.org_members om ON om.org_id = d.org_id AND om.user_id = auth.uid()
      WHERE c.id = claim_content_links.claim_id
    )
  );

DROP POLICY IF EXISTS "learner_claim_mastery_select_own" ON public.learner_claim_mastery;
CREATE POLICY "learner_claim_mastery_select_own"
  ON public.learner_claim_mastery FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "learner_claim_mastery_insert_own" ON public.learner_claim_mastery;
CREATE POLICY "learner_claim_mastery_insert_own"
  ON public.learner_claim_mastery FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "learner_claim_mastery_update_own" ON public.learner_claim_mastery;
CREATE POLICY "learner_claim_mastery_update_own"
  ON public.learner_claim_mastery FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "learning_sessions_select_own" ON public.learning_sessions;
CREATE POLICY "learning_sessions_select_own"
  ON public.learning_sessions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "learning_sessions_insert_own" ON public.learning_sessions;
CREATE POLICY "learning_sessions_insert_own"
  ON public.learning_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "learning_sessions_update_own" ON public.learning_sessions;
CREATE POLICY "learning_sessions_update_own"
  ON public.learning_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "learning_sessions_delete_own" ON public.learning_sessions;
CREATE POLICY "learning_sessions_delete_own"
  ON public.learning_sessions FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.learning_domains IS
  'Teaching OS: org-scoped domain graphs (seeded from courses or Studio curator).';
COMMENT ON TABLE public.learning_claims IS
  'Teaching OS: assessable claims (atomic knowledge statements).';
COMMENT ON TABLE public.learner_claim_mastery IS
  'Teaching OS: per-learner claim mastery + spaced review schedule.';
COMMENT ON TABLE public.learning_sessions IS
  'Teaching OS: surface-agnostic learning session state.';
