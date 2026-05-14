/**
 * permissions.spec.ts
 *
 * Role-based access control tests for all user types.
 * Covers: API-level enforcement (403 checks) + UI visibility per role.
 *
 * Seed data:  test-up.sh must have been run before this suite.
 * Password:   Password123 (all test users)
 */

import { test, expect } from '@playwright/test'
import { login, apiToken, API, TEST_IDS } from './helpers'

const HACK_ID = TEST_IDS.hackathonId
const ORG_ID  = TEST_IDS.orgId

// ── helpers ──────────────────────────────────────────────────────────────────
async function httpStatus(
  method: string,
  path: string,
  token: string,
  body?: object,
): Promise<number> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.status
}

// ─────────────────────────────────────────────────────────────────────────────
// API PERMISSION MATRIX
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API — admin', () => {
  test.afterAll(async () => {
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons?size=200`, { headers: { Authorization: `Bearer ${tok}` } })
    const data = await res.json() as { content: { id: string; title: string }[] }
    for (const h of data.content) {
      if (h.title === 'Admin Perm Test') {
        await fetch(`${API}/api/v1/hackathons/${h.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok}` } }).catch(() => {})
      }
    }
  })

  test('PATCH /hackathons/:id/config → 200', async () => {
    const tok = await apiToken('admin')
    expect(await httpStatus('PATCH', `/api/v1/hackathons/${HACK_ID}/config`, tok,
      { judgingMode: 'blended', panelWeight: 70 })).toBe(200)
  })

  test('POST /hackathons → 201', async () => {
    const tok = await apiToken('admin')
    const status = await httpStatus('POST', '/api/v1/hackathons', tok, {
      title: 'Admin Perm Test',
      description: 'perm test',
      startDate: '2026-08-01T00:00:00Z',
      endDate:   '2026-08-08T00:00:00Z',
      maxTeamSize: 5,
      allowedParticipants: 50,
      organizationId: ORG_ID,
    })
    expect(status).toBe(201)
  })

  test('GET /admin/users → 200', async () => {
    const tok = await apiToken('admin')
    expect(await httpStatus('GET', '/api/v1/admin/users', tok)).toBe(200)
  })

  test('GET /admin/organizations → 200', async () => {
    const tok = await apiToken('admin')
    expect(await httpStatus('GET', '/api/v1/admin/organizations', tok)).toBe(200)
  })
})

test.describe('API — manager', () => {
  test.afterAll(async () => {
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons?size=200`, { headers: { Authorization: `Bearer ${tok}` } })
    const data = await res.json() as { content: { id: string; title: string }[] }
    for (const h of data.content) {
      if (h.title === 'Mgr Perm Test') {
        await fetch(`${API}/api/v1/hackathons/${h.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok}` } }).catch(() => {})
      }
    }
  })

  test('PATCH /hackathons/:id/config (own org) → 200', async () => {
    const tok = await apiToken('manager')
    expect(await httpStatus('PATCH', `/api/v1/hackathons/${HACK_ID}/config`, tok,
      { judgingMode: 'blended', panelWeight: 70 })).toBe(200)
  })

  test('POST /hackathons (own org) → 201', async () => {
    const tok = await apiToken('manager')
    const status = await httpStatus('POST', '/api/v1/hackathons', tok, {
      title: 'Mgr Perm Test',
      description: 'perm test',
      startDate: '2026-08-01T00:00:00Z',
      endDate:   '2026-08-08T00:00:00Z',
      maxTeamSize: 5,
      allowedParticipants: 50,
      organizationId: ORG_ID,
    })
    expect(status).toBe(201)
  })

  test('GET /admin/users → 403', async () => {
    const tok = await apiToken('manager')
    expect(await httpStatus('GET', '/api/v1/admin/users', tok)).toBe(403)
  })

  test('GET /admin/organizations → 403', async () => {
    const tok = await apiToken('manager')
    expect(await httpStatus('GET', '/api/v1/admin/organizations', tok)).toBe(403)
  })

  test('invite member role → 201', async () => {
    const tok = await apiToken('manager')
    expect(await httpStatus('POST', `/api/v1/organizations/${ORG_ID}/invitations`, tok,
      { invitedRole: 'member' })).toBe(201)
  })

  test('invite judge role → 201', async () => {
    const tok = await apiToken('manager')
    expect(await httpStatus('POST', `/api/v1/organizations/${ORG_ID}/invitations`, tok,
      { invitedRole: 'judge' })).toBe(201)
  })

  test('invite manager role → 403 (role escalation)', async () => {
    const tok = await apiToken('manager')
    expect(await httpStatus('POST', `/api/v1/organizations/${ORG_ID}/invitations`, tok,
      { invitedRole: 'manager' })).toBe(403)
  })
})

