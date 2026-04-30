import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/org'
import { rejectCrossSiteRequest } from '@/lib/security/sameOrigin'
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

const CONFIRMATION = 'PURGE_USERS'

function purgeEnabled(): boolean {
  return process.env.ENABLE_DANGEROUS_ADMIN_TOOLS === 'true'
}

function keepEmail(): string | null {
  return process.env.PURGE_KEEP_EMAIL?.trim().toLowerCase() || null
}

/**
 * GET /api/admin/purge-users — Renders a simple page with a button to run the purge (POST).
 * POST /api/admin/purge-users — Deletes all Auth users except the keeper email.
 */
export async function GET() {
  if (!purgeEnabled()) return new NextResponse('Not found', { status: 404 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(
      '<html><body><p>Unauthorized. <a href="/login">Log in</a> first, then open this page again.</p></body></html>',
      { status: 401, headers: { 'Content-Type': 'text/html' } }
    )
  }

  try {
    await requireSuperAdmin(user.id)
  } catch {
    return new NextResponse(
      '<html><body><p>Forbidden. Only super admins can run this.</p></body></html>',
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const keeper = keepEmail()
  if (!keeper) {
    return new NextResponse(
      '<html><body><p>Disabled. Set PURGE_KEEP_EMAIL before using this local-only tool.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Purge users</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:2rem auto;padding:1rem;">
  <h1>Purge all users</h1>
  <p>This local-only dangerous tool will delete every Supabase Auth user except <strong>${keeper}</strong> and clean up selected related rows.</p>
  <p>Type <code>${CONFIRMATION}</code> to confirm.</p>
  <form method="POST" action="/api/admin/purge-users">
    <input name="confirmation" autocomplete="off" required style="display:block;width:100%;padding:0.5rem;margin-bottom:1rem;" />
    <button type="submit" style="padding:0.5rem 1rem;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;">Purge all other users</button>
  </form>
</body>
</html>`
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function POST(request: NextRequest) {
  if (!purgeEnabled()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const originError = rejectCrossSiteRequest(request)
  if (originError) return originError

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await requireSuperAdmin(user.id)
  } catch {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const keeper = keepEmail()
  if (!keeper) {
    return NextResponse.json({ success: false, error: 'PURGE_KEEP_EMAIL is not configured' }, { status: 503 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  const confirmation = contentType.includes('application/json')
    ? (await request.json().catch(() => ({} as Record<string, unknown>))).confirmation
    : (await request.formData().catch(() => new FormData())).get('confirmation')

  if (confirmation !== CONFIRMATION) {
    return NextResponse.json({ success: false, error: `Type ${CONFIRMATION} to confirm` }, { status: 400 })
  }

  const admin = createAdminClient()

  const allUsers: User[] = []
  for (let page = 1; ; page += 1) {
    const { data: authList, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (listError) {
      return NextResponse.json(
        { success: false, error: `Failed to list users: ${listError.message}` },
        { status: 500 }
      )
    }
    const users = authList?.users ?? []
    allUsers.push(...users)
    if (users.length < 1000) break
  }

  const toDelete = allUsers.filter((u) => (u.email ?? '').toLowerCase() !== keeper)

  // Clean up relational data before removing auth.users
  const deleteIds = toDelete.map((u) => u.id)

  if (deleteIds.length > 0) {
    // org_members
    await admin.from('org_members').delete().in('user_id', deleteIds)
    // learner_profiles (linked by user_id → profiles.id)
    await admin.from('learner_profiles').delete().in('user_id', deleteIds)
    // profiles
    await admin.from('profiles').delete().in('id', deleteIds)
    // org_invites (by email)
    const deleteEmails = toDelete.map((u) => u.email).filter((e): e is string => !!e)
    if (deleteEmails.length > 0) {
      await admin.from('org_invites').delete().in('email', deleteEmails)
    }
  }

  // Delete from auth.users last
  const failures: { id: string; email: string | null; error: string }[] = []

  for (const u of toDelete) {
    const { error } = await admin.auth.admin.deleteUser(u.id)
    if (error) {
      failures.push({ id: u.id, email: u.email ?? null, error: error.message })
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    totalUsers: allUsers.length,
    deletedCount: toDelete.length - failures.length,
    keptEmail: keeper,
    failures,
  })
}

