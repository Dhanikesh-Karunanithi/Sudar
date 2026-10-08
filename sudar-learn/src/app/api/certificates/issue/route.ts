/**
 * Certificate Issuance
 * Called after all mandatory courses in a path are completed.
 * Generates a unique verification code and stores a Certification record.
 */

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const { path_id } = await request.json()
  if (!path_id) return NextResponse.json({ error: 'path_id required' }, { status: 400 })

  // Load path
  const { data: path } = await admin
    .from('learning_paths')
    .select('id, title, issues_certificate, courses, is_mandatory')
    .eq('id', path_id)
    .single()

  if (!path) return NextResponse.json({ error: 'Path not found' }, { status: 404 })
  if (!path.issues_certificate) return NextResponse.json({ error: 'Path does not issue certificates' }, { status: 400 })

  const { data: pathEnrollment } = await admin
    .from('enrollments')
    .select('personalized_sequence')
    .eq('user_id', user.id)
    .eq('path_id', path_id)
    .maybeSingle()

  if (!pathEnrollment) {
    return NextResponse.json({ error: 'Not enrolled in this path' }, { status: 403 })
  }

  const seq = (pathEnrollment.personalized_sequence as Array<{ course_id: string; is_mandatory: boolean }> | null)
    ?? (path.courses as Array<{ course_id: string; is_mandatory: boolean }> | null)
    ?? []
  const mandatoryCourseIds = seq.filter((c) => c.is_mandatory).map((c) => c.course_id)

  if (mandatoryCourseIds.length > 0) {
    const { data: mandatoryStatuses } = await admin
      .from('enrollments')
      .select('course_id, status')
      .eq('user_id', user.id)
      .in('course_id', mandatoryCourseIds)

    const allDone = mandatoryCourseIds.every(
      (cid) => mandatoryStatuses?.find((e) => e.course_id === cid)?.status === 'completed',
    )

    if (!allDone) {
      return NextResponse.json({ error: 'Mandatory courses not completed' }, { status: 403 })
    }
  }

  // Check existing cert
  const { data: existing } = await admin
    .from('certifications')
    .select('id, verification_code')
    .eq('user_id', user.id)
    .eq('path_id', path_id)
    .single()

  if (existing) return NextResponse.json({ verification_code: existing.verification_code })

  // Get learner name and org name
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, org_id:org_members(org:organisations(name))')
    .eq('id', user.id)
    .single()

  interface OrgMember { org: { name: string } | null }
  const orgMembers = (profile as unknown as { org_id: OrgMember[] })?.org_id
  const orgName = orgMembers?.[0]?.org?.name ?? 'Sudar'
  const recipientName = (profile as { full_name?: string })?.full_name ?? 'Learner'

  const verificationCode = randomBytes(16).toString('hex')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  const certificateUrl = `${baseUrl}/cert/${verificationCode}`

  const { data: cert, error } = await admin
    .from('certifications')
    .insert({
      user_id: user.id,
      path_id,
      verification_code: verificationCode,
      certificate_url: certificateUrl,
      recipient_name: recipientName,
      path_title: path.title,
      org_name: orgName,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log event
  await admin.from('learning_events').insert({
    user_id: user.id,
    event_type: 'certificate_issued',
    payload: { path_id, path_title: path.title, verification_code: verificationCode },
  })

  return NextResponse.json({ verification_code: verificationCode, certificate_url: certificateUrl, cert }, { status: 201 })
}
