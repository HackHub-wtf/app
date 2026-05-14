import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Navigation — sidebar by role', () => {
  test('admin sees Admin Panel section with user and org management', async ({ page }) => {
    await login(page, 'admin')
    await expect(page.locator('nav').getByText('Admin Panel')).toBeVisible({ timeout: 6_000 })
    await expect(page.locator('nav').getByText('Manage Users')).toBeVisible()
    await expect(page.locator('nav').getByText('Manage Organizations')).toBeVisible()
  })

  test('participant does not see Admin Panel section', async ({ page }) => {
    await login(page, 'alice')
    await expect(page.locator('nav').getByText('Admin Panel')).not.toBeVisible({ timeout: 4_000 })
  })

  test('Ideas link has been removed from the sidebar', async ({ page }) => {
    await login(page, 'alice')
    await expect(page.locator('nav').getByText('Ideas')).not.toBeVisible({ timeout: 4_000 })
  })

  test('hackathons nav item navigates to /hackathons', async ({ page }) => {
    await login(page, 'alice')
    // NavLink uses onClick+navigate — click the text label
    await page.locator('nav').getByText('Hackathons').click()
    await expect(page).toHaveURL(/hackathons/, { timeout: 6_000 })
  })

  test('teams nav item navigates to /teams', async ({ page }) => {
    await login(page, 'alice')
    await page.locator('nav').getByText('Teams').first().click()
    await expect(page).toHaveURL(/teams/, { timeout: 6_000 })
  })

  test('organizations nav item navigates to /organizations', async ({ page }) => {
    await login(page, 'alice')
    await page.locator('nav').getByText('Organizations').click()
    await expect(page).toHaveURL(/organizations/, { timeout: 6_000 })
  })

  test('admin navigates to admin users page from sidebar', async ({ page }) => {
    await login(page, 'admin')
    await page.locator('nav').getByText('Manage Users').click()
    await expect(page).toHaveURL(/admin\/users/, { timeout: 6_000 })
  })
})
