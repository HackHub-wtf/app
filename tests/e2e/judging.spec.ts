import { test, expect } from '@playwright/test'
import { login, apiToken, API, TEST_IDS } from './helpers'

const HACK_ID = TEST_IDS.hackathonId
const ORG_ID  = TEST_IDS.orgId

// ── helpers ──────────────────────────────────────────────────────────────────

/** Ensure at least one idea exists for this hackathon; returns its id. */
async function ensureIdea(adminToken: string): Promise<string | null> {
  const teamId = TEST_IDS.teamId
  if (!teamId) return null

  // Try to create an idea (ignore 409 duplicate)
  await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Judging E2E Idea',
      description: 'Created by judging spec for scoring tests',
      category: 'AI',
      teamId,
      tags: ['e2e'],
    }),
  }).catch(() => {})

  const ideas = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then(r => r.json()) as { content: { id: string }[] }

  return ideas.content[0]?.id ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Judging — API layer', () => {
  test('admin can assign org member as judge via API', async () => {
    // Use manager@test.hackhub who IS a member of Test Org
    const adminToken = await apiToken('admin')
    const users = await fetch(`${API}/api/v1/admin/users?size=200`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(r => r.json()) as { content: { id: string; email: string }[] }

    const mgr = users.content.find(u => u.email === 'manager@test.hackhub')
    test.skip(!mgr, 'Test manager not found — run test-up.sh first')

    // Remove if already assigned (idempotent setup)
    await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/judges/${mgr!.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` },
    }).catch(() => {})

    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/judges`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: mgr!.id }),
    })
    expect(res.status).toBe(201)
    const judge = await res.json() as { userId: string; hackathonId: string }
    expect(judge.userId).toBe(mgr!.id)
    expect(judge.hackathonId).toBe(HACK_ID)
  })

  test('non-judge participant cannot submit scores', async () => {
    // p3 (user3@test.hackhub) is a participant NOT assigned as judge
    const adminToken = await apiToken('admin')
    const ideaId = await ensureIdea(adminToken)
    test.skip(!ideaId, 'Could not create idea for hackathon')

    const token = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/scores`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, score: 8 }),
    })
    expect(res.status).toBe(403)
  })

  test('assigned judge (judge@test.hackhub) can submit a score', async () => {
    const adminToken = await apiToken('admin')
    const ideaId = await ensureIdea(adminToken)
    test.skip(!ideaId, 'Could not create idea for hackathon')

    // judge@test.hackhub is pre-assigned by test-up.sh
    const judgeToken = await apiToken('judge')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/scores`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${judgeToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, score: 9, comment: 'Great idea!' }),
    })
    expect(res.status).toBe(200)
    const score = await res.json() as { score: number; ideaId: string }
    expect(score.score).toBe(9)
  })

  test('score out of range (>10) is rejected', async () => {
    const adminToken = await apiToken('admin')
    const ideaId = await ensureIdea(adminToken)
    test.skip(!ideaId, 'Could not create idea for hackathon')

    const judgeToken = await apiToken('judge')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/scores`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${judgeToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, score: 11 }),
    })
    expect(res.status).toBe(400)
  })

  test('score summary reflects blended weights', async () => {
    const token = await apiToken('admin')
    await fetch(`${API}/api/v1/hackathons/${HACK_ID}/config`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgingMode: 'blended', panelWeight: 70 }),
    })
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/scores/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const items = await res.json() as { rank: number }[]
    expect(Array.isArray(items)).toBe(true)
    const ranks = items.map(i => i.rank)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI LAYER
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Judging — UI', () => {
  test('admin sees Judges section on Judge tab', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: 'Judge' }).click()
    await expect(page.getByText(/panel judges/i)).toBeVisible({ timeout: 6_000 })
  })

  test('participant cannot access the full judging panel page', async ({ page }) => {
    await login(page, 'p3')
    await page.goto(`/hackathons/${HACK_ID}/judge`)
    await expect(page.getByText(/access denied|only.*organizer|administrator/i).first())
      .toBeVisible({ timeout: 8_000 })
  })

  test('admin can access the full judging panel page', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/hackathons/${HACK_ID}/judge`)
    await expect(page.getByText(/judging panel/i)).toBeVisible({ timeout: 8_000 })
  })

  test('judge sees Judge tab and judging panel page', async ({ page }) => {
    await login(page, 'judge')
    await page.goto(`/hackathons/${HACK_ID}`)
    await expect(page.getByRole('tab', { name: 'Judge' })).toBeVisible({ timeout: 8_000 })
    await page.getByRole('tab', { name: 'Judge' }).click()
    await expect(page.getByRole('button', { name: /open full judging panel/i }))
      .toBeVisible({ timeout: 6_000 })
  })
})
