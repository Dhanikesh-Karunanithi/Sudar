/**
 * Authenticated web + image search for tutor resource previews (used by dev tools or future UI).
 * Gated by org ai_compliance + TUTOR_WEB_ENRICHMENT_ENABLED. Rate-limited with generic AI bucket.
 */
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAndIncrementUsage } from '@/lib/usage-limits'
import { parseOrgAiCompliance } from '@/types/personalization'
import {
  searchImagesForTutor,
  searchWebForTutor,
} from '@/lib/tutor/webResources'

function isWebEnrichmentEnabledForUserOrg(settings: unknown): boolean {
  const o = parseOrgAiCompliance(settings)
  if (o.tutor_web_enrichment_enabled === false) return false
  if (o.tutor_web_enrichment_enabled === true) return true
  return process.env.TUTOR_WEB_ENRICHMENT_ENABLED === 'true'
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = z.string().trim().min(2).max(200).safeParse(searchParams.get('q'))
  if (!q.success) {
    return NextResponse.json({ error: 'q required (2–200 chars)' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: prof } = await admin.from('profiles').select('org_id').eq('id', user.id).maybeSingle()
  if (prof?.org_id) {
    const { data: orgRow } = await admin.from('organisations').select('settings').eq('id', prof.org_id).maybeSingle()
    if (!isWebEnrichmentEnabledForUserOrg(orgRow?.settings)) {
      return NextResponse.json({ error: 'Web enrichment is disabled for this organization.' }, { status: 403 })
    }
  } else if (!isWebEnrichmentEnabledForUserOrg({})) {
    return NextResponse.json({ error: 'Web enrichment is not enabled.' }, { status: 403 })
  }

  const usage = await checkAndIncrementUsage(admin, user.id, 'generic')
  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Daily limit (${usage.limit}) reached. Try again tomorrow.` },
      { status: 429 },
    )
  }

  const query = q.data
  const [web, images] = await Promise.all([searchWebForTutor(query, 5), searchImagesForTutor(query, 5)])

  return NextResponse.json({
    web: web.map((r) => ({ title: r.title, link: r.link, snippet: r.snippet })),
    images: images.map((r) => ({
      url: r.url,
      thumbnailUrl: r.thumbnailUrl,
      alt: r.alt,
      attribution: r.attribution,
    })),
  })
}
