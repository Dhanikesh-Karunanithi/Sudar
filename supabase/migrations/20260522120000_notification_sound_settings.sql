-- Notification sound preferences (Learn in-app chimes)

ALTER TABLE public.user_notification_settings
  ADD COLUMN IF NOT EXISTS sound_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sound_volume smallint NOT NULL DEFAULT 50
    CHECK (sound_volume >= 0 AND sound_volume <= 100),
  ADD COLUMN IF NOT EXISTS sound_task_complete boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_sudar_reply boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_celebration boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_notification_settings.sound_enabled IS 'Master toggle for in-app completion/notification chimes';
COMMENT ON COLUMN public.user_notification_settings.sound_volume IS 'User volume 0-100; code applies additional cap for subtle playback';
