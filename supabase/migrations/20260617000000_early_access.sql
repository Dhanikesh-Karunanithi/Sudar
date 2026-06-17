-- Early access: invite codes, waitlist, profile access tiers (Sudar)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_tier text NOT NULL DEFAULT 'default'
    CHECK (access_tier IN ('default', 'early_access', 'tester', 'unlimited')),
  ADD COLUMN IF NOT EXISTS signup_code_used text;

CREATE INDEX IF NOT EXISTS profiles_access_tier_idx ON public.profiles (access_tier);

CREATE TABLE IF NOT EXISTS public.access_tier_config (
  tier text PRIMARY KEY,
  requires_invite boolean NOT NULL DEFAULT true,
  description text
);

INSERT INTO public.access_tier_config (tier, requires_invite, description)
VALUES
  ('default', true, 'Invite signup — default tier'),
  ('early_access', true, 'Early access members'),
  ('tester', false, 'Internal beta — no invite required'),
  ('unlimited', false, 'Admin override — no invite required')
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('early_access', 'tester')),
  owner_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  max_uses int,
  uses_count int NOT NULL DEFAULT 0,
  grants_tier text NOT NULL DEFAULT 'early_access'
    CHECK (grants_tier IN ('default', 'early_access', 'tester', 'unlimited')),
  bonus_credits int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invite_codes_code_idx ON public.invite_codes (code);

CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  use_case text,
  role text,
  team_size text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'invited', 'signed_up')),
  invited_code_id uuid REFERENCES public.invite_codes (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);

ALTER TABLE public.access_tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_tier_config_read" ON public.access_tier_config;
CREATE POLICY "access_tier_config_read"
  ON public.access_tier_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "waitlist_entries_no_client_access" ON public.waitlist_entries;
CREATE POLICY "waitlist_entries_no_client_access"
  ON public.waitlist_entries
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Grandfather existing users before early-access gate goes live
UPDATE public.profiles
SET
  access_tier = 'early_access',
  signup_code_used = COALESCE(signup_code_used, 'GRANDFATHERED')
WHERE signup_code_used IS NULL;
