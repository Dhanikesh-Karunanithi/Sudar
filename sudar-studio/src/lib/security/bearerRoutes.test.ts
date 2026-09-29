import { describe, expect, it } from 'vitest'

import { isBearerApiRoute, isSelfAuthenticatingApiRoute } from './bearerRoutes'

describe('isSelfAuthenticatingApiRoute', () => {
  it('covers cron, provisioning and render grant paths only', () => {
    expect(isSelfAuthenticatingApiRoute('/api/cron/analytics-rollups')).toBe(true)
    expect(isSelfAuthenticatingApiRoute('/api/org/provisioning/users')).toBe(true)
    expect(isSelfAuthenticatingApiRoute('/api/studio/ai/generate-video/render/job-1')).toBe(true)
    expect(isSelfAuthenticatingApiRoute('/api/org/settings')).toBe(false)
    expect(isSelfAuthenticatingApiRoute('/api/courses')).toBe(false)
  })
})

describe('isBearerApiRoute', () => {
  it('allows MCP course-build routes', () => {
    expect(isBearerApiRoute('/api/ai/generate-course')).toBe(true)
    expect(isBearerApiRoute('/api/ai/generate-outline')).toBe(true)
    expect(isBearerApiRoute('/api/courses')).toBe(true)
    expect(isBearerApiRoute('/api/courses/abc-123/export')).toBe(true)
    expect(isBearerApiRoute('/api/mcp/complete-oauth')).toBe(true)
  })

  it('rejects cookie-only routes', () => {
    expect(isBearerApiRoute('/api/courses/abc-123/publish')).toBe(false)
    expect(isBearerApiRoute('/api/courses/abc-123')).toBe(false)
    expect(isBearerApiRoute('/api/ai/generate-module')).toBe(false)
    expect(isBearerApiRoute('/api/org/members')).toBe(false)
    expect(isBearerApiRoute('/api/ai/generate-course/extra')).toBe(false)
  })
})
