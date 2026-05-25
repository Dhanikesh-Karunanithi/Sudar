import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient, getUserFromBearerToken } from '@/lib/supabase/server'

export type RequestSession = {
  user: User
  accessToken: string
}

/**
 * Resolve Supabase user + access token from Bearer JWT (MCP, API clients) or cookies (browser).
 */
export async function getRequestSession(request: NextRequest): Promise<RequestSession | null> {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (bearer && bearer.includes('.')) {
    const user = await getUserFromBearerToken(bearer)
    if (user) {
      return { user, accessToken: bearer }
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (user && session?.access_token) {
    return { user, accessToken: session.access_token }
  }
  return null
}
