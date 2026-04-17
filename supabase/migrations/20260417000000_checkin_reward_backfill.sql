-- Backfill missed check-in rewards where responses were saved but gamification award failed.
-- Awards 10 coins + 10 XP for each unmatched check-in response.

WITH response_counts AS (
  SELECT user_id, COUNT(*)::integer AS response_count
  FROM checkin_responses
  GROUP BY user_id
),
ledger_counts AS (
  SELECT user_id, COUNT(*)::integer AS rewarded_count
  FROM coin_ledger
  WHERE event_type = 'checkin_answered'
  GROUP BY user_id
),
backfill_counts AS (
  SELECT user_id, COALESCE(SUM(amount), 0)::integer / 10 AS backfilled_count
  FROM coin_ledger
  WHERE event_type = 'checkin_backfill'
  GROUP BY user_id
),
deltas AS (
  SELECT
    rc.user_id,
    GREATEST(
      rc.response_count
      - COALESCE(lc.rewarded_count, 0)
      - COALESCE(bc.backfilled_count, 0),
      0
    )::integer AS missing_count
  FROM response_counts rc
  LEFT JOIN ledger_counts lc ON lc.user_id = rc.user_id
  LEFT JOIN backfill_counts bc ON bc.user_id = rc.user_id
),
eligible AS (
  SELECT
    lp.user_id,
    d.missing_count,
    (d.missing_count * 10)::integer AS coins_to_add,
    (d.missing_count * 10)::integer AS xp_to_add,
    lp.coin_balance,
    lp.xp_total
  FROM deltas d
  JOIN learner_profiles lp ON lp.user_id = d.user_id
  WHERE d.missing_count > 0
)
INSERT INTO coin_ledger (user_id, amount, event_type, balance_after, metadata)
SELECT
  e.user_id,
  e.coins_to_add,
  'checkin_backfill',
  e.coin_balance + e.coins_to_add,
  jsonb_build_object('reason', 'retroactive_checkin_fix', 'missing_checkins', e.missing_count)
FROM eligible e;

WITH response_counts AS (
  SELECT user_id, COUNT(*)::integer AS response_count
  FROM checkin_responses
  GROUP BY user_id
),
ledger_counts AS (
  SELECT user_id, COUNT(*)::integer AS rewarded_count
  FROM coin_ledger
  WHERE event_type = 'checkin_answered'
  GROUP BY user_id
),
backfill_counts AS (
  SELECT user_id, COALESCE(SUM(amount), 0)::integer / 10 AS backfilled_count
  FROM coin_ledger
  WHERE event_type = 'checkin_backfill'
  GROUP BY user_id
),
deltas AS (
  SELECT
    rc.user_id,
    GREATEST(
      rc.response_count
      - COALESCE(lc.rewarded_count, 0)
      - COALESCE(bc.backfilled_count, 0),
      0
    )::integer AS missing_count
  FROM response_counts rc
  LEFT JOIN ledger_counts lc ON lc.user_id = rc.user_id
  LEFT JOIN backfill_counts bc ON bc.user_id = rc.user_id
),
eligible AS (
  SELECT
    lp.user_id,
    d.missing_count,
    (d.missing_count * 10)::integer AS coins_to_add,
    (d.missing_count * 10)::integer AS xp_to_add
  FROM deltas d
  JOIN learner_profiles lp ON lp.user_id = d.user_id
  WHERE d.missing_count > 0
)
INSERT INTO xp_ledger (user_id, amount, source_type, reference_id)
SELECT
  e.user_id,
  e.xp_to_add,
  'checkin_backfill',
  NULL
FROM eligible e;

WITH response_counts AS (
  SELECT user_id, COUNT(*)::integer AS response_count
  FROM checkin_responses
  GROUP BY user_id
),
ledger_counts AS (
  SELECT user_id, COUNT(*)::integer AS rewarded_count
  FROM coin_ledger
  WHERE event_type = 'checkin_answered'
  GROUP BY user_id
),
backfill_counts AS (
  SELECT user_id, COALESCE(SUM(amount), 0)::integer / 10 AS backfilled_count
  FROM coin_ledger
  WHERE event_type = 'checkin_backfill'
  GROUP BY user_id
),
deltas AS (
  SELECT
    rc.user_id,
    GREATEST(
      rc.response_count
      - COALESCE(lc.rewarded_count, 0)
      - COALESCE(bc.backfilled_count, 0),
      0
    )::integer AS missing_count
  FROM response_counts rc
  LEFT JOIN ledger_counts lc ON lc.user_id = rc.user_id
  LEFT JOIN backfill_counts bc ON bc.user_id = rc.user_id
),
eligible AS (
  SELECT
    lp.user_id,
    (d.missing_count * 10)::integer AS coins_to_add,
    (d.missing_count * 10)::integer AS xp_to_add
  FROM deltas d
  JOIN learner_profiles lp ON lp.user_id = d.user_id
  WHERE d.missing_count > 0
)
UPDATE learner_profiles lp
SET
  coin_balance = lp.coin_balance + e.coins_to_add,
  xp_total = lp.xp_total + e.xp_to_add
FROM eligible e
WHERE lp.user_id = e.user_id;