test.describe('API — participant', () => {
  test('PATCH /hackathons/:id/config → 403', async () => {
    const tok = await apiToken('p1')
    expect(await httpStatus('PATCH', `/api/v1/hackathons/${HACK_ID}/config`, tok,
      { judgingMode: 'community' })).toBe(403)
  })

  test('POST /hackathons → 403', async () => {
    const tok = await apiToken('p1')
    expect(await httpStatus('POST', '/api/v1/hackathons', tok, {
      title: 'X', description: 'Y',
      startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-08T00:00:00Z',
      maxTeamSize: 5, allowedParticipants: 10,
    })).toBe(403)
  })

  test('GET /admin/users → 403', async () => {
    const tok = await apiToken('p1')
    expect(await httpStatus('GET', '/api/v1/admin/users', tok)).toBe(403)
  })

  test('POST /organizations/:id/invitations → 403', async () => {
    const tok = await apiToken('p1')
    expect(await httpStatus('POST', `/api/v1/organizations/${ORG_ID}/invitations`, tok,
      { invitedRole: 'member' })).toBe(403)
  })

  test('PATCH /hackathons/:id/status → 403', async () => {
    const tok = await apiToken('p1')
    // May return 403 or 409 (already open) — both acceptable, never 200
    const status = await httpStatus('PATCH', `/api/v1/hackathons/${HACK_ID}/status`, tok,
      { status: 'running' })
    expect([403, 409]).toContain(status)
  })

  test('GET /hackathons/:id/submissions/my → 204 (no team or no submission)', async () => {
    const tok = await apiToken('p3')  // user3 has no team
    expect(await httpStatus('GET', `/api/v1/hackathons/${HACK_ID}/submissions/my`, tok)).toBe(204)
  })
})

test.describe('API — judge', () => {
  test('PATCH /hackathons/:id/config → 403', async () => {
    const tok = await apiToken('judge')
    expect(await httpStatus('PATCH', `/api/v1/hackathons/${HACK_ID}/config`, tok,
      { judgingMode: 'community' })).toBe(403)
  })

  test('POST /hackathons → 403', async () => {
    const tok = await apiToken('judge')
    expect(await httpStatus('POST', '/api/v1/hackathons', tok, {
      title: 'X', description: 'Y',
      startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-08T00:00:00Z',
      maxTeamSize: 5, allowedParticipants: 10,
    })).toBe(403)
  })

  test('GET /admin/users → 403', async () => {
    const tok = await apiToken('judge')
    expect(await httpStatus('GET', '/api/v1/admin/users', tok)).toBe(403)
  })

  test('POST /organizations/:id/invitations → 403', async () => {
    const tok = await apiToken('judge')
    expect(await httpStatus('POST', `/api/v1/organizations/${ORG_ID}/invitations`, tok,
      { invitedRole: 'member' })).toBe(403)
  })
})

