-- Talisma early-access invite (unlimited uses for distribution)
INSERT INTO public.invite_codes (code, type, grants_tier, max_uses, is_active, bonus_credits)
VALUES ('EARLY_TALISMA', 'early_access', 'early_access', NULL, true, 0)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  grants_tier = 'early_access',
  type = 'early_access';
