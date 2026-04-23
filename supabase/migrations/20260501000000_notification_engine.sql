-- =============================================================================
-- Sudar Notification Engine — Foundation Schema
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE public.notification_channel AS ENUM ('in_app', 'web_push', 'os_foreground', 'email');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_delivery_status') THEN
    CREATE TYPE public.notification_delivery_status AS ENUM ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'suppressed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_suppression_reason') THEN
    CREATE TYPE public.notification_suppression_reason AS ENUM ('quiet_hours', 'rate_cap', 'user_disabled', 'channel_revoked');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_frequency_mode') THEN
    CREATE TYPE public.notification_frequency_mode AS ENUM ('minimal', 'balanced', 'high');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notification_categories (
  slug                  text PRIMARY KEY,
  title                 text NOT NULL,
  description           text NOT NULL,
  default_channels      public.notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::public.notification_channel[],
  is_mandatory_for_orgs boolean NOT NULL DEFAULT false,
  rate_cap_per_day      integer NOT NULL DEFAULT 3,
  allow_quiet_hours     boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug text NOT NULL REFERENCES public.notification_categories(slug) ON DELETE CASCADE,
  channel       public.notification_channel NOT NULL,
  enabled       boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_slug, channel)
);

CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  user_id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quiet_hours_start          time,
  quiet_hours_end            time,
  timezone                   text NOT NULL DEFAULT 'UTC',
  locale                     text NOT NULL DEFAULT 'en',
  daily_digest_email         boolean NOT NULL DEFAULT false,
  frequency_mode             public.notification_frequency_mode NOT NULL DEFAULT 'balanced',
  coin_opt_in_awarded_at     timestamptz,
  last_monthly_bonus_at      timestamptz,
  last_revoke_at             timestamptz,
  never_prompt_push          boolean NOT NULL DEFAULT false,
  push_prompt_snooze_until   timestamptz,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_channels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel         public.notification_channel NOT NULL,
  endpoint_hash   text NOT NULL,
  endpoint_payload jsonb NOT NULL DEFAULT '{}',
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz,
  revoked_at      timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_channels_user_endpoint_uidx
  ON public.notification_channels (user_id, endpoint_hash);

CREATE UNIQUE INDEX IF NOT EXISTS notification_channels_channel_endpoint_uidx
  ON public.notification_channels (channel, endpoint_hash);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
  slug             text NOT NULL,
  category_slug    text NOT NULL REFERENCES public.notification_categories(slug) ON DELETE RESTRICT,
  title_mustache   text NOT NULL,
  body_mustache    text,
  cta_label        text,
  cta_url_mustache text,
  branding         jsonb NOT NULL DEFAULT '{}',
  channels         public.notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::public.notification_channel[],
  locale           text NOT NULL DEFAULT 'en',
  is_active        boolean NOT NULL DEFAULT true,
  created_by       uuid NOT NULL REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug, locale)
);

CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  template_id     uuid NOT NULL REFERENCES public.notification_templates(id) ON DELETE CASCADE,
  audience_filter jsonb NOT NULL DEFAULT '{}',
  schedule_rule   jsonb NOT NULL DEFAULT '{"when":"immediate","repeat":false}'::jsonb,
  status          text NOT NULL DEFAULT 'draft',
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id    uuid REFERENCES public.user_notifications(id) ON DELETE SET NULL,
  template_id        uuid REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  category_slug      text NOT NULL REFERENCES public.notification_categories(slug) ON DELETE RESTRICT,
  channel            public.notification_channel NOT NULL,
  status             public.notification_delivery_status NOT NULL DEFAULT 'queued',
  suppression_reason public.notification_suppression_reason,
  scheduled_send_at  timestamptz,
  sent_at            timestamptz,
  opened_at          timestamptz,
  clicked_at         timestamptz,
  metadata           jsonb NOT NULL DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx
  ON public.notification_preferences (user_id);

CREATE INDEX IF NOT EXISTS notification_delivery_log_user_created_idx
  ON public.notification_delivery_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notification_delivery_log_user_category_idx
  ON public.notification_delivery_log (user_id, category_slug, created_at DESC);

ALTER TABLE public.notification_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_categories_public_select" ON public.notification_categories;
CREATE POLICY "notification_categories_public_select"
  ON public.notification_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "notification_preferences_select_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_select_own"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_update_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_update_own"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_insert_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_insert_own"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_notification_settings_select_own" ON public.user_notification_settings;
CREATE POLICY "user_notification_settings_select_own"
  ON public.user_notification_settings FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_notification_settings_upsert_own" ON public.user_notification_settings;
