import { describe, expect, it, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { courseIdFromScormPath, canLearnerAccessScormPath, normalizeStoragePath } from '@/lib/security/scormAccess'
import {
  isSafeSudarVidJobId,
  normalizeRenderAssetPath,
} from '@/lib/security/sudarVidAccess'
import { rejectCrossSiteRequest } from '@/lib/security/sameOrigin'
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from '../../../../shared/notifications/unsubscribeToken'
import {
  createNotificationTrackingToken,
  verifyNotificationTrackingToken,
} from '../../../../shared/notifications/trackingToken'

describe('SCORM storage path helpers', () => {
  it('normalizes safe paths and rejects traversal', () => {
    expect(normalizeStoragePath(['scorm-packages', 'course-1', 'index.html'])).toBe(
      'scorm-packages/course-1/index.html',
    )
    expect(normalizeStoragePath(['scorm-packages', '..', 'secret.html'])).toBeNull()
  })

  it('extracts course id only from SCORM package paths', () => {
    expect(courseIdFromScormPath('scorm-packages/course-1/index.html')).toBe('course-1')
    expect(courseIdFromScormPath('course-media/course-1/index.html')).toBeNull()
  })
})

type ScormFixture = {
  enrollments: Array<{ user_id: string; course_id: string }>
  courses: Array<{ id: string; org_id: string | null; status: string }>
  orgMembers: Array<{ org_id: string; user_id: string; role: string }>
}

function mockScormAdmin(fixture: ScormFixture) {
  const tables: Record<string, Array<Record<string, string>>> = {
    enrollments: fixture.enrollments.map((row, i) => ({ id: `enr-${i}`, ...row })),
    courses: fixture.courses.map((row) => ({ ...row })),
    org_members: fixture.orgMembers.map((row, i) => ({ id: `mem-${i}`, ...row })),
  }

  return {
    from(table: string) {
      const rows = tables[table] ?? []
      const filters: Array<{ column: string; value: string }> = []
      const builder = {
        select() {
          return builder
        },
        eq(column: string, value: string) {
          filters.push({ column, value })
          return builder
        },
        async maybeSingle() {
          const match = rows.find((row) =>
            filters.every((f) => row[f.column] === f.value),
          )
          return { data: match ?? null }
        },
      }
      return builder
    },
  }
}

describe('canLearnerAccessScormPath', () => {
  const path = 'scorm-packages/course-1/index.html'
  const courseId = 'course-1'
  const orgId = 'org-1'

  it('allows enrolled learners', async () => {
    const admin = mockScormAdmin({
      enrollments: [{ user_id: 'learner-1', course_id: courseId }],
      courses: [],
      orgMembers: [],
    })
    await expect(canLearnerAccessScormPath(admin, 'learner-1', path)).resolves.toBe(true)
  })

  it('denies org learners without enrollment', async () => {
    const admin = mockScormAdmin({
      enrollments: [],
      courses: [{ id: courseId, org_id: orgId, status: 'published' }],
      orgMembers: [{ org_id: orgId, user_id: 'learner-1', role: 'LEARNER' }],
    })
    await expect(canLearnerAccessScormPath(admin, 'learner-1', path)).resolves.toBe(false)
  })

  it('allows org content editors to preview published courses without enrollment', async () => {
    const admin = mockScormAdmin({
      enrollments: [],
      courses: [{ id: courseId, org_id: orgId, status: 'published' }],
      orgMembers: [{ org_id: orgId, user_id: 'creator-1', role: 'CREATOR' }],
    })
    await expect(canLearnerAccessScormPath(admin, 'creator-1', path)).resolves.toBe(true)
  })

  it('allows org content editors to preview draft courses without enrollment', async () => {
    const admin = mockScormAdmin({
      enrollments: [],
      courses: [{ id: courseId, org_id: orgId, status: 'draft' }],
      orgMembers: [{ org_id: orgId, user_id: 'admin-1', role: 'ADMIN' }],
    })
    await expect(canLearnerAccessScormPath(admin, 'admin-1', path)).resolves.toBe(true)
  })

  it('denies users outside the course org', async () => {
    const admin = mockScormAdmin({
      enrollments: [],
      courses: [{ id: courseId, org_id: orgId, status: 'published' }],
      orgMembers: [],
    })
    await expect(canLearnerAccessScormPath(admin, 'outsider-1', path)).resolves.toBe(false)
  })
})

describe('SudarVid access helpers', () => {
  it('accepts bounded opaque job ids and rejects unsafe values', () => {
    expect(isSafeSudarVidJobId('job_abc-123456')).toBe(true)
    expect(isSafeSudarVidJobId('../job')).toBe(false)
    expect(isSafeSudarVidJobId('short')).toBe(false)
  })

  it('normalizes render asset paths and rejects traversal', () => {
    expect(normalizeRenderAssetPath(['slides', 'index.html'])).toBe('slides/index.html')
    expect(normalizeRenderAssetPath(['slides', '..', 'secrets.json'])).toBeNull()
  })
})

describe('same-origin request guard', () => {
  it('allows same-origin requests', () => {
    const request = new NextRequest('https://learn.example.com/api/test', {
      headers: { origin: 'https://learn.example.com' },
    })
    expect(rejectCrossSiteRequest(request)).toBeNull()
  })

  it('rejects cross-site browser requests', () => {
    const request = new NextRequest('https://learn.example.com/api/test', {
      headers: {
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
      },
    })
    expect(rejectCrossSiteRequest(request)?.status).toBe(403)
  })
})

describe('signed notification tokens', () => {
  const oldUnsubscribeSecret = process.env.NOTIFICATION_UNSUBSCRIBE_SECRET
  const oldLinkSecret = process.env.NOTIFICATION_LINK_SIGNING_SECRET

  afterEach(() => {
    if (oldUnsubscribeSecret === undefined) delete process.env.NOTIFICATION_UNSUBSCRIBE_SECRET
    else process.env.NOTIFICATION_UNSUBSCRIBE_SECRET = oldUnsubscribeSecret

    if (oldLinkSecret === undefined) delete process.env.NOTIFICATION_LINK_SIGNING_SECRET
    else process.env.NOTIFICATION_LINK_SIGNING_SECRET = oldLinkSecret
  })

  it('round-trips unsubscribe tokens with a dedicated secret', () => {
    process.env.NOTIFICATION_UNSUBSCRIBE_SECRET = 'test-unsubscribe-secret'
    const token = createUnsubscribeToken('user-1')
    expect(verifyUnsubscribeToken(token)).toEqual({ valid: true, userId: 'user-1' })
  })

  it('rejects tampered unsubscribe tokens', () => {
    process.env.NOTIFICATION_UNSUBSCRIBE_SECRET = 'test-unsubscribe-secret'
    const token = createUnsubscribeToken('user-1')
    expect(verifyUnsubscribeToken(`${token}tampered`)).toEqual({
      valid: false,
      reason: 'invalid_signature',
    })
  })

  it('round-trips notification tracking tokens', () => {
    process.env.NOTIFICATION_LINK_SIGNING_SECRET = 'test-link-secret'
    const token = createNotificationTrackingToken('notification-1', 'click')
    expect(verifyNotificationTrackingToken(token)).toEqual({
      valid: true,
      notificationId: 'notification-1',
      event: 'click',
    })
  })
})
