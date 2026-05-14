/**
 * Ideas have been de-emphasized as a separate top-level concept.
 * Teams own their project submission directly.
 * The Ideas tab still exists on hackathon detail but is not a primary navigation item.
 */
import { test, expect } from '@playwright/test'
import { login, apiToken, API } from './helpers'

import { TEST_IDS } from './helpers'
const HACK_ID = TEST_IDS.hackathonId

test.describe('Ideas — hackathon context', () => {
  test('Ideas tab appears on hackathon detail for authenticated users', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await expect(page.getByRole('tab', { name: /ideas/i })).toBeVisible({ timeout: 8_000 })
  })

  test('Ideas tab renders without error', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /ideas/i }).click()
    // Either shows ideas or an empty state — both are valid; just check no crash
    await page.waitForTimeout(2_000)
    // The Ideas tab itself must be selected (no crash)
    await expect(page.getByRole('tab', { name: /ideas/i, selected: true })).toBeVisible({ timeout: 4_000 })
  })

  test('Ideas sidebar link is removed', async ({ page }) => {
    await login(page, 'p1')
    const sidebarIdeas = page.locator('nav').getByText('Ideas')
    await expect(sidebarIdeas).not.toBeVisible({ timeout: 4_000 })
  })

  test('Ideas API returns 200 for hackathon', async () => {
    const token = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { content: unknown[] }
    expect(Array.isArray(data.content)).toBe(true)
  })

  test('voting on an idea via API uses correct endpoint', async () => {
    // Create an idea first so we have something to vote on
    const token = await apiToken('p1')
    const teamId = TEST_IDS.teamId

    if (!teamId) {
      test.skip(true, 'No team in test state')
      return
    }

    const createRes = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Idea for Voting',
        description: 'Created by E2E test for voting check',
        category: 'AI',
        teamId,
        tags: ['test'],
      }),
    })
    // Idea creation may 201 or 409 if already exists
    if (![201, 409, 200].includes(createRes.status)) {
      test.skip(true, `Could not create idea: ${createRes.status}`)
      return
    }

    const ideas = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()) as { content: { id: string; voteCount: number }[] }

    const idea = ideas.content[0]
    if (!idea) {
      test.skip(true, 'No ideas found')
      return
    }

    const voteRes = await fetch(`${API}/api/v1/ideas/${idea.id}/votes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect([200, 201, 204]).toContain(voteRes.status)
  })
})
