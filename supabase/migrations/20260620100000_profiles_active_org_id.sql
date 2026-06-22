-- Multi-org admin: persist active workspace selection for Studio + Learn.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_org_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;

-- Backfill from primary org pointer where membership still exists.
UPDATE public.profiles p
SET active_org_id = p.org_id
WHERE p.active_org_id IS NULL
  AND p.org_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.user_id = p.id AND om.org_id = p.org_id
  );

-- Users with memberships but no org_id pointer: pick earliest membership.
UPDATE public.profiles p
SET active_org_id = sub.org_id,
    org_id = COALESCE(p.org_id, sub.org_id)
FROM (
  SELECT DISTINCT ON (om.user_id) om.user_id, om.org_id
  FROM public.org_members om
  ORDER BY om.user_id, om.joined_at ASC NULLS LAST
) sub
WHERE p.id = sub.user_id
  AND p.active_org_id IS NULL;

CREATE INDEX IF NOT EXISTS profiles_active_org_id_idx ON public.profiles(active_org_id);
