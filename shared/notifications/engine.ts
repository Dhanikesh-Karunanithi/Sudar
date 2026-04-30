import type { SupabaseClient } from '@supabase/supabase-js'
import { NOTIFICATION_CATEGORY_CONFIG, type NotificationCategorySlug, type NotificationChannel } from './categories'
import { asNotificationDb, type Json } from './dbTypes'

export interface DispatchNotificationInput {
  userId: string
  category: NotificationCategorySlug
  title: string
  body?: string | null
  linkUrl?: string | null
  metadata?: Record<string, unknown>
  preferredChannels?: NotificationChannel[]
  orgMandatoryChannels?: NotificationChannel[]
}

export interface NotificationDispatchResult {
  channels: NotificationChannel[]
  suppressed: Array<{ channel: NotificationChannel; reason: string }>
  notificationId?: string
}

function isWithinQuietHours(now: Date, timezone: string, start?: string | null, end?: string | null): boolean {
  if (!start || !end) return false
  const localeNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const [sh, sm] = start.split(':').map((v) => Number(v))
  const [eh, em] = end.split(':').map((v) => Number(v))
  const minutes = localeNow.getHours() * 60 + localeNow.getMinutes()
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  if (startMinutes === endMinutes) return false
  if (startMinutes < endMinutes) return minutes >= startMinutes && minutes < endMinutes
  return minutes >= startMinutes || minutes < endMinutes
}

async function resolveChannels(
  admin: SupabaseClient<unknown>,
  input: DispatchNotificationInput
): Promise<{ channels: NotificationChannel[]; suppressed: Array<{ channel: NotificationChannel; reason: string }> }> {
  const db = asNotificationDb(admin)
  const categoryConfig = NOTIFICATION_CATEGORY_CONFIG[input.category]
  const base = new Set<NotificationChannel>(input.preferredChannels ?? categoryConfig.defaultChannels)
  for (const c of input.orgMandatoryChannels ?? []) base.add(c)

  const { data: prefs } = await db
    .from('notification_preferences')
    .select('channel, enabled')
    .eq('user_id', input.userId)
    .eq('category_slug', input.category)

  const prefMap = new Map<string, boolean>((prefs ?? []).map((p: { channel: string; enabled: boolean }) => [p.channel, p.enabled]))
  const channels: NotificationChannel[] = []
  const suppressed: Array<{ channel: NotificationChannel; reason: string }> = []

  for (const channel of base) {
    const prefEnabled = prefMap.get(channel)
    if (prefEnabled === false && !(input.orgMandatoryChannels ?? []).includes(channel)) {
      suppressed.push({ channel, reason: 'user_disabled' })
      continue
    }
    channels.push(channel)
  }

  return { channels, suppressed }
}

async function applyRateAndQuietHours(
  admin: SupabaseClient<unknown>,
  input: DispatchNotificationInput,
  channels: NotificationChannel[]
): Promise<{ allowed: NotificationChannel[]; suppressed: Array<{ channel: NotificationChannel; reason: string }> }> {
  const db = asNotificationDb(admin)
  const now = new Date()
  const cfg = NOTIFICATION_CATEGORY_CONFIG[input.category]
  const dayStart = new Date(now)
  dayStart.setUTCHours(0, 0, 0, 0)

  const { count } = await db
    .from('notification_delivery_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .eq('category_slug', input.category)
    .gte('created_at', dayStart.toISOString())

  const suppressed: Array<{ channel: NotificationChannel; reason: string }> = []
  if ((count ?? 0) >= cfg.rateCapPerDay) {
    return {
      allowed: [],
      suppressed: channels.map((channel) => ({ channel, reason: 'rate_cap' })),
    }
  }

  const { data: settings } = await db
    .from('user_notification_settings')
    .select('timezone, quiet_hours_start, quiet_hours_end')
    .eq('user_id', input.userId)
    .maybeSingle()

  const inQuietHours =
    cfg.allowQuietHours &&
    isWithinQuietHours(
      now,
      settings?.timezone ?? 'UTC',
      settings?.quiet_hours_start ?? null,
      settings?.quiet_hours_end ?? null
    )

  if (inQuietHours) {
    const nonInApp = channels.filter((c) => c !== 'in_app')
    for (const c of nonInApp) suppressed.push({ channel: c, reason: 'quiet_hours' })
    return { allowed: channels.filter((c) => c === 'in_app'), suppressed }
  }

  return { allowed: channels, suppressed }
}

async function logDelivery(
  admin: SupabaseClient<unknown>,
  userId: string,
  category: NotificationCategorySlug,
  channel: NotificationChannel,
  status: 'queued' | 'suppressed',
  reason?: string,
  notificationId?: string,
  metadata?: Record<string, unknown>
) {
  const db = asNotificationDb(admin)
  await db.from('notification_delivery_log').insert({
    user_id: userId,
    notification_id: notificationId ?? null,
    category_slug: category,
    channel,
    status,
    suppression_reason: reason ?? null,
    sent_at: status === 'queued' ? new Date().toISOString() : null,
    metadata: (metadata ?? {}) as Json,
  })
}

export async function dispatchNotification(
  admin: SupabaseClient<unknown>,
  input: DispatchNotificationInput,
  handlers: Partial<Record<NotificationChannel, (payload: DispatchNotificationInput & { channel: NotificationChannel; notificationId?: string }) => Promise<void>>>
): Promise<NotificationDispatchResult> {
  const db = asNotificationDb(admin)
  const { channels, suppressed } = await resolveChannels(admin, input)
  const throttled = await applyRateAndQuietHours(admin, input, channels)
  const allSuppressed = [...suppressed, ...throttled.suppressed]

  let notificationId: string | undefined
  if (throttled.allowed.includes('in_app')) {
    const { data } = await db
      .from('user_notifications')
      .insert({
        user_id: input.userId,
        category: input.category,
        title: input.title,
        body: input.body ?? null,
        link_url: input.linkUrl ?? null,
        metadata: (input.metadata ?? {}) as Json,
      })
      .select('id')
      .single()
    notificationId = data?.id
  }

  for (const channel of throttled.allowed) {
    await logDelivery(admin, input.userId, input.category, channel, 'queued', undefined, notificationId, input.metadata)
    if (channel === 'in_app') continue
    const handler = handlers[channel]
    if (handler) await handler({ ...input, channel, notificationId })
  }

  for (const s of allSuppressed) {
    await logDelivery(admin, input.userId, input.category, s.channel, 'suppressed', s.reason, notificationId, input.metadata)
  }

  return { channels: throttled.allowed, suppressed: allSuppressed, notificationId }
}
