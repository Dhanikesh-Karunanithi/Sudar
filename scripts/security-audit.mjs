import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SEARCH_DIRS = ['sudar-learn/src', 'sudar-studio/src']

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
]

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
    const text = readFileSync(file, 'utf8')
    if (!text.includes('createAdminClient()')) continue

    const helpers = AUTH_HELPERS.filter((helper) => text.includes(helper))
    const hasUserCheck = text.includes('auth.getUser()') || text.includes('getUser()')
    const hasIntegrationKeyCheck = text.includes('validateAlpKey')
    const hasCronCheck = text.includes('rejectInvalidCronRequest')

    findings.push({
      file: relative(file),
      helpers,
      hasUserCheck,
      hasIntegrationKeyCheck,
      hasCronCheck,
      needsReview: helpers.length === 0 && !hasCronCheck && !hasIntegrationKeyCheck,
    })
  }
}

const needsReview = findings.filter((finding) => finding.needsReview)

console.log(`Service-role callsites: ${findings.length}`)
console.log(`Needs manual authZ review: ${needsReview.length}`)

for (const finding of findings) {
  const marker = finding.needsReview ? 'REVIEW' : 'OK'
  const helpers = finding.helpers.length ? ` helpers=${finding.helpers.join(',')}` : ''
  const signals = [
    finding.hasUserCheck ? 'user' : null,
    finding.hasIntegrationKeyCheck ? 'integration-key' : null,
    finding.hasCronCheck ? 'cron' : null,
  ].filter(Boolean)
  console.log(`${marker} ${finding.file}${helpers}${signals.length ? ` signals=${signals.join(',')}` : ''}`)
}

if (needsReview.length > 0) {
  process.exitCode = 1
}
