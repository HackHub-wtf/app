import { test, expect } from '@playwright/test'
import { login, USERS } from './helpers'

test.describe('Unauthenticated behaviour', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('visiting a protected route redirects to /login', async ({ page }) => {
    await page.goto('/hackathons')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible({ timeout: 8_000 })
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByPlaceholder(/password/i).first().fill('wrongpassword')
    await page.getByRole('button', { name: /login|sign in/i }).click()
    await expect(page.getByText(/invalid|incorrect|wrong/i).first()).toBeVisible({ timeout: 8_000 })
  })

  test('register creates a new account', async ({ page }) => {
    const ts = Date.now()
    await page.goto('/register')
    await expect(page.getByLabel('Full Name')).toBeVisible({ timeout: 8_000 })
    await page.getByLabel('Full Name').fill('E2E Tester')
    await page.getByLabel('Email').fill(`e2e+${ts}@hackhub.wtf`)
    await page.getByLabel('Organization').fill(`e2e-org-${ts}`)
    await page.getByPlaceholder('Your password').first().fill('Test1234!')
    await page.getByPlaceholder('Confirm your password').fill('Test1234!')
    await page.getByRole('button', { name: /register|sign up|create account/i }).click()
    await expect(page.getByText('E2E Tester').first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Login by role', () => {
  // All checks use the navigation sidebar "Welcome, <name>" which is stable across
  // both demo data and test-up.sh provisioned accounts.

  test('admin logs in — nav shows Welcome message', async ({ page }) => {
    await login(page, 'admin')
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 12_000 })
    const navText = await page.locator('nav').innerText()
    expect(/welcome/i.test(navText)).toBe(true)
  })

  test('manager logs in — nav shows Welcome message', async ({ page }) => {
    await login(page, 'manager')
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 12_000 })
    const navText = await page.locator('nav').innerText()
    expect(/welcome/i.test(navText)).toBe(true)
  })

  test('participant p1 logs in — nav shows Welcome message', async ({ page }) => {
    await login(page, 'p1')
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 12_000 })
    const navText = await page.locator('nav').innerText()
    expect(/welcome/i.test(navText)).toBe(true)
  })

  test('participant p2 logs in — nav shows Welcome message', async ({ page }) => {
    await login(page, 'p2')
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 12_000 })
    const navText = await page.locator('nav').innerText()
    expect(/welcome/i.test(navText)).toBe(true)
  })

  test('judge logs in — nav shows Welcome message', async ({ page }) => {
    await login(page, 'judge')
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 12_000 })
    const navText = await page.locator('nav').innerText()
    expect(/welcome/i.test(navText)).toBe(true)
  })

  test('admin sees Admin Panel in nav', async ({ page }) => {
    await login(page, 'admin')
    await expect(page.getByText('Admin Panel').first()).toBeVisible({ timeout: 8_000 })
  })

  test('participant does not see Admin Panel in nav', async ({ page }) => {
    await login(page, 'p1')
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 12_000 })
    const navText = await page.locator('nav').innerText()
    expect(/admin panel/i.test(navText)).toBe(false)
  })
})
