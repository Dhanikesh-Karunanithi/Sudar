-- AI usage ledger and org rollups for token monitoring and cost estimates.

CREATE TYPE public.ai_usage_surface AS ENUM ('learn', 'studio', 'intelligence');
CREATE TYPE public.ai_usage_unit_type AS ENUM (
  'llm_tokens',
  'embedding_tokens',
  'tts_characters',
  'image',
  'video_job'
);

CREATE TABLE IF NOT EXISTS public.ai_model_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  model text NOT NULL,
  price_per_1m_input numeric(12, 6) NOT NULL DEFAULT 0,
  price_per_1m_output numeric(12, 6) NOT NULL DEFAULT 0,
  effective_from date NOT NULL DEFAULT (current_date),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, model, effective_from)
);

COMMENT ON TABLE public.ai_model_pricing IS 'Reference prices for marginal cost estimates (USD per 1M tokens). Not billing invoices.';

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  surface public.ai_usage_surface NOT NULL,
  feature text NOT NULL,
  call_kind text NOT NULL DEFAULT 'main',
  route text,
  provider text,
  model text,
  unit_type public.ai_usage_unit_type NOT NULL DEFAULT 'llm_tokens',
  prompt_tokens integer,
  completion_tokens integer,
  cached_tokens integer DEFAULT 0,
  total_tokens integer,
  units numeric(14, 4),
  estimated_cost_usd numeric(14, 8),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ai_usage_events_org_created_idx
  ON public.ai_usage_events (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_events_org_feature_created_idx
  ON public.ai_usage_events (org_id, feature, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_events_created_idx
  ON public.ai_usage_events (created_at DESC);

COMMENT ON TABLE public.ai_usage_events IS 'Append-only AI consumption ledger. No prompts or responses stored.';

CREATE TABLE IF NOT EXISTS public.ai_usage_daily_org (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  feature text NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  prompt_tokens bigint NOT NULL DEFAULT 0,
  completion_tokens bigint NOT NULL DEFAULT 0,
  total_tokens bigint NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(14, 8) NOT NULL DEFAULT 0,
  units_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, event_date, feature)
);

CREATE INDEX IF NOT EXISTS ai_usage_daily_org_org_date_idx
  ON public.ai_usage_daily_org (org_id, event_date DESC);

-- Seed reference pricing (USD per 1M tokens; update as list prices change)
INSERT INTO public.ai_model_pricing (provider, model, price_per_1m_input, price_per_1m_output, effective_from)
VALUES
  ('together', 'openai/gpt-oss-20b', 0.05, 0.20, current_date),
  ('together', 'google/gemma-3n-E4B-it', 0.02, 0.04, current_date),
  ('together', 'meta-llama/Llama-3.3-70B-Instruct-Turbo', 0.88, 0.88, current_date),
  ('openai', 'gpt-4o-mini', 0.15, 0.60, current_date),
  ('openai', 'gpt-4o', 2.50, 10.00, current_date),
  ('anthropic', 'claude-3-5-sonnet-20241022', 3.00, 15.00, current_date),
  ('openrouter', 'openai/gpt-4o-mini', 0.15, 0.60, current_date)
ON CONFLICT (provider, model, effective_from) DO NOTHING;

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_daily_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_pricing ENABLE ROW LEVEL SECURITY;

-- Org admins read rollups for their org
CREATE POLICY ai_usage_daily_org_org_admin_select
  ON public.ai_usage_daily_org
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = ai_usage_daily_org.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY ai_usage_daily_org_super_admin_select
  ON public.ai_usage_daily_org
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'::public.role
    )
  );

-- Raw events: org admins only (service role writes)
CREATE POLICY ai_usage_events_org_admin_select
  ON public.ai_usage_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = ai_usage_events.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY ai_usage_events_super_admin_select
  ON public.ai_usage_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'SUPER_ADMIN'::public.role
    )
  );

-- Pricing readable by authenticated (estimates in UI)
CREATE POLICY ai_model_pricing_authenticated_select
  ON public.ai_model_pricing
  FOR SELECT
  TO authenticated
  USING (true);

-- Atomic token increment on usage_limits (optional daily cap sync)
CREATE OR REPLACE FUNCTION public.increment_usage_token_count(
  p_user_id uuid,
  p_date date,
  p_tokens integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total integer;
BEGIN
  INSERT INTO public.usage_limits (user_id, date, request_count, token_count)
  VALUES (p_user_id, p_date, 0, GREATEST(p_tokens, 0))
  ON CONFLICT (user_id, date)
  DO UPDATE SET token_count = usage_limits.token_count + GREATEST(p_tokens, 0)
  RETURNING token_count INTO new_total;
  RETURN new_total;
END;
$$;

-- Roll up raw events into daily org/feature aggregates
CREATE OR REPLACE FUNCTION public.refresh_ai_usage_rollups(p_date date DEFAULT (current_date - 1))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_usage_daily_org (
    org_id,
    event_date,
    feature,
    request_count,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated_cost_usd,
    units_breakdown,
    updated_at
  )
  SELECT
    e.org_id,
    p_date,
    e.feature,
    COUNT(*)::integer,
    COALESCE(SUM(e.prompt_tokens), 0)::bigint,
    COALESCE(SUM(e.completion_tokens), 0)::bigint,
    COALESCE(SUM(e.total_tokens), 0)::bigint,
    COALESCE(SUM(e.estimated_cost_usd), 0),
    COALESCE(
      (
        SELECT jsonb_object_agg(unit_type_key, unit_total)
        FROM (
          SELECT e2.unit_type::text AS unit_type_key, SUM(e2.units) AS unit_total
          FROM public.ai_usage_events e2
          WHERE e2.org_id = e.org_id
            AND e2.feature = e.feature
            AND e2.created_at >= p_date::timestamptz
            AND e2.created_at < (p_date + 1)::timestamptz
            AND e2.units IS NOT NULL
          GROUP BY e2.unit_type
        ) u
      ),
      '{}'::jsonb
    ),
    now()
  FROM public.ai_usage_events e
  WHERE e.created_at >= p_date::timestamptz
    AND e.created_at < (p_date + 1)::timestamptz
  GROUP BY e.org_id, e.feature
  ON CONFLICT (org_id, event_date, feature)
  DO UPDATE SET
    request_count = EXCLUDED.request_count,
    prompt_tokens = EXCLUDED.prompt_tokens,
    completion_tokens = EXCLUDED.completion_tokens,
    total_tokens = EXCLUDED.total_tokens,
    estimated_cost_usd = EXCLUDED.estimated_cost_usd,
    units_breakdown = EXCLUDED.units_breakdown,
    updated_at = now();
END;
$$;
