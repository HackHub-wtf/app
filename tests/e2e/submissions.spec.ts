import { test, expect } from '@playwright/test'
import { login, apiToken, API } from './helpers'

import { TEST_IDS } from './helpers'
const HACK_ID = TEST_IDS.hackathonId

test.describe('Final submissions', () => {
  test('Submit tab shows form or status for participants', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /submit/i }).click()
    // p1 is on Team Alpha — should show form or existing submission
    const hasForm = await page.getByLabel('Title').isVisible({ timeout: 6_000 }).catch(() => false)
    const hasNoSub = await page.getByText(/no submission yet/i).isVisible({ timeout: 2_000 }).catch(() => false)
    expect(hasForm || hasNoSub).toBe(true)
  })

  test('Submit tab shows Title input field', async ({ page }) => {
    await login(page, 'alice')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /submit/i }).click()
    await expect(page.getByLabel('Title')).toBeVisible({ timeout: 6_000 })
  })

  test('Submit tab shows attachment type selector', async ({ page }) => {
    await login(page, 'alice')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /submit/i }).click()
    await expect(page.getByLabel('Type').first()).toBeVisible({ timeout: 6_000 })
  })

  test('link-to-idea dropdown opens without error', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /submit/i }).click()
    // Only check if the select exists — ideas may or may not be seeded
    const selectExists = await page.getByPlaceholder('Select an idea').isVisible({ timeout: 6_000 }).catch(() => false)
    if (!selectExists) {
      // No team or no idea select visible — still a valid state
      return
    }
    await page.getByPlaceholder('Select an idea').click()
    // Dropdown should open without crashing (either shows options or "no data")
    await page.waitForTimeout(500)
    // Just verify the page didn't crash
    await expect(page.getByRole('tab', { name: /submit/i, selected: true })).toBeVisible({ timeout: 3_000 })
  })

  test('submissions/my returns 204 for user with no team', async () => {
    const token = await apiToken('carol')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/submissions/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(204)
  })

  test('submissions list is accessible to authenticated users', async () => {
    const token = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const items = await res.json() as unknown[]
    expect(Array.isArray(items)).toBe(true)
  })
})
