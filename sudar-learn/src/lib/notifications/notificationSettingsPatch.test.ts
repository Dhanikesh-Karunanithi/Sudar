import { describe, expect, it } from 'vitest'
import { parseNotificationSettingsPatch } from './notificationSettingsPatch'

describe('parseNotificationSettingsPatch', () => {
  it('accepts learner-editable sound and quiet-hour fields', () => {
    const result = parseNotificationSettingsPatch({
      sound_enabled: true,
      sound_volume: 40,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.sound_volume).toBe(40)
    }
  })

  it('rejects user_id override and server-owned coin timestamps', () => {
    expect(
      parseNotificationSettingsPatch({
        user_id: '00000000-0000-4000-8000-000000000001',
        sound_enabled: true,
      }).ok,
    ).toBe(false)
    expect(
      parseNotificationSettingsPatch({
        coin_opt_in_awarded_at: '2026-01-01T00:00:00.000Z',
      }).ok,
    ).toBe(false)
  })
})
