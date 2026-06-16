import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'

const bodySchema = z.object({
  workspaceName: z.string().min(2).max(120),
  inviteEmails: z.array(z.string().email()).max(10).optional(),
  inviteRole: z.enum(['LEARNER', 'CREATOR', 'MANAGER', 'ADMIN']).optional(),
  firstCourseType: z.enum(['blank', 'ai', 'scorm', 'template']).optional(),
  requireContentApproval: z.boolean().optional(),
  requireLearnerConsent: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  const slugBase = body.workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const slug = `${slugBase || 'workspace'}-${orgId.slice(0, 6)}`

  const { data: orgRow } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  const existingSettings = (orgRow?.settings as Record<string, unknown>) ?? {}
  const aiCompliance = (existingSettings.ai_compliance as Record<string, unknown>) ?? {}

  const nextSettings = {
    ...existingSettings,
    studio_onboarding: {
      first_course_type: body.firstCourseType ?? 'blank',
      completed_at: new Date().toISOString(),
    },
    ai_compliance: {
      ...aiCompliance,
      require_learner_consent: body.requireLearnerConsent ?? aiCompliance.require_learner_consent ?? false,
      content_approval_required: body.requireContentApproval ?? aiCompliance.content_approval_required ?? false,
    },
  }

  await admin
    .from('organisations')
    .update({ name: body.workspaceName.trim(), slug, settings: nextSettings })
    .eq('id', orgId)

  const inviteRole = body.inviteRole ?? 'CREATOR'
  for (const email of body.inviteEmails ?? []) {
    const normalized = email.toLowerCase().trim()
    if (!normalized || normalized === user.email?.toLowerCase()) continue
    const { error: inviteConflict } = await admin.from('org_invites').insert({
      org_id: orgId,
      email: normalized,
      role: inviteRole,
    })
    if (inviteConflict && !inviteConflict.message.includes('duplicate')) {
      /* ignore duplicate invites */
    }
  }

  await admin.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)

  return NextResponse.json({
    success: true,
    data: {
      orgId,
      firstCoursePath:
        body.firstCourseType === 'ai'
          ? '/courses/new?mode=ai'
          : body.firstCourseType === 'scorm'
            ? '/courses/new?mode=scorm'
            : body.firstCourseType === 'template'
              ? '/courses/new?mode=template'
              : '/courses/new',
    },
  })
}
