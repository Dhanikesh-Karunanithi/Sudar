/**
 * Compliance email reminders — at-risk and overdue assignments
 * Call via cron (e.g. daily) with CRON_SECRET to send reminder emails to learners.
 * Requires RESEND_API_KEY and optional RESEND_FROM (defaults to Resend sandbox).
 */
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const RESEND_API = 'https://api.resend.com/emails'

function statusFromDue(dueDate: string | null, completed: boolean): 'overdue' | 'at_risk' | null {
  if (completed) return null
  if (!dueDate) return null
  const due = new Date(dueDate).toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  if (due < today) return 'overdue'
  const daysUntil = Math.floor((new Date(due).getTime() - new Date(today).getTime()) / 86400000)
  if (daysUntil <= 7) return 'at_risk'
  return null
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? request.nextUrl.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not set. Configure Resend and set RESEND_FROM to a verified domain (or use onboarding@resend.dev for testing).' },
      { status: 501 }
    )
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  // Path enrollments with due dates (only path-based for compliance)
  const { data: enrollments } = await admin
    .from('enrollments')
    .select('id, user_id, path_id, status, progress_pct, due_date')
    .not('path_id', 'is', null)
    .not('due_date', 'is', null)

  const pathIds = [...new Set((enrollments ?? []).map((e) => e.path_id).filter(Boolean) as string[])]
  if (pathIds.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No path enrollments with due dates' })
  }

  const { data: paths } = await admin
    .from('learning_paths')
    .select('id, title')
    .in('id', pathIds)
  const pathTitleMap = new Map((paths ?? []).map((p) => [p.id, p.title]))

  const byUser: Map<string, { overdue: { path_title: string; due_date: string }[]; at_risk: { path_title: string; due_date: string }[] }> = new Map()
  for (const e of enrollments ?? []) {
    const status = statusFromDue(e.due_date, e.status === 'completed')
    if (!status || !e.path_id) continue
    const path_title = pathTitleMap.get(e.path_id) ?? 'Learning path'
    const due_date = e.due_date ? new Date(e.due_date).toLocaleDateString() : ''
    if (!byUser.has(e.user_id)) {
      byUser.set(e.user_id, { overdue: [], at_risk: [] })
    }
    const u = byUser.get(e.user_id)!
    if (status === 'overdue') u.overdue.push({ path_title, due_date })
    else u.at_risk.push({ path_title, due_date })
  }

  let sent = 0
  const from = process.env.RESEND_FROM ?? 'Sudar <onboarding@resend.dev>'

  for (const [userId, items] of byUser) {
    if (items.overdue.length === 0 && items.at_risk.length === 0) continue
    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    const email = authUser?.user?.email
    if (!email) continue

    const lines: string[] = []
    if (items.overdue.length > 0) {
      lines.push('Overdue:')
      items.overdue.forEach(({ path_title, due_date }) => lines.push(` • ${path_title} (due ${due_date})`))
    }
    if (items.at_risk.length > 0) {
      lines.push('Due soon (within 7 days):')
      items.at_risk.forEach(({ path_title, due_date }) => lines.push(` • ${path_title} (due ${due_date})`))
    }
    const subject = items.overdue.length > 0
      ? `Reminder: ${items.overdue.length} assignment(s) overdue`
      : `Reminder: ${items.at_risk.length} assignment(s) due soon`
    const html = `
      <p>This is a reminder from Sudar about your learning path assignments.</p>
      <ul>${[...items.overdue, ...items.at_risk].map(({ path_title, due_date }) => `<li><strong>${path_title}</strong> — due ${due_date}</li>`).join('')}</ul>
      <p>Log in to your learning dashboard to continue.</p>
      <p><em>Sudar — Learns with you, for you.</em></p>
    `.trim()

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: email, subject, html }),
    })
    if (res.ok) sent += 1
  }

  return NextResponse.json({ sent, total_recipients: byUser.size })
}
