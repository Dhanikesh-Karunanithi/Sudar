import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/org'
import { PROVIDER_KEYS, isKeyConfigured } from '@/lib/ai/providerConfig'

/**
 * GET /api/settings/keys-status — Returns which env vars are configured (no values).
 * Admin/Manager only. Used by the AI & API Keys page.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const keys = PROVIDER_KEYS.map((k) => {
    const value = process.env[k.envVar]
    const status = isKeyConfigured(value) ? 'configured' : 'not_set'
    return {
      id: k.id,
      name: k.name,
      envVar: k.envVar,
      category: k.category,
      status,
      signupUrl: k.signupUrl,
      steps: k.steps,
      description: k.description,
    }
  })

  return NextResponse.json({ keys })
}
