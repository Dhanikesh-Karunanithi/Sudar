-- Sudar Agents: persisted orchestration runs (audit / Studio observability)
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  team text NOT NULL CHECK (team IN ('learner', 'admin')),
  goal text NOT NULL DEFAULT '',
  goal_kind text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  tool_calls jsonb NOT NULL DEFAULT '[]'::jsonb,
  artifact jsonb,
  policy_pack_id text NOT NULL DEFAULT 'default',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS agent_runs_org_created_idx
  ON public.agent_runs (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_actor_created_idx
  ON public.agent_runs (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_subject_created_idx
  ON public.agent_runs (subject_user_id, created_at DESC);

COMMENT ON TABLE public.agent_runs IS 'Sudar Agent gateway runs: plan, tool traces, artifacts (service-role access from apps).';
