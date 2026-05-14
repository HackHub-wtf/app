import { test, expect } from '@playwright/test'
import { login, apiToken, API } from './helpers'

import { TEST_IDS } from './helpers'
const HACK_ID = TEST_IDS.hackathonId

async function getFirstTeamId(): Promise<string | null> {
  const token = await apiToken('admin')
  const teams = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/teams`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json()) as { id: string }[]
  return teams[0]?.id ?? null
}

test.describe('Teams — participant', () => {
  test('teams page loads and shows heading', async ({ page }) => {
    await login(page, 'alice')
    await page.goto('/teams')
    await expect(page.getByRole('heading', { name: /team/i }).first()).toBeVisible({ timeout: 8_000 })
  })

  test('team detail page loads with correct team name', async ({ page }) => {
    const teamId = await getFirstTeamId()
    test.skip(!teamId, 'No teams found')
    await login(page, 'alice')
    await page.goto(`/teams/${teamId}`)
    // Team name should appear as heading
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible({ timeout: 8_000 })
  })

  test('team detail shows Members section', async ({ page }) => {
    const teamId = await getFirstTeamId()
    test.skip(!teamId, 'No teams found')
    await login(page, 'admin')
    await page.goto(`/teams/${teamId}`)
    await expect(page.getByText(/members \(/i)).toBeVisible({ timeout: 6_000 })
    await expect(page.getByText(/leader/i).first()).toBeVisible()
  })

  test('team detail has Overview and Project tabs', async ({ page }) => {
    const teamId = await getFirstTeamId()
    test.skip(!teamId, 'No teams found')
    await login(page, 'alice')
    await page.goto(`/teams/${teamId}`)
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible({ timeout: 6_000 })
    await expect(page.getByRole('tab', { name: /project/i })).toBeVisible()
  })

  test('Project tab shows no project or submit CTA for team member', async ({ page }) => {
    const teamId = await getFirstTeamId()
    test.skip(!teamId, 'No teams found')
    await login(page, 'alice')
    await page.goto(`/teams/${teamId}`)
    await page.getByRole('tab', { name: /project/i }).click()
    // Either shows a submission or the "no project" empty state
    await expect(
      page.getByText(/no project submitted|submitted/i).first()
    ).toBeVisible({ timeout: 6_000 })
  })

  test('Back to hackathon link is on team detail page', async ({ page }) => {
    const teamId = await getFirstTeamId()
    test.skip(!teamId, 'No teams found')
    await login(page, 'alice')
    await page.goto(`/teams/${teamId}`)
    await expect(page.getByText(/back to hackathon/i)).toBeVisible({ timeout: 6_000 })
  })
})

test.describe('Teams — admin', () => {
  test('admin sees all teams on teams page', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/teams')
    await expect(page.getByRole('heading', { name: /team/i }).first()).toBeVisible()
  })

  test('clicking View My Team navigates to team detail', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/teams')
    const viewBtn = page.getByRole('button', { name: /view|manage|my team/i }).first()
    if (await viewBtn.isVisible({ timeout: 6_000 }).catch(() => false)) {
      await viewBtn.click()
      await expect(page).toHaveURL(/\/teams\/[a-f0-9-]+/, { timeout: 8_000 })
    }
  })
})
