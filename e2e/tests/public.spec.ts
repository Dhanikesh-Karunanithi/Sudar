import { expect, test } from '@playwright/test'
import { LEARN_URL, STUDIO_URL } from './env'

test.describe('public surfaces', () => {
  test('Studio login renders', async ({ page }) => {
    await page.goto(`${STUDIO_URL}/login`)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
  })

  test('Learn login renders', async ({ page }) => {
    await page.goto(`${LEARN_URL}/login`)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('unauthenticated Learn dashboard redirects to login', async ({ page }) => {
    await page.goto(`${LEARN_URL}/`)
    await expect(page).toHaveURL(/\/login/)
  })
})
