-- Per-user daily usage limits for AI calls (tutor, generation, etc.)
-- Used to prevent cost abuse; check and increment before proxying to AI providers.
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT (current_date),
  request_count integer NOT NULL DEFAULT 0,
  token_count integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS usage_limits_user_date_idx ON public.usage_limits(user_id, date);

ALTER TABLE IF EXISTS public.usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_limits_select_own" ON public.usage_limits;
CREATE POLICY "usage_limits_select_own"
  ON public.usage_limits FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "usage_limits_insert_own" ON public.usage_limits;
CREATE POLICY "usage_limits_insert_own"
  ON public.usage_limits FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "usage_limits_update_own" ON public.usage_limits;
CREATE POLICY "usage_limits_update_own"
  ON public.usage_limits FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role (Learn/Studio server) bypasses RLS for check-and-increment

-- Atomic increment and return new request_count for the day (for rate limiting)
CREATE OR REPLACE FUNCTION public.increment_usage_request_count(p_user_id uuid, p_date date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.usage_limits (user_id, date, request_count, token_count)
  VALUES (p_user_id, p_date, 1, 0)
  ON CONFLICT (user_id, date)
  DO UPDATE SET request_count = usage_limits.request_count + 1
  RETURNING request_count INTO new_count;
  RETURN new_count;
END;
$$;
