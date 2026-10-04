import type { Page } from '@playwright/test'

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export const STUDIO_URL = trimSlash(process.env.E2E_STUDIO_URL ?? 'http://localhost:3000')
export const LEARN_URL = trimSlash(process.env.E2E_LEARN_URL ?? 'http://localhost:3001')

/** Creator and learner must be in the same org (enrollment is org-scoped). */
export const creds = {
  creatorEmail: process.env.E2E_CREATOR_EMAIL ?? '',
  creatorPassword: process.env.E2E_CREATOR_PASSWORD ?? '',
  learnerEmail: process.env.E2E_LEARNER_EMAIL ?? '',
  learnerPassword: process.env.E2E_LEARNER_PASSWORD ?? '',
}

export const hasLoopCreds = Boolean(
  creds.creatorEmail && creds.creatorPassword && creds.learnerEmail && creds.learnerPassword
)

/** Tutor calls spend AI budget, so they only run when explicitly enabled. */
export const runAi = process.env.E2E_RUN_AI === '1'
export const simScenarioId = process.env.E2E_SIM_SCENARIO_ID?.trim() || null

export async function signIn(page: Page, baseUrl: string, email: string, password: string): Promise<void> {
  await page.goto(`${baseUrl}/login`)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
}
