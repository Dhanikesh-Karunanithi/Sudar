-- Atomic invite redemption: prevents concurrent signups from exceeding max_uses
-- and supports signup-time redemption in handle_new_user.

CREATE OR REPLACE FUNCTION public.redeem_invite_code_internal(raw_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_invite public.invite_codes%ROWTYPE;
BEGIN
  IF raw_code IS NULL OR length(trim(raw_code)) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invite code is required.');
  END IF;

  v_code := upper(trim(raw_code));

  UPDATE public.invite_codes
  SET uses_count = uses_count + 1
  WHERE code = v_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  RETURNING * INTO v_invite;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or expired invite code.');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'code', v_invite.code,
    'uses_count', v_invite.uses_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_invite_code_internal(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code_internal(text) TO service_role;

-- Redeem invite at email signup (handle_new_user) so uses_count is not burned on every login.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_tier text;
  v_signup_code text;
  v_invite_raw text;
  validation jsonb;
  redeem_result jsonb;
BEGIN
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_invite_raw := new.raw_user_meta_data->>'invite_code';

  v_tier := 'default';
  v_signup_code := null;

  IF v_invite_raw IS NOT NULL AND length(trim(v_invite_raw)) >= 4 THEN
    validation := public.validate_invite_code_internal(v_invite_raw);
    IF coalesce((validation->>'valid')::boolean, false) THEN
      redeem_result := public.redeem_invite_code_internal(v_invite_raw);
      IF coalesce((redeem_result->>'ok')::boolean, false) THEN
        v_tier := coalesce(validation->>'grants_tier', 'early_access');
        v_signup_code := validation->>'code';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, access_tier, signup_code_used, role)
  VALUES (new.id, v_full_name, new.raw_user_meta_data->>'avatar_url', v_tier, v_signup_code, 'LEARNER')
  ON CONFLICT (id) DO UPDATE SET
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    access_tier = CASE
      WHEN public.profiles.signup_code_used IS NOT NULL THEN public.profiles.access_tier
      ELSE excluded.access_tier
    END,
    signup_code_used = coalesce(public.profiles.signup_code_used, excluded.signup_code_used);

  RETURN new;
END;
$$;