CREATE POLICY "user_notification_settings_upsert_own"
  ON public.user_notification_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_notification_settings_update_own" ON public.user_notification_settings;
CREATE POLICY "user_notification_settings_update_own"
  ON public.user_notification_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_channels_select_own" ON public.notification_channels;
CREATE POLICY "notification_channels_select_own"
  ON public.notification_channels FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_channels_insert_own" ON public.notification_channels;
CREATE POLICY "notification_channels_insert_own"
  ON public.notification_channels FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_channels_update_own" ON public.notification_channels;
CREATE POLICY "notification_channels_update_own"
  ON public.notification_channels FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_delivery_log_select_own" ON public.notification_delivery_log;
CREATE POLICY "notification_delivery_log_select_own"
  ON public.notification_delivery_log FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_templates_select_org_member" ON public.notification_templates;
CREATE POLICY "notification_templates_select_org_member"
  ON public.notification_templates FOR SELECT
  USING (
    org_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = notification_templates.org_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "notification_campaigns_select_org_member" ON public.notification_campaigns;
CREATE POLICY "notification_campaigns_select_org_member"
  ON public.notification_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = notification_campaigns.org_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "notification_campaigns_insert_org_admin" ON public.notification_campaigns;
CREATE POLICY "notification_campaigns_insert_org_admin"
  ON public.notification_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = notification_campaigns.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('ADMIN', 'MANAGER', 'CREATOR')
    )
  );

DROP POLICY IF EXISTS "notification_templates_insert_org_admin" ON public.notification_templates;
CREATE POLICY "notification_templates_insert_org_admin"
  ON public.notification_templates FOR INSERT
  WITH CHECK (
    org_id IS NULL OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = notification_templates.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('ADMIN', 'MANAGER', 'CREATOR')
    )
  );

INSERT INTO public.notification_categories (
  slug,
  title,
  description,
  default_channels,
  is_mandatory_for_orgs,
  rate_cap_per_day,
  allow_quiet_hours
) VALUES
  ('course_assigned', 'Course assigned', 'A new course has been assigned to the learner.', ARRAY['in_app','email']::public.notification_channel[], true, 2, false),
  ('path_assigned', 'Path assigned', 'A new learning path has been assigned.', ARRAY['in_app','email']::public.notification_channel[], true, 2, false),
  ('mission_daily', 'Daily mission', 'A daily mission is available.', ARRAY['in_app','web_push']::public.notification_channel[], false, 1, true),
  ('mission_streak_risk', 'Streak at risk', 'A learner streak is at risk and can be saved.', ARRAY['in_app','web_push','email']::public.notification_channel[], false, 2, true),
  ('coin_drop', 'Coin opportunity', 'A coin earning opportunity is available.', ARRAY['in_app','web_push']::public.notification_channel[], false, 2, true),
  ('achievement', 'Achievement unlocked', 'A new achievement has been unlocked.', ARRAY['in_app','web_push']::public.notification_channel[], false, 4, true),
  ('level_up', 'Level up', 'A learner reached a new scholar level.', ARRAY['in_app','web_push']::public.notification_channel[], false, 2, true),
  ('leaderboard', 'Leaderboard update', 'Learner position changed in leaderboard.', ARRAY['in_app','web_push']::public.notification_channel[], false, 2, true),
  ('checkin_today', 'Daily check-in', 'Today''s check-in prompt is ready.', ARRAY['in_app','web_push']::public.notification_channel[], false, 1, true),
  ('course_generated', 'Course generated', 'A generated course is now ready.', ARRAY['in_app','os_foreground']::public.notification_channel[], false, 3, false),
  ('tutor_proactive', 'Sudar proactive nudge', 'Sudar has a proactive recommendation.', ARRAY['in_app','web_push']::public.notification_channel[], false, 2, true),
  ('compliance_overdue', 'Compliance overdue', 'Mandatory compliance assignment is overdue.', ARRAY['in_app','email']::public.notification_channel[], true, 3, false),
  ('org_announcement', 'Org announcement', 'Organization-wide announcement.', ARRAY['in_app','email']::public.notification_channel[], false, 2, true),
  ('creator_campaign', 'Creator campaign', 'Creator-authored campaign message.', ARRAY['in_app','web_push','email']::public.notification_channel[], false, 3, true),
  ('system', 'System update', 'Critical product update or operational notice.', ARRAY['in_app','email']::public.notification_channel[], true, 5, false)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  default_channels = EXCLUDED.default_channels,
  is_mandatory_for_orgs = EXCLUDED.is_mandatory_for_orgs,
  rate_cap_per_day = EXCLUDED.rate_cap_per_day,
  allow_quiet_hours = EXCLUDED.allow_quiet_hours,
  updated_at = now();
