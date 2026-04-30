import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import type { Database } from '@/types/database'
import {
  buildUnsubscribeUrl,
  sendEmailNotification,
} from '../../../../../../../../shared/notifications/channels/email'
import { createUnsubscribeToken } from '../../../../../../../../shared/notifications/unsubscribeToken'

type NotificationDeliveryInsert = Database['public']['Tables']['notification_delivery_log']['Insert']

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => vars[key] ?? '')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await requireOrgAdmin(user.id).catch(() => null)
  if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json().catch(() => ({}))) as { template_id?: string; vars?: Record<string, string> }
  if (!body.template_id) return NextResponse.json({ error: 'template_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: template, error } = await admin
    .from('notification_templates')
    .select('id, org_id, category_slug, title_mustache, body_mustache, cta_label, cta_url_mustache, channels')
    .eq('id', body.template_id)
    .or(`org_id.eq.${orgId},org_id.is.null`)
    .single()
  if (error || !template) return NextResponse.json({ error: error?.message ?? 'Template not found' }, { status: 404 })

  const vars = {
    learner_name: 'Test Learner',
    course_id: '',
    path_id: '',
    mission_slug: '',
    modality: '',
    prompt: '',
    ...(body.vars ?? {}),
  }

  const title = renderTemplate(template.title_mustache, vars)
  const bodyText = renderTemplate(template.body_mustache ?? '', vars)
  const ctaUrl = renderTemplate(template.cta_url_mustache ?? '/notifications', vars)

  await admin.from('user_notifications').insert({
    user_id: user.id,
    category: template.category_slug,
    title,
    body: bodyText || null,
    link_url: ctaUrl || null,
    metadata: { source: 'campaign_test', template_id: template.id },
  })

  const channelList = (template.channels as string[]) ?? ['in_app']
  if (channelList.includes('email')) {
    const auth = await admin.auth.admin.getUserById(user.id)
    const email = auth.data?.user?.email
    if (email) {
      const unsub = buildUnsubscribeUrl(createUnsubscribeToken(user.id))
      await sendEmailNotification({
        to: email,
        subject: title,
        html: `<p>${bodyText}</p><p><a href="${ctaUrl}">${template.cta_label ?? 'Open in Sudar'}</a></p><p style="font-size:12px;color:#667085">Unsubscribe: <a href="${unsub}">manage notifications</a></p>`,
      })
    }
  }

  const deliveryLog: NotificationDeliveryInsert = {
    user_id: user.id,
    template_id: template.id,
    category_slug: template.category_slug,
    channel: 'in_app',
    status: 'sent',
    sent_at: new Date().toISOString(),
    metadata: { source: 'campaign_test' },
  }

  await admin.from('notification_delivery_log').insert(deliveryLog)

  return NextResponse.json({ ok: true, preview: { title, body: bodyText, ctaUrl } })
}
