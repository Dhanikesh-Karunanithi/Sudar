-- Atomic invite redemption: prevents concurrent signups from exceeding max_uses

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
