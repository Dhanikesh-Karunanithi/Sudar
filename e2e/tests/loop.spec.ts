import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { LEARN_URL, STUDIO_URL, creds, hasLoopCreds, runAi, signIn, simScenarioId } from './env'

/**
 * Full beta loop against a live Studio + Learn pair:
 * author -> publish -> enroll -> learn -> events/mastery -> Next 15 -> tutor (opt-in) -> sim (opt-in).
 * Creates one throwaway course and deletes it afterwards.
 */
test.describe.configure({ mode: 'serial' })
test.skip(!hasLoopCreds, 'Set E2E_CREATOR_* and E2E_LEARNER_* to run the full loop')

const MODULE_BODY = [
  '# Active listening',
  '',
  'Active listening means giving the speaker your full attention, reflecting back what you heard,',
  'and asking open questions before offering solutions.',
  '',
  '## Why it matters',
  '',
  'Customers who feel heard are more likely to accept a proposed resolution.',
].join('\n')

let creatorContext: BrowserContext
let learnerContext: BrowserContext
let creator: Page
let learner: Page
let courseId = ''
let moduleId = ''
const courseTitle = `E2E smoke ${new Date().toISOString()}`

test.beforeAll(async ({ browser }) => {
  creatorContext = await browser.newContext()
  learnerContext = await browser.newContext()
  creator = await creatorContext.newPage()
  learner = await learnerContext.newPage()
})

test.afterAll(async () => {
  if (courseId) {
    await creator.request.delete(`${STUDIO_URL}/api/courses/${courseId}`).catch(() => undefined)
  }
  await creatorContext?.close()
  await learnerContext?.close()
})

test('creator signs in to Studio', async () => {
  await signIn(creator, STUDIO_URL, creds.creatorEmail, creds.creatorPassword)
})

test('creator authors a course with a text module', async () => {
  const created = await creator.request.post(`${STUDIO_URL}/api/courses`, {
    data: { title: courseTitle, description: 'Automated beta smoke test course.' },
  })
  expect(created.status()).toBe(201)
  courseId = ((await created.json()) as { id: string }).id
  expect(courseId).toBeTruthy()

  const mod = await creator.request.post(`${STUDIO_URL}/api/courses/${courseId}/modules`, {
    data: { title: 'Active listening basics', content: { type: 'text', body: MODULE_BODY } },
  })
  expect(mod.status()).toBe(201)
  moduleId = ((await mod.json()) as { id: string }).id
  expect(moduleId).toBeTruthy()
})

test('creator publishes the course', async () => {
  const res = await creator.request.post(`${STUDIO_URL}/api/courses/${courseId}/publish`)
  expect(res.status(), await res.text()).toBe(200)
})

test('learner signs in and enrolls', async () => {
  await signIn(learner, LEARN_URL, creds.learnerEmail, creds.learnerPassword)
  const res = await learner.request.post(`${LEARN_URL}/api/enrollments`, { data: { course_id: courseId } })
  expect([200, 201], await res.text()).toContain(res.status())
})

test('learner opens the course viewer', async () => {
  await learner.goto(`${LEARN_URL}/courses/${courseId}/learn`)
  const skipOnboarding = learner.getByRole('button', { name: /skip for now/i })
  if (await skipOnboarding.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await skipOnboarding.click()
    await learner.goto(`${LEARN_URL}/courses/${courseId}/learn`)
  }
  await expect(learner.getByText('Active listening basics').first()).toBeVisible({ timeout: 30_000 })
})

test('learning events and quiz evidence are accepted', async () => {
  for (const data of [
    { event_type: 'module_start', course_id: courseId, module_id: moduleId, modality: 'text' },
    {
      event_type: 'quiz_attempt',
      course_id: courseId,
      module_id: moduleId,
      modality: 'text',
      payload: { score: 1, correct: true },
    },
    { event_type: 'module_complete', course_id: courseId, module_id: moduleId, modality: 'text' },
  ]) {
    const res = await learner.request.post(`${LEARN_URL}/api/events`, { data })
    expect(res.status(), `${data.event_type}: ${await res.text()}`).toBe(200)
  }
})

test('module mastery and Next 15 respond', async () => {
  const claims = await learner.request.get(`${LEARN_URL}/api/teaching/module-claims?module_id=${moduleId}`)
  expect(claims.status()).toBe(200)
  const claimsBody = (await claims.json()) as { success: boolean; data: { claims: unknown[] } }
  expect(claimsBody.success).toBe(true)
  expect(Array.isArray(claimsBody.data.claims)).toBe(true)

  const next = await learner.request.get(`${LEARN_URL}/api/teaching/next-fifteen`)
  expect(next.status()).toBe(200)
  expect(((await next.json()) as { success: boolean }).success).toBe(true)
})

test('tutor rejects cross-site requests for a signed-in learner', async () => {
  const res = await learner.request.post(`${LEARN_URL}/api/tutor/query`, {
    headers: { Origin: 'https://evil.example' },
    data: { message: 'hello', course_id: courseId },
  })
  expect(res.status()).toBe(403)
})

test('tutor answers about the module', async () => {
  test.skip(!runAi, 'Set E2E_RUN_AI=1 to exercise the tutor (spends AI budget)')
  const res = await learner.request.post(`${LEARN_URL}/api/tutor/query`, {
    data: { message: 'What is active listening?', course_id: courseId, module_id: moduleId },
    timeout: 60_000,
  })
  expect(res.status(), await res.text()).toBe(200)
  const body = (await res.json()) as { response?: string }
  expect((body.response ?? '').length).toBeGreaterThan(0)
})

test('learner can start a SudarSim session', async () => {
  test.skip(!simScenarioId, 'Set E2E_SIM_SCENARIO_ID to a published scenario in the learner org')
  const res = await learner.request.post(`${LEARN_URL}/api/sim/session`, {
    data: { scenario_id: simScenarioId },
  })
  expect(res.status(), await res.text()).toBe(200)
  const body = (await res.json()) as { success: boolean; session_id?: string }
  expect(body.success).toBe(true)
  expect(body.session_id).toBeTruthy()
})
