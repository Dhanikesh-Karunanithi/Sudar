import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getProviderAdapter, resolveExternalMetadata } from '@/lib/providers'
import { importExternalCourseRecord } from '@/lib/external/importExternalCourse'
import { suggestExternalCourseTags } from '@/lib/ai/suggestExternalCourseTags'
import { fetchOrgTagCatalog } from '@/lib/courseTags'

const manualSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  external_url: z.string().url(),
  embed_url: z.string().url().optional().nullable(),
  instructor: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  estimated_duration_mins: z.number().int().positive().optional().nullable(),
  topics: z.array(z.string()).optional(),
  sections: z.array(z.object({ title: z.string() })).optional(),
  requires_sign_in: z.boolean().optional(),
  sign_in_instructions: z.string().optional().nullable(),
})

const bodySchema = z.object({
  provider: z.enum(['youtube', 'khan', 'khan_academy', 'udemy', 'coursera', 'edx', 'manual']),
  provider_course_id: z.string().optional(),
  query: z.string().optional(),
  content_access_mode: z.enum(['iframe_only', 'tutor_access', 'both']).default('both'),
  allow_tutor_discussion: z.boolean().optional(),
  publish: z.boolean().default(true),
  org_tag_ids: z.array(z.string().uuid()).optional(),
  auto_tag: z.boolean().default(true),
  manual: manualSchema.optional(),
})

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(session.user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const body = parsed.data
  const admin = createServiceRoleSupabaseClient()

  try {
    const metadata = await resolveExternalMetadata(
      body.provider,
      body.provider_course_id ?? body.query,
      body.manual
        ? {
            title: body.manual.title,
            description: body.manual.description,
            externalUrl: body.manual.external_url,
            embedUrl: body.manual.embed_url,
            instructor: body.manual.instructor,
            difficulty: body.manual.difficulty,
            estimatedDurationMins: body.manual.estimated_duration_mins,
            topics: body.manual.topics,
            sections: body.manual.sections,
            requiresSignIn: body.manual.requires_sign_in,
            signInInstructions: body.manual.sign_in_instructions,
          }
        : undefined,
    )

    const result = await importExternalCourseRecord(admin, {
      orgId,
      userId: session.user.id,
      metadata,
      contentAccessMode: body.content_access_mode,
      allowTutorDiscussion: body.allow_tutor_discussion,
      publish: body.publish,
      orgTagIds: body.org_tag_ids,
      autoTag: body.auto_tag && !(body.org_tag_ids?.length),
      providerSlug: body.provider,
    })

    const learnUrl = process.env.NEXT_PUBLIC_LEARN_URL?.trim() || 'http://localhost:3001'
    let ragTriggered = false
    if (body.content_access_mode !== 'iframe_only') {
      try {
        const ingestRes = await fetch(`${learnUrl}/api/rag/ingest-external`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.INTERNAL_SERVICE_SECRET ?? ''}`,
          },
          body: JSON.stringify({ course_id: result.courseId }),
        })
        ragTriggered = ingestRes.ok
      } catch {
        ragTriggered = false
      }
    }

    return NextResponse.json({
      ok: true,
      course_id: result.courseId,
      module_id: result.moduleId,
      tag_ids: result.tagIds,
      sync_status: result.syncStatus,
      rag_triggered: ragTriggered,
      metadata,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await admin.from('external_course_sync_log' as 'courses').insert({
      org_id: orgId,
      provider: body.provider,
      status: 'error',
      error_msg: msg.slice(0, 500),
      courses_imported: 0,
    } as never)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/** Preview metadata + tag suggestions without importing */
export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(session.user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const provider = request.nextUrl.searchParams.get('provider') ?? 'manual'
  const providerCourseId = request.nextUrl.searchParams.get('provider_course_id') ?? ''
  const query = request.nextUrl.searchParams.get('query') ?? ''

  const admin = createServiceRoleSupabaseClient()

  if (query && provider !== 'manual') {
    const adapter = getProviderAdapter(provider)
    if (!adapter) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
    const results = await adapter.search(query)
    return NextResponse.json({ results })
  }

  if (!providerCourseId) {
    return NextResponse.json({ error: 'provider_course_id or query required' }, { status: 400 })
  }

  try {
    const metadata = await resolveExternalMetadata(provider, providerCourseId)
    const catalog = await fetchOrgTagCatalog(admin, orgId)
    const tagSuggestion = await suggestExternalCourseTags(metadata, catalog)
    return NextResponse.json({ metadata, tagSuggestion })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
