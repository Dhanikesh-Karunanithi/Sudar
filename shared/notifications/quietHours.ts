/** Whether local time in `timezone` falls within quiet hours (supports overnight ranges). */
export function isWithinQuietHours(
  now: Date,
  timezone: string,
  start?: string | null,
  end?: string | null
): boolean {
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
