#!/usr/bin/env node
/**
 * Smoke-check production Learn/Studio domains: HTTPS, login page, auth redirect, security headers.
 *
 * Usage: node scripts/verify-production-domains.mjs
 * Exit 0 when all checks pass; 1 otherwise.
 */

const CHECKS = [
  {
    name: 'Learn production',
    base: 'https://learn.thesudar.com',
    loginPath: '/login',
    protectedRedirect: '/',
  },
  {
    name: 'Studio production',
    base: 'https://studio.thesudar.com',
    loginPath: '/login',
    protectedRedirect: '/',
  },
  {
    name: 'Learn Vercel staging',
    base: 'https://sudar-learn.vercel.app',
    loginPath: '/login',
    protectedRedirect: '/',
  },
  {
    name: 'Studio Vercel staging',
    base: 'https://sudar-studio.vercel.app',
    loginPath: '/login',
    protectedRedirect: '/',
  },
]

const REQUIRED_HEADERS = ['strict-transport-security', 'x-content-type-options']

async function fetchMeta(url, { redirect = 'follow' } = {}) {
  const res = await fetch(url, { redirect, method: 'GET' })
  return { status: res.status, headers: res.headers, url: res.url }
}

async function runCheck(spec) {
  const failures = []
  const loginUrl = `${spec.base}${spec.loginPath}`
  const homeUrl = `${spec.base}${spec.protectedRedirect}`

  try {
    const login = await fetchMeta(loginUrl)
    if (login.status !== 200) {
      failures.push(`login ${loginUrl} returned ${login.status} (expected 200)`)
    }
    for (const header of REQUIRED_HEADERS) {
      if (!login.headers.get(header)) {
        failures.push(`login missing ${header}`)
      }
    }

    const home = await fetchMeta(homeUrl, { redirect: 'manual' })
    if (home.status !== 307 && home.status !== 302 && home.status !== 308) {
      failures.push(`unauthenticated ${homeUrl} returned ${home.status} (expected redirect to login)`)
    } else {
      const location = home.headers.get('location') ?? ''
      if (!location.includes('/login')) {
        failures.push(`unauthenticated redirect location missing /login (${location})`)
      }
    }

    const forgotUrl = `${spec.base}/forgot-password`
    if (spec.base.includes('learn')) {
      const forgot = await fetchMeta(forgotUrl, { redirect: 'manual' })
      if (forgot.status === 307 || forgot.status === 302) {
        const location = forgot.headers.get('location') ?? ''
        if (location.includes('/login')) {
          failures.push(`forgot-password incorrectly redirects to login (${forgotUrl})`)
        }
      } else if (forgot.status !== 200) {
        failures.push(`forgot-password ${forgotUrl} returned ${forgot.status} (expected 200)`)
      }
    }
  } catch (err) {
    failures.push(err instanceof Error ? err.message : String(err))
  }

  return { name: spec.name, failures }
}

async function main() {
  let failed = false
  for (const spec of CHECKS) {
    const result = await runCheck(spec)
    if (result.failures.length === 0) {
      console.log(`OK  ${result.name}`)
    } else {
      failed = true
      console.log(`FAIL ${result.name}`)
      for (const msg of result.failures) console.log(`     - ${msg}`)
    }
  }
  process.exit(failed ? 1 : 0)
}

main()
