import { test, expect } from '@playwright/test'
import { login, apiToken, API, TEST_IDS } from './helpers'

async function getOrgId(): Promise<string | null> {
  // Use state file ID when available; fall back to API lookup
  if (TEST_IDS.orgId) return TEST_IDS.orgId
  const token = await apiToken('admin')
  const orgs = await fetch(`${API}/api/v1/organizations/my`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json()) as { id: string }[]
  return orgs[0]?.id ?? null
}

test.describe('Organization management', () => {
  test.afterAll(async () => {
    const tok = await apiToken('admin')
    const orgs = await fetch(`${API}/api/v1/organizations/my`, {
      headers: { Authorization: `Bearer ${tok}` },
    }).then(r => r.json()) as { id: string; name: string }[]
    for (const org of orgs) {
      if (org.name === 'E2E Org') {
        await fetch(`${API}/api/v1/organizations/${org.id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${tok}` },
        }).catch(() => {})
      }
    }
  })

  test('admin sees Test Org in their organizations list', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/organizations')
    await expect(page.getByText('Test Org').first()).toBeVisible({ timeout: 8_000 })
  })

  test('admin can create a new organization', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/organizations')
    await page.getByRole('button', { name: /create organization/i }).click()
    const slug = `e2e-org-${Date.now()}`
    await page.getByLabel(/name/i).first().fill('E2E Org')
    await page.getByLabel(/slug/i).fill(slug)
    await page.getByRole('button', { name: /create/i }).last().click()
    await expect(page.getByText('E2E Org').first()).toBeVisible({ timeout: 10_000 })
  })

  test('org Members tab shows admin member name', async ({ page }) => {
    const orgId = await getOrgId()
    test.skip(!orgId, 'No org found')
    await login(page, 'admin')
    await page.goto(`/organizations/${orgId}`)
    await page.getByRole('tab', { name: /members/i }).click()
    // Test Admin is the owner of Test Org
    await expect(page.getByText('Test Admin').first()).toBeVisible({ timeout: 8_000 })
  })

  test('owner sees Invite Member button', async ({ page }) => {
    const orgId = await getOrgId()
    test.skip(!orgId, 'No org found')
    await login(page, 'admin')
    await page.goto(`/organizations/${orgId}`)
    await page.getByRole('tab', { name: /members/i }).click()
    await expect(page.getByRole('button', { name: /invite member/i })).toBeVisible({ timeout: 6_000 })
  })

  test('owner opens invite modal with role label', async ({ page }) => {
    const orgId = await getOrgId()
    test.skip(!orgId, 'No org found')
    await login(page, 'admin')
    await page.goto(`/organizations/${orgId}`)
    await page.getByRole('tab', { name: /members/i }).click()
    await page.getByRole('button', { name: /invite member/i }).click()
    await expect(page.getByText('Role').first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: /generate invite link/i })).toBeVisible()
  })

  test('owner generates invite link', async ({ page }) => {
    const orgId = await getOrgId()
    test.skip(!orgId, 'No org found')
    await login(page, 'admin')
    await page.goto(`/organizations/${orgId}`)
    await page.getByRole('tab', { name: /members/i }).click()
    await page.getByRole('button', { name: /invite member/i }).click()
    await page.getByRole('button', { name: /generate invite link/i }).click()
    await expect(page.getByText(/\/invite\//)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('button', { name: /copy invite link/i })).toBeVisible()
  })

  test('invitation preview shows org name without auth', async ({ page }) => {
    const orgId = await getOrgId()
    test.skip(!orgId, 'No org found')
    const token = await apiToken('admin')
    const inv = await fetch(`${API}/api/v1/organizations/${orgId}/invitations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitedRole: 'member' }),
    }).then(r => r.json()) as { token: string }

    const ctx = await page.context().browser()!.newContext({ storageState: { cookies: [], origins: [] } })
    await ctx.clearCookies()
    const freshPage = await ctx.newPage()
    await freshPage.goto(`http://localhost/invite/${inv.token}`)
    await expect(freshPage.getByText('Test Org').first()).toBeVisible({ timeout: 8_000 })
    await expect(freshPage.getByRole('button', { name: /log in to accept/i })).toBeVisible()
    await ctx.close()
  })

  test('fresh user accepts invitation and lands on org page', async ({ page }) => {
    const orgId = await getOrgId()
    test.skip(!orgId, 'No org found')
    const adminToken = await apiToken('admin')

    // Register a brand new user
    const ts = Date.now()
    const email = `invitee+${ts}@e2e.test`
    const regCtx = await page.context().browser()!.newContext({ storageState: { cookies: [], origins: [] } })
    await regCtx.clearCookies()
    const regPage = await regCtx.newPage()
    await regPage.goto('http://localhost/register')
    await regPage.getByLabel('Full Name').fill('Invitee User')
    await regPage.getByLabel('Email').fill(email)
    await regPage.getByLabel('Organization').fill(`invitee-org-${ts}`)
    await regPage.getByPlaceholder('Your password').first().fill('Invite1234!')
    await regPage.getByPlaceholder('Confirm your password').fill('Invite1234!')
    await regPage.getByRole('button', { name: /register|sign up|create account/i }).click()
    await expect(regPage.getByText('Invitee User').first()).toBeVisible({ timeout: 15_000 })

    // Get the new user's token
    const newUserToken = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Invite1234!' }),
    }).then(r => r.json()) as { accessToken: string }
    await regCtx.close()

    // Create invitation
    const inv = await fetch(`${API}/api/v1/organizations/${orgId}/invitations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitedRole: 'member', invitedEmail: email }),
    }).then(r => r.json()) as { token: string }

    // Accept via new user's session
    const acceptRes = await fetch(`${API}/api/v1/organizations/accept-invitation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newUserToken.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inv.token }),
    })
    expect(acceptRes.status).toBe(200)
    const member = await acceptRes.json() as { role: string }
    expect(member.role).toBe('member')
  })

  test('role escalation — manager cannot invite manager', async () => {
    const orgId = await getOrgId()
    if (!orgId) return
    const mgrToken = await apiToken('manager')
    const res = await fetch(`${API}/api/v1/organizations/${orgId}/invitations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mgrToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitedRole: 'manager' }),
    })
    expect(res.status).toBe(403)
  })

  test('revoke makes token invalid', async () => {
    const orgId = await getOrgId()
    if (!orgId) return
    const token = await apiToken('admin')
    const inv = await fetch(`${API}/api/v1/organizations/${orgId}/invitations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitedRole: 'member' }),
    }).then(r => r.json()) as { id: string; token: string }

    await fetch(`${API}/api/v1/organizations/${orgId}/invitations/${inv.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    const preview = await fetch(`${API}/api/v1/invitations/${inv.token}`)
    expect(preview.status).toBe(400)
  })

  test('org Settings tab shows visibility and join policy', async ({ page }) => {
    const orgId = await getOrgId()
    test.skip(!orgId, 'No org found')
    await login(page, 'admin')
    await page.goto(`/organizations/${orgId}`)
    await page.getByRole('tab', { name: /settings/i }).click()
    await expect(page.getByText('Visibility').first()).toBeVisible({ timeout: 6_000 })
    await expect(page.getByText('Join Policy').first()).toBeVisible()
  })
})
