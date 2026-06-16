import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { fetchWithDeadline } from '@/lib/fetch-with-deadline'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl?.trim() || !anonKey?.trim()) {
    return new NextResponse(
      'Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (get anon key from Supabase Dashboard → Project Settings → API).',
      { status: 503, headers: { 'Content-Type': 'text/plain' } }
    )
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        fetch: fetchWithDeadline(),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must not use getSession() here, always getUser()
  let user: User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) user = data.user ?? null
  } catch {
    user = null
  }

  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/signup', '/auth/callback']
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))
  /** SudarVid render proxy sets auth via HttpOnly cookie (iframe loads often omit session cookies). */
  const delegatesAuth = pathname.startsWith('/api/studio/ai/generate-video/render/')

  if (!user && !isPublicPath && !delegatesAuth) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  const onboardingExempt =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/onboarding') ||
    isPublicPath ||
    delegatesAuth

  if (user && !onboardingExempt) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile && profile.onboarding_complete !== true) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/onboarding'
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (user && pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()
    if (profile?.onboarding_complete === true) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
