import { test, expect } from '@playwright/test'
import { login, apiToken, API } from './helpers'

import { TEST_IDS } from './helpers'
const HACK_ID = TEST_IDS.hackathonId

test.describe('Leaderboard', () => {
  test('leaderboard tab is visible to all authenticated users', async ({ page }) => {
    await login(page, 'alice')
    await page.goto(`/hackathons/${HACK_ID}`)
    await expect(page.getByRole('tab', { name: /leaderboard/i })).toBeVisible({ timeout: 6_000 })
  })

  test('leaderboard page loads standalone route', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/hackathons/${HACK_ID}/leaderboard`)
    await expect(page.getByText(/leaderboard/i)).toBeVisible({ timeout: 8_000 })
  })

  test('leaderboard is publicly accessible via API (no auth required)', async () => {
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/leaderboard`)
    expect(res.status).toBe(200)
  })

  test('score summary ranks ideas in order', async () => {
    const token = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/scores/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const items = await res.json() as { rank: number }[]
    if (items.length > 1) {
      for (let i = 1; i < items.length; i++) {
        expect(items[i].rank).toBeGreaterThanOrEqual(items[i - 1].rank)
      }
    }
  })
})
