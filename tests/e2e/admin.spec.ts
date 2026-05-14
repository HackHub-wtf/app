import { test, expect } from '@playwright/test'
import { login, apiToken, API, USERS } from './helpers'

test.describe('Admin panel — UI', () => {
  test('admin sees User Management page', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: /user management/i }).first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8_000 })
  })

  test('admin can search users by email', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/users')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8_000 })
    // Use a seeded test account that always exists after test-up.sh
    await page.getByPlaceholder(/search users/i).fill('manager')
    await expect(page.getByText(USERS.manager.email)).toBeVisible({ timeout: 6_000 })
  })

  test('admin sees Organization Management page with org list', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/organizations')
    await expect(page.getByRole('heading', { name: /organization/i }).first()).toBeVisible({ timeout: 8_000 })
  })

  test('manager sees Org Members page (not 403)', async ({ page }) => {
    await login(page, 'manager')
    await page.goto('/admin/users')
    // Manager sees their own org members — no Access Denied
    await expect(page.getByText('Access Denied')).not.toBeVisible({ timeout: 4_000 })
    await expect(page.getByRole('heading', { name: /org members/i }).first()).toBeVisible({ timeout: 8_000 })
  })

  test('manager sees org members in table', async ({ page }) => {
    await login(page, 'manager')
    await page.goto('/admin/users')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8_000 })
    // Test Org has at least the manager and admin as members
    await expect(page.getByText(USERS.manager.email)).toBeVisible({ timeout: 6_000 })
  })

  test('participant sees Access Denied on admin/users page', async ({ page }) => {
    await login(page, 'p3')
    await page.goto('/admin/users')
    await expect(page.getByText('Access Denied').first()).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Admin API — security', () => {
  test('unauthenticated request returns 401', async () => {
    const res = await fetch(`${API}/api/v1/admin/users`)
    expect(res.status).toBe(401)
  })

  test('participant JWT cannot access admin endpoint', async () => {
    const token = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(403)
  })

  test('admin API returns paged response with seeded test accounts', async () => {
    const token = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/admin/users?size=200`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { content: { id: string; email: string; role: string }[] }
    expect(Array.isArray(data.content)).toBe(true)
    expect(data.content.length).toBeGreaterThan(0)
    const emails = data.content.map(u => u.email)
    // Always present after test-up.sh
    expect(emails).toContain(USERS.admin.email)
    expect(emails).toContain(USERS.manager.email)
    expect(emails).toContain(USERS.p1.email)
  })

  test('admin can patch user role via API', async () => {
    const token = await apiToken('admin')
    const allUsers = await fetch(`${API}/api/v1/admin/users?size=200`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()) as { content: { id: string; email: string; role: string }[] }
    // Use p3 (solo participant) — safe to toggle role
    const target = allUsers.content.find(u => u.email === USERS.p3.email)
    test.skip(!target, 'p3 not found')

    const res = await fetch(`${API}/api/v1/admin/users/${target!.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'participant' }),
    })
    expect(res.status).toBe(200)
  })
})
