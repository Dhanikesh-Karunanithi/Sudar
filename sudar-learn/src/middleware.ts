import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { isLearnApiDelegatedAuthPath, isLearnPublicPath } from '@/lib/security/learnPublicPaths'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicPath = isLearnPublicPath(pathname)
  const delegatesAuth = isLearnApiDelegatedAuthPath(pathname)

  if (!user && !isPublicPath && !delegatesAuth) {
    // API callers (fetch, integrations) expect JSON errors — not HTML login redirects.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  const onboardingExempt =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/tutor/memory') ||
    isPublicPath ||
    delegatesAuth

  if (user && !onboardingExempt && !pathname.startsWith('/api/')) {
    const { data: learnerProfile } = await supabase
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user.id)
      .maybeSingle()

    const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}
    const onboardingDone = memory.onboarding_complete === 'true'
    const skipCount = Number(memory.onboarding_skip_count ?? 0)
    const deferred = request.cookies.get('sudar_onboarding_skip')?.value === '1'

    if (!onboardingDone) {
      if (skipCount >= 3 || !deferred) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  }

  if (user && pathname.startsWith('/onboarding')) {
    const { data: learnerProfile } = await supabase
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user.id)
      .maybeSingle()
    const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}
    if (memory.onboarding_complete === 'true') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