test.describe('API — input validation', () => {
  test('date-only string → 400 not 500', async () => {
    const tok = await apiToken('admin')
    expect(await httpStatus('POST', '/api/v1/hackathons', tok, {
      title: 'X', description: 'Y',
      startDate: '2026-06-01', endDate: '2026-06-08',
      maxTeamSize: 5, allowedParticipants: 10,
    })).toBe(400)
  })

  test('invalid invitedRole → 400 not 500', async () => {
    const tok = await apiToken('admin')
    expect(await httpStatus('POST', `/api/v1/organizations/${ORG_ID}/invitations`, tok,
      { invitedRole: 'superadmin' })).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — ADMIN
// ─────────────────────────────────────────────────────────────────────────────

test.describe('UI — admin', () => {
  test('admin sees Config and Judge tabs on hackathon', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /config/i.test(t))).toBe(true)
    expect(tabs.some(t => /judge/i.test(t))).toBe(true)
  })

  test('admin sees Invite Member button in org members tab', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/organizations/${ORG_ID}`)
    await page.getByRole('tab', { name: /members/i }).click()
    await expect(page.getByRole('button', { name: /invite member/i })).toBeVisible({ timeout: 6_000 })
  })

  test('admin sees Settings tab on org detail', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/organizations/${ORG_ID}`)
    await expect(page.getByRole('tab', { name: /settings/i })).toBeVisible({ timeout: 6_000 })
  })

  test('admin sees admin panels in nav', async ({ page }) => {
    await login(page, 'admin')
    await expect(page.getByText('Admin Panel').first()).toBeVisible({ timeout: 6_000 })
  })

  test('admin user management page loads', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/users')
    await expect(page.getByText('User Management').first()).toBeVisible({ timeout: 8_000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — MANAGER
// ─────────────────────────────────────────────────────────────────────────────

test.describe('UI — manager', () => {
  test('manager sees Config tab on own org hackathon', async ({ page }) => {
    await login(page, 'manager')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /config/i.test(t))).toBe(true)
  })

  test('manager sees Judge tab on own org hackathon', async ({ page }) => {
    await login(page, 'manager')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /judge/i.test(t))).toBe(true)
  })

  test('manager does NOT see admin panel in nav', async ({ page }) => {
    await login(page, 'manager')
    await page.goto('/')
    const navText = await page.locator('nav').innerText()
    expect(/admin panel/i.test(navText)).toBe(false)
  })

  test('manager sees Invite Member button', async ({ page }) => {
    await login(page, 'manager')
    await page.goto(`/organizations/${ORG_ID}`)
    await page.getByRole('tab', { name: /members/i }).click()
    await expect(page.getByRole('button', { name: /invite member/i })).toBeVisible({ timeout: 6_000 })
  })

  test('manager sees Settings tab', async ({ page }) => {
    await login(page, 'manager')
    await page.goto(`/organizations/${ORG_ID}`)
    await expect(page.getByRole('tab', { name: /settings/i })).toBeVisible({ timeout: 6_000 })
  })

  test('manager sees only org-scoped hackathons', async ({ page }) => {
    await login(page, 'manager')
    await page.goto('/hackathons')
    await page.waitForLoadState('networkidle')
    const text = await page.locator('main').innerText()
    expect(/spring 2026/i.test(text)).toBe(false)   // legacy unscoped hackathon must NOT appear
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — PARTICIPANT (team leader)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('UI — participant (team leader)', () => {
  test('does NOT see Config tab', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /config/i.test(t))).toBe(false)
  })

  test('does NOT see Judge tab (not assigned as judge)', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /^judge$/i.test(t))).toBe(false)
  })

  test('sees Overview, Teams, Leaderboard, Submit tabs', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /overview/i.test(t))).toBe(true)
    expect(tabs.some(t => /teams/i.test(t))).toBe(true)
    expect(tabs.some(t => /leaderboard/i.test(t))).toBe(true)
    expect(tabs.some(t => /submit/i.test(t))).toBe(true)
  })

  test('does NOT see Invite Member button in org', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/organizations/${ORG_ID}`)
    await page.getByRole('tab', { name: /members/i }).click()
    await page.waitForTimeout(2000)
    const hasInvite = await page.getByRole('button', { name: /invite member/i }).isVisible().catch(() => false)
    expect(hasInvite).toBe(false)
  })

  test('does NOT see Settings tab in org', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/organizations/${ORG_ID}`)
    await page.waitForTimeout(2000)
    const hasSettings = await page.getByRole('tab', { name: /settings/i }).isVisible().catch(() => false)
    expect(hasSettings).toBe(false)
  })

  test('does NOT see admin panels in nav', async ({ page }) => {
    await login(page, 'p1')
    await page.goto('/')
    const navText = await page.locator('nav').innerText()
    expect(/admin panel/i.test(navText)).toBe(false)
  })

  test('team card shows Manage Team button for leader', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${TEST_IDS.hackathonId}/teams`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: /manage team/i }).first()).toBeVisible({ timeout: 12_000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — PARTICIPANT (team member)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('UI — participant (team member)', () => {
  test('does NOT see Config tab', async ({ page }) => {
    await login(page, 'p2')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /config/i.test(t))).toBe(false)
  })

  test('team card shows View My Team (not Manage Team)', async ({ page }) => {
    await login(page, 'p2')
    await page.goto(`/hackathons/${TEST_IDS.hackathonId}/teams`)
    await page.waitForLoadState('networkidle')
    const hasManage = await page.getByRole('button', { name: /manage team/i }).first().isVisible({ timeout: 4_000 }).catch(() => false)
    expect(hasManage).toBe(false)
    await expect(page.getByRole('button', { name: /view my team/i }).first()).toBeVisible({ timeout: 12_000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — PARTICIPANT (solo, no team)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('UI — participant (solo, no team)', () => {
  test('Submit tab shows no-team message', async ({ page }) => {
    await login(page, 'p3')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /submit/i }).click()
    // Wait for the no-team state (page must finish loading team members first)
    await expect(page.getByText(/join or create a team/i).first()).toBeVisible({ timeout: 12_000 })
  })

  test('team cards for open teams show Join Team', async ({ page }) => {
    await login(page, 'p3')
    await page.goto(`/hackathons/${TEST_IDS.hackathonId}/teams`)
    await page.waitForTimeout(3000)
    await expect(page.getByRole('button', { name: /join team/i }).first()).toBeVisible({ timeout: 8_000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — JUDGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('UI — judge', () => {
  test('judge SEES Judge tab on assigned hackathon', async ({ page }) => {
    await login(page, 'judge')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /^judge$/i.test(t))).toBe(true)
  })

  test('judge does NOT see Config tab', async ({ page }) => {
    await login(page, 'judge')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.waitForSelector('[role=tab]')
    const tabs = await page.$$eval('[role=tab]', els => els.map(e => e.textContent?.trim() ?? ''))
    expect(tabs.some(t => /config/i.test(t))).toBe(false)
  })

  test('judge sees read-only criteria in Judge tab', async ({ page }) => {
    await login(page, 'judge')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: 'Judge' }).click()
    await page.waitForTimeout(2000)
    const hasAddCriteria = await page.getByRole('button', { name: /add criteria/i }).isVisible().catch(() => false)
    expect(hasAddCriteria).toBe(false)
    await expect(page.getByText('Innovation').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Execution').first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Impact').first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: /open full judging panel/i })).toBeVisible({ timeout: 5_000 })
  })

  test('judge does NOT see admin panels in nav', async ({ page }) => {
    await login(page, 'judge')
    await page.goto('/')
    const navText = await page.locator('nav').innerText()
    expect(/admin panel/i.test(navText)).toBe(false)
  })

  test('judge does NOT see Invite Member button in org', async ({ page }) => {
    await login(page, 'judge')
    await page.goto(`/organizations/${ORG_ID}`)
    await page.getByRole('tab', { name: /members/i }).click()
    await page.waitForTimeout(2000)
    const hasInvite = await page.getByRole('button', { name: /invite member/i }).isVisible().catch(() => false)
    expect(hasInvite).toBe(false)
  })

  test('judge does NOT see Settings tab in org', async ({ page }) => {
    await login(page, 'judge')
    await page.goto(`/organizations/${ORG_ID}`)
    await page.waitForTimeout(2000)
    const hasSettings = await page.getByRole('tab', { name: /settings/i }).isVisible().catch(() => false)
    expect(hasSettings).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — AUTH REDIRECTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('UI — unauthenticated redirects', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('/ redirects to /login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login/)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('/hackathons redirects to /login', async ({ page }) => {
    await page.goto('/hackathons')
    await page.waitForURL(/\/login/)
  })

  test('/admin/users redirects to /login', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForURL(/\/login/)
  })

  test('/invite/:token shows preview without login', async ({ page }) => {
    // Use the org invitation preview endpoint to get a token
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/organizations/${ORG_ID}/invitations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitedRole: 'member' }),
    })
    const { token } = await res.json() as { token: string }

    await page.goto(`/invite/${token}`)
    // Must show org name and login button — NOT redirect to /login
    await expect(page.getByText('Test Org').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('button', { name: /log in to accept/i })).toBeVisible()
  })
})
