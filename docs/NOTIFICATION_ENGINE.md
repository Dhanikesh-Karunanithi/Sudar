# Sudar Notification Engine

## Purpose

Sudar Notification Engine unifies in-app, web push, OS foreground, and email notifications under one decision system that is:

- learner-personalized (Digital Learner Twin aware),
- creator-brandable (template + campaign driven),
- org-governed (mandatory categories + global caps),
- and gamification-safe (coin incentives with anti-abuse guardrails).

## Core Principles

- Consent before interruption.
- In-app first, other channels additive.
- One dispatcher, many channels.
- Reward behavior, not exploitative toggling.
- Mandatory compliance categories can bypass per-user toggles.

## Existing Foundation Used

- `user_notifications` table and RLS.
- Learn notification APIs and notification center UI.
- Existing coin/xp/quest/achievement ledgers and APIs.
- Studio browser notification hook for foreground OS notifications.
- Resend-based compliance reminder cron.

## New Data Model

Adds:

- `notification_categories`
- `notification_preferences`
- `user_notification_settings`
- `notification_channels`
- `notification_delivery_log`
- `notification_templates`
- `notification_campaigns`

Also extends:

- `coin_ledger` event vocabulary with:
  - `notifications_opt_in_bonus`
  - `notifications_monthly_engagement_bonus`
  - `notifications_offline_focus_bonus`

## Dispatch Flow

1. Event comes from enrollment/gamification/campaign/cron.
2. Engine resolves matching notification category.
3. Engine renders template variables.
4. Engine resolves user + org preference policy.
5. Engine applies quiet hours and rate caps.
6. Engine dispatches to eligible channels.
7. Engine records delivery outcomes and interaction telemetry.

## Channel Strategy

- `in_app`: writes `user_notifications`, optional realtime fan-out.
- `web_push`: service worker + VAPID endpoint subscriptions.
- `os_foreground`: in-tab browser notifications where allowed.
- `email`: direct and digest mode with unsubscribe support.

## User Controls

Learner settings include:

- quiet hours and timezone,
- frequency mode (`minimal|balanced|high`),
- category x channel toggles,
- delivery summary,
- coin bonus eligibility snapshot.

## Creator Controls

Studio tools provide:

- template authoring with branding,
- campaign scheduling and audience filters,
- CTA quicklink presets,
- test-send flow.

## Org Controls

Org settings provide:

- mandatory categories list,
- global cap per user/day or week,
- vertical presets:
  - Academic
  - Corporate L&D
  - Regulated Compliance

## Soft Permission Primer

Native browser permission prompt is never shown cold. Learner first sees an in-app primer that:

- appears after engagement milestones,
- explains value and controls clearly,
- supports "Not now" and "Never" suppression windows,
- asks for category preferences before permission prompt.

## Coin Guardrails

- One-time opt-in bonus for first successful push-channel enablement.
- No repeat award for rapid disable/re-enable.
- Monthly engagement bonus requires sustained enabled state and open-rate threshold.
- Offline-focus alternate bonus ensures learners opting out are not penalized if they keep learning.

## Rollout

1. Foundation: schema + engine + in-app realtime + learner controls.
2. Web push + soft primer + anti-abuse guardrails.
3. Creator template/campaign layer.
4. Email digest and org policy presets.
