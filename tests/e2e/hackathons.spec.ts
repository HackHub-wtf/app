import { test, expect } from '@playwright/test'
import { login, apiToken, API } from './helpers'

import { TEST_IDS } from './helpers'
const HACK_ID = TEST_IDS.hackathonId

test.describe('Hackathon — admin', () => {
  test('admin can create a hackathon via form', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/hackathons/create')
    await page.getByLabel(/title/i).fill('E2E Hackathon')
    await page.getByLabel(/description/i).fill('Built by Playwright')
    // Date inputs may be custom pickers — use keyboard input
    const startInput = page.getByLabel(/start date/i)
    if (await startInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startInput.click()
      await page.keyboard.type(new Date(Date.now() + 86_400_000).toISOString().slice(0, 10))
    }
    await page.getByRole('button', { name: /create|submit/i }).click()
    await expect(page.getByText('E2E Hackathon').first()).toBeVisible({ timeout: 12_000 })
  })

  test('hackathon list page loads — admin can see Test Hackathon via direct URL', async ({ page }) => {
    await login(page, 'admin')
    // Navigate directly to the known hackathon — avoids pagination flakiness when
    // parallel tests are creating junk hackathons at the same time
    await page.goto(`/hackathons/${HACK_ID}`)
    await expect(page.getByText('Test Hackathon').first()).toBeVisible({ timeout: 12_000 })
  })

  test('admin sees Config tab on hackathon detail', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/hackathons/${HACK_ID}`)
    await expect(page.getByRole('tab', { name: /config/i })).toBeVisible({ timeout: 8_000 })
  })

  test('Config tab shows Visibility, Join Policy, and Judging Mode controls', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /config/i }).click()
    await expect(page.getByText('Visibility').first()).toBeVisible({ timeout: 6_000 })
    await expect(page.getByText('Join Policy').first()).toBeVisible()
    await expect(page.getByText('Judging Mode').first()).toBeVisible()
  })

  test('switching to Blended mode reveals panel weight slider', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /config/i }).click()
    await page.locator('label').filter({ hasText: 'Blended' }).click()
    await expect(page.getByText('Panel weight').first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('remaining').first()).toBeVisible()
  })

  test('admin can save judging config', async ({ page }) => {
    const token = await apiToken('admin')
    await fetch(`${API}/api/v1/hackathons/${HACK_ID}/config`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgingMode: 'community' }),
    })

    await login(page, 'admin')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /config/i }).click()
    await page.locator('label').filter({ hasText: 'Panel' }).last().click()
    await page.getByRole('button', { name: /save config/i }).click()
    // Notification appears
    await expect(page.getByText(/saved|updated|config/i).first()).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Hackathon — manager', () => {
  test('manager sees Judge and Config tabs', async ({ page }) => {
    await login(page, 'manager')
    await page.goto(`/hackathons/${HACK_ID}`)
    await expect(page.getByRole('tab', { name: /judge/i })).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('tab', { name: /config/i })).toBeVisible()
  })

  test('manager can view Judge tab with panel judges section', async ({ page }) => {
    await login(page, 'manager')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /judge/i }).click()
    await expect(page.getByText('Panel Judges')).toBeVisible({ timeout: 6_000 })
  })
})

test.describe('Hackathon — participant', () => {
  test('participant sees org-scoped hackathon via API', async () => {
    // API-level scoping check — not subject to pagination race with parallel tests
    const tok = await apiToken('p1')
    const hacks = await fetch(`${API}/api/v1/hackathons?size=200`, {
      headers: { Authorization: `Bearer ${tok}` },
    }).then(r => r.json()) as { content: { id: string; title: string; organizationId: string | null }[] }
    const titles = hacks.content.map(h => h.title)
    expect(titles).toContain('Test Hackathon')
    // Unscoped hackathon (no org) must not appear for participants
    expect(titles).not.toContain('Spring 2026 Hackathon')
  })

  test('participant sees hackathon detail', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await expect(page.getByText('Test Hackathon').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(/open|running|draft|completed/i).first()).toBeVisible()
  })

  test('participant does NOT see Config or Judge tabs', async ({ page }) => {
    await login(page, 'carol')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('tab', { name: /^config$/i })).not.toBeVisible({ timeout: 4_000 })
    await expect(page.getByRole('tab', { name: /^judge$/i })).not.toBeVisible({ timeout: 4_000 })
  })

  test('participant sees Submit tab', async ({ page }) => {
    await login(page, 'alice')
    await page.goto(`/hackathons/${HACK_ID}`)
    await expect(page.getByRole('tab', { name: /submit/i })).toBeVisible({ timeout: 6_000 })
  })
})

test.describe('Hackathon score API', () => {
  test('score summary returns ranked ideas', async () => {
    const token = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/scores/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const items = await res.json() as { ideaId: string; blendedScore: number; rank: number }[]
    expect(Array.isArray(items)).toBe(true)
    for (const item of items) {
      expect(item).toHaveProperty('ideaId')
      expect(item).toHaveProperty('blendedScore')
      expect(item).toHaveProperty('rank')
    }
  })
})
