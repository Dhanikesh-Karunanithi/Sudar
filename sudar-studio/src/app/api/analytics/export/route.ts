import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { z } from 'zod'

const exportQuerySchema = z.object({
  scope: z.enum(['overview', 'risk', 'course']).default('overview'),
  course_id: z.string().uuid().optional(),
  days: z.coerce.number().int().min(1).max(90).default(30),
})

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_ANALYTICS_ENGINE === 'false') {
    return NextResponse.json({ success: false, error: 'Analytics engine disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = exportQuerySchema.safeParse({
    scope: request.nextUrl.searchParams.get('scope') ?? 'overview',
    course_id: request.nextUrl.searchParams.get('course_id') ?? undefined,
    days: request.nextUrl.searchParams.get('days') ?? 30,
  })
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })

  const { scope, course_id: courseId, days } = parsed.data
  const orgId = await getOrCreateOrg(user.id)
  const admin = createServiceRoleSupabaseClient()
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  let rows: Record<string, unknown>[] = []
  if (scope === 'overview') {
    const { data } = await admin
      .from('analytics_org_rollup')
      .select('*')
      .eq('org_id', orgId)
      .gte('event_date', since)
      .order('event_date', { ascending: true })
    rows = data ?? []
  } else if (scope === 'risk') {
    const { data } = await admin
      .from('analytics_risk_signals')
      .select('*')
      .eq('org_id', orgId)
      .gte('as_of_date', since)
      .order('as_of_date', { ascending: true })
    rows = data ?? []
  } else {
    if (!courseId) return NextResponse.json({ success: false, error: 'course_id required for course scope' }, { status: 400 })
    const { data } = await admin
      .from('analytics_daily_course')
      .select('*')
      .eq('org_id', orgId)
      .eq('course_id', courseId)
      .gte('event_date', since)
      .order('event_date', { ascending: true })
    rows = data ?? []
  }

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const csv = [headers.join(',')]
  for (const row of rows) {
    csv.push(headers.map((h) => escapeCsv((row as Record<string, unknown>)[h] as string | number | null)).join(','))
  }

  return new NextResponse(csv.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sudar-analytics-${scope}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
