import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export type SessionCookie = {
  name: string
  value: string
  options?: CookieOptions
}

/** Collects Supabase auth cookies so they can be attached to redirect responses (required on Cloudflare Workers). */
export function createOAuthCallbackSupabase(
  request: NextRequest,
  sessionCookies: SessionCookie[]
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value)
            const existingIdx = sessionCookies.findIndex((c) => c.name === name)
            const entry: SessionCookie = { name, value, options }
            if (existingIdx >= 0) sessionCookies[existingIdx] = entry
            else sessionCookies.push(entry)
          }
        },
      },
    }
  )
}

export function applySessionCookies(
  response: NextResponse,
  sessionCookies: SessionCookie[]
): NextResponse {
  for (const { name, value, options } of sessionCookies) {
    response.cookies.set(name, value, options)
  }
  return response
}

export function redirectWithAuthCookies(
  url: string,
  sessionCookies: SessionCookie[],
  mutate?: (response: NextResponse) => void
): NextResponse {
  const response = NextResponse.redirect(url)
  applySessionCookies(response, sessionCookies)
  mutate?.(response)
  return response
}
