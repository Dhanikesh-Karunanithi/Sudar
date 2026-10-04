import { expect, test } from '@playwright/test'
import { LEARN_URL, STUDIO_URL } from './env'

const FAKE_ID = '00000000-0000-4000-8000-000000000000'
const FORGED = { Authorization: 'Bearer forged.jwt.token' }

test.describe('security gates', () => {
  test('Studio rejects a forged Bearer token on a cookie-only route', async ({ request }) => {
    const res = await request.post(`${STUDIO_URL}/api/courses/${FAKE_ID}/publish`, { headers: FORGED })
    expect(res.status()).toBe(401)
  })

  test('Studio rejects a forged Bearer token on an MCP route', async ({ request }) => {
    const res = await request.post(`${STUDIO_URL}/api/courses`, { headers: FORGED, data: { title: 'x' } })
    expect(res.status()).toBe(401)
  })

  test('Learn RAG ingest requires a session', async ({ request }) => {
    const res = await request.post(`${LEARN_URL}/api/rag/ingest`, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('Sim agent callback requires the service secret', async ({ request }) => {
    const res = await request.get(`${LEARN_URL}/api/sim/session/${FAKE_ID}/agent`, {
      headers: { 'x-sudar-sim-secret': 'wrong' },
    })
    expect(res.status()).toBe(401)
  })
})
