import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SEARCH_DIRS = ['sudar-learn/src', 'sudar-studio/src']

/** Current name + legacy alias (rename left some docs referring to createAdminClient). */
const SERVICE_ROLE_CALL_RE =
  /\b(?:createServiceRoleSupabaseClient|createAdminClient)\s*\(/g

const AUTH_HELPERS = [
  'requireOrgAdmin',
  'requireOrgContentEditor',
  'requireSuperAdmin',
  'rejectInvalidCronRequest',
  'rejectAlpUserOutsideOrg',
  'canLearnerAccessScormPath',
  'canStudioUserAccessScormPath',
  'canUserAccessSudarVidJob',
  'canUserAccessCourseModule',
  'rejectCrossSiteRequest',
  'verifyUnsubscribeToken',
  'verifyNotificationTrackingToken',
  'validateAlpKey',
  'getRequestSession',
  'requireLearnerMatch',
]

/** Definition files export the helper; they are not privileged callsites. */
const DEFINITION_FILES = new Set([
  'sudar-learn/src/lib/supabase/server.ts',
  'sudar-studio/src/lib/supabase/server.ts',
])

function walk(dir) {
  const entries = []
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '.git') continue
    const full = path.join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) entries.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(name)) entries.push(full)
  }
  return entries
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/')
}

const findings = []

for (const searchDir of SEARCH_DIRS) {
  const absolute = path.join(ROOT, searchDir)
  for (const file of walk(absolute)) {
    const rel = relative(file)
    if (DEFINITION_FILES.has(rel)) continue

    const text = readFileSync(file, 'utf8')
    const matches = text.match(SERVICE_ROLE_CALL_RE)
    if (!matches || matches.length === 0) continue

    const helpers = AUTH_HELPERS.filter((helper) => text.includes(helper))
    const hasUserCheck = text.includes('auth.getUser()') || text.includes('getUser()')
    const hasIntegrationKeyCheck = text.includes('validateAlpKey')
    const hasCronCheck = text.includes('rejectInvalidCronRequest')
    const hasBearerSession = text.includes('getRequestSession')

    findings.push({
      file: rel,
      callCount: matches.length,
      helpers,
      hasUserCheck,
      hasIntegrationKeyCheck,
      hasCronCheck,
      hasBearerSession,
      needsReview: helpers.length === 0 && !hasCronCheck && !hasIntegrationKeyCheck,
    })
  }
}

findings.sort((a, b) => a.file.localeCompare(b.file))

const needsReview = findings.filter((finding) => finding.needsReview)
const strict = process.env.SECURITY_AUDIT_STRICT === '1'

console.log(`Service-role callsites: ${findings.length}`)
console.log(`Needs manual authZ review: ${needsReview.length}`)
console.log(
  `Matcher: createServiceRoleSupabaseClient() | createAdminClient() (legacy)`
)
if (!strict) {
  console.log(
    'Note: exit 0 unless SECURITY_AUDIT_STRICT=1 (set in CI once the REVIEW queue is triageable).'
  )
}

for (const finding of findings) {
  const marker = finding.needsReview ? 'REVIEW' : 'OK'
  const helpers = finding.helpers.length ? ` helpers=${finding.helpers.join(',')}` : ''
  const signals = [
    finding.hasUserCheck ? 'user' : null,
    finding.hasIntegrationKeyCheck ? 'integration-key' : null,
    finding.hasCronCheck ? 'cron' : null,
    finding.hasBearerSession ? 'bearer-session' : null,
  ].filter(Boolean)
  console.log(
    `${marker} ${finding.file} calls=${finding.callCount}${helpers}${signals.length ? ` signals=${signals.join(',')}` : ''}`
  )
}

if (findings.length === 0) {
  console.error(
    'ERROR: zero service-role callsites found — matcher is likely stale (last failure mode: grepping createAdminClient only).'
  )
  process.exitCode = 1
} else if (strict && needsReview.length > 0) {
  process.exitCode = 1
}
