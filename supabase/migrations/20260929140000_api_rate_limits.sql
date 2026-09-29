-- Fixed-window request limiter shared by Studio + Learn Workers (in-memory counters do not
-- survive across isolates). Keys are pre-hashed by the app (e.g. "invite:<sha256(ip)>") so no raw
-- IPs are stored. Service-role only: RLS on with no policies, RPC EXECUTE revoked from JWT roles.

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket_key, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.api_rate_limits IS
  'Service-role only request limiter buckets (hashed keys). No authenticated policies by design.';

CREATE INDEX IF NOT EXISTS api_rate_limits_window_idx ON public.api_rate_limits (window_start);

CREATE OR REPLACE FUNCTION public.hit_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_hits integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window timestamptz;
  v_hits integer;
BEGIN
  v_window := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO public.api_rate_limits AS r (bucket_key, window_start, hits)
  VALUES (p_key, v_window, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET hits = r.hits + 1
  RETURNING hits INTO v_hits;

  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits WHERE window_start < now() - interval '1 day';
  END IF;

  RETURN v_hits <= p_max_hits;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) TO service_role;
