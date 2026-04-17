import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const KEEP_EMAIL = 'dhanikesh.karunanithi@foundever.com'

/**
 * GET /api/admin/purge-users — Renders a simple page with a button to run the purge (POST).
 * POST /api/admin/purge-users — Deletes all Auth users except the keeper email.
 */
export async function GET() {
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

  if ((user.email ?? '').toLowerCase() !== KEEP_EMAIL.toLowerCase()) {
    return new NextResponse(
      '<html><body><p>Forbidden. Only the keeper account can run this.</p></body></html>',
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Purge users</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:2rem auto;padding:1rem;">
  <h1>Purge all users</h1>
  <p>This will delete every Supabase Auth user except <strong>${KEEP_EMAIL}</strong> and clean up related rows (profiles, org_members, learner_profiles, org_invites).</p>
  <form method="POST" action="/api/admin/purge-users">
    <button type="submit" style="padding:0.5rem 1rem;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;">Purge all other users</button>
  </form>
</body>
</html>`
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if ((user.email ?? '').toLowerCase() !== KEEP_EMAIL.toLowerCase()) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Fetch all auth users via service-role client
  const { data: authList, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json(
      { success: false, error: `Failed to list users: ${listError.message}` },
      { status: 500 }
    )
  }

  const allUsers = authList?.users ?? []

  const keepEmailLower = KEEP_EMAIL.toLowerCase()
  const toDelete = allUsers.filter((u) => (u.email ?? '').toLowerCase() !== keepEmailLower)

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
    keptEmail: KEEP_EMAIL,
    failures,
  })
}

