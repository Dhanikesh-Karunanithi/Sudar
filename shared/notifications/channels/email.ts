export interface EmailNotificationPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const from = process.env.RESEND_FROM ?? 'Sudar <onboarding@resend.dev>'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  })
  return response.ok
}

export function buildUnsubscribeUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${base}/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`
}
