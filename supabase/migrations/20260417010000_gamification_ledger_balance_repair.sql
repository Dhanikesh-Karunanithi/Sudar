-- Repair learner_profiles balances from ledger truth.
-- This fixes cases where coin/xp ledger entries exist but profile aggregates are stale.

WITH coin_totals AS (
  SELECT user_id, COALESCE(SUM(amount), 0)::integer AS total_coins
  FROM coin_ledger
  GROUP BY user_id
),
xp_totals AS (
  SELECT user_id, COALESCE(SUM(amount), 0)::integer AS total_xp
  FROM xp_ledger
  GROUP BY user_id
)
UPDATE learner_profiles lp
SET
  coin_balance = COALESCE(ct.total_coins, 0),
  xp_total = COALESCE(xt.total_xp, 0)
FROM coin_totals ct
FULL OUTER JOIN xp_totals xt ON xt.user_id = ct.user_id
WHERE lp.user_id = COALESCE(ct.user_id, xt.user_id);
