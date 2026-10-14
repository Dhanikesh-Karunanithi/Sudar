import { z } from 'zod'

const timeField = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Expected HH:MM or HH:MM:SS')
  .optional()
  .nullable()

/** Learner-writable columns on user_notification_settings (server-owned fields excluded). */
export const notificationSettingsPatchSchema = z
  .object({
    quiet_hours_start: timeField,
    quiet_hours_end: timeField,
    timezone: z.string().min(1).max(64).optional(),
    locale: z.string().min(2).max(16).optional(),
    daily_digest_email: z.boolean().optional(),
    frequency_mode: z.enum(['minimal', 'balanced', 'high']).optional(),
    never_prompt_push: z.boolean().optional(),
    push_prompt_snooze_until: z.string().datetime().optional().nullable(),
    sound_enabled: z.boolean().optional(),
    sound_volume: z.number().int().min(0).max(100).optional(),
    sound_task_complete: z.boolean().optional(),
    sound_sudar_reply: z.boolean().optional(),
    sound_notifications: z.boolean().optional(),
    sound_celebration: z.boolean().optional(),
  })
  .strict()

export type NotificationSettingsPatch = z.infer<typeof notificationSettingsPatchSchema>

export function parseNotificationSettingsPatch(
  input: unknown,
): { ok: true; data: NotificationSettingsPatch } | { ok: false; error: string } {
  const parsed = notificationSettingsPatchSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid notification settings' }
  }
  return { ok: true, data: parsed.data }
}
