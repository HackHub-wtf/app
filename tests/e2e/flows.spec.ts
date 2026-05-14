/**
 * flows.spec.ts
 *
 * End-to-end coverage for user flows not covered elsewhere.
 * Probes real backend behavior — failures here are real bugs.
 *
 * Correct API paths (verified against controllers):
 *   Profile            GET/PATCH  /api/v1/profiles/me
 *   Hackathon config   embedded in GET /api/v1/hackathons/:id; PATCH /api/v1/hackathons/:id/config
 *   Voting criteria    GET/POST/DELETE /api/v1/hackathons/:id/voting-criteria
 *   Org settings       PATCH /api/v1/organizations/:id/settings  (requires visibility + joinPolicy)
 *   Join hackathon     POST /api/v1/hackathons/join  { registrationKey }
 *   Final submissions  GET/POST /api/v1/hackathons/:id/submissions
 *   Notifications      GET /api/v1/notifications
 *
 * Seed: test-up.sh must have run first.
 */

import { test, expect } from '@playwright/test'
import { login, apiToken, API, TEST_IDS } from './helpers'

const HACK_ID = TEST_IDS.hackathonId
const ORG_ID  = TEST_IDS.orgId

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Profile API', () => {
  test('GET /profiles/me returns current user data', async () => {
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/profiles/me`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { id: string; email: string; name: string }
    expect(data.email).toBe('user@test.hackhub')
    expect(data.id).toBeTruthy()
  })

  test('PATCH /profiles/me updates display name', async () => {
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/profiles/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User Updated' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { name: string }
    expect(data.name).toBe('Test User Updated')

    // Restore original name
    await fetch(`${API}/api/v1/profiles/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User' }),
    })
  })

  test('unauthenticated GET /profiles/me returns 401', async () => {
    const res = await fetch(`${API}/api/v1/profiles/me`)
    expect(res.status).toBe(401)
  })

  test('GET /profiles/:id returns any user profile', async () => {
    const adminTok = await apiToken('admin')
    // Resolve p1's current ID from admin API (no hardcoded UUID — safe after DB reset)
    const users = await fetch(`${API}/api/v1/admin/users?size=200`, {
      headers: { Authorization: `Bearer ${adminTok}` },
    }).then(r => r.json()) as { content: { id: string; email: string }[] }
    const p1 = users.content.find(u => u.email === 'user@test.hackhub')
    test.skip(!p1, 'p1 not found in admin users')

    const res = await fetch(`${API}/api/v1/profiles/${p1!.id}`, {
      headers: { Authorization: `Bearer ${adminTok}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { email: string }
    expect(data.email).toBe('user@test.hackhub')
  })

  test('profile page loads in UI', async ({ page }) => {
    await login(page, 'p1')
    await page.goto('/profile')
    await expect(page.getByText('user@test.hackhub').first()).toBeVisible({ timeout: 8_000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// HACKATHON CONFIG (embedded in hackathon GET; PATCH-only config endpoint)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Hackathon config', () => {
  test('GET /hackathons/:id includes judgingMode and panelWeight', async () => {
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { judgingMode: string; panelWeight: number }
    expect(['community', 'panel', 'blended']).toContain(data.judgingMode)
    expect(typeof data.panelWeight).toBe('number')
  })

  test('PATCH /hackathons/:id/config to community and back', async () => {
    const tok = await apiToken('admin')
    const patch = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/config`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgingMode: 'community' }),
    })
    expect(patch.status).toBe(200)

    // Verify it took effect
    const hack = await fetch(`${API}/api/v1/hackathons/${HACK_ID}`, {
      headers: { Authorization: `Bearer ${tok}` },
    }).then(r => r.json()) as { judgingMode: string }
    expect(hack.judgingMode).toBe('community')

    // Restore
    await fetch(`${API}/api/v1/hackathons/${HACK_ID}/config`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgingMode: 'blended', panelWeight: 70 }),
    })
  })

  test('participant cannot PATCH /hackathons/:id/config', async () => {
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/config`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgingMode: 'community' }),
    })
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VOTING CRITERIA
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Voting criteria API', () => {
  test('GET /voting-criteria returns array with seeded criteria', async () => {
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/voting-criteria`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(200)
    const items = await res.json() as { name: string; weight: number }[]
    expect(Array.isArray(items)).toBe(true)
    const names = items.map(c => c.name)
    expect(names).toContain('Innovation')
    expect(names).toContain('Execution')
    expect(names).toContain('Impact')
    const total = items.reduce((s, c) => s + c.weight, 0)
    expect(total).toBe(100)
  })

  test('participant can read voting criteria', async () => {
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/voting-criteria`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(200)
  })

  test('unauthenticated cannot read voting criteria', async () => {
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/voting-criteria`)
    expect(res.status).toBe(401)
  })

  test('participant cannot add criterion', async () => {
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/voting-criteria`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      // weight: 1 is valid so validation passes — auth check must fire
      body: JSON.stringify({ name: 'Sneaky Criterion', weight: 1, description: 'should fail' }),
    })
    expect(res.status).toBe(403)
  })

  test('admin can delete and re-add a criterion', async () => {
    const tok = await apiToken('admin')

    // Get Impact (weight 20) — delete it, then re-add it
    const existing = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/voting-criteria`, {
      headers: { Authorization: `Bearer ${tok}` },
    }).then(r => r.json()) as { id: string; name: string; weight: number }[]

    const impact = existing.find(c => c.name === 'Impact')
    if (!impact) { test.skip(true, 'Impact criterion not found'); return }

    // Delete Impact
    const del = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/voting-criteria/${impact.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect([200, 204]).toContain(del.status)

    // Re-add Impact with same weight
    const create = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/voting-criteria`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Impact', weight: 20, description: 'How impactful is the solution?', displayOrder: 2 }),
    })
    expect([200, 201]).toContain(create.status)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATION SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Organization settings API', () => {
  test('GET /organizations/:id returns org with visibility and joinPolicy', async () => {
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/organizations/${ORG_ID}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json() as { name: string; visibility: string; joinPolicy: string }
    expect(data.name).toBe('Test Org')
    expect(['open', 'closed', 'private']).toContain(data.visibility)
    expect(['invite_only', 'self_register', 'open']).toContain(data.joinPolicy)
  })

  test('PATCH /organizations/:id/settings updates visibility + joinPolicy', async () => {
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/organizations/${ORG_ID}/settings`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: 'open', joinPolicy: 'self_register' }),
    })
    expect(res.status).toBe(200)

    // Restore
    await fetch(`${API}/api/v1/organizations/${ORG_ID}/settings`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: 'closed', joinPolicy: 'self_register' }),
    })
  })

  test('member cannot PATCH org settings', async () => {
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/organizations/${ORG_ID}/settings`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: 'open', joinPolicy: 'self_register' }),
    })
    expect(res.status).toBe(403)
  })

  test('manager (non-owner) cannot PATCH org settings — owner only', async () => {
    // Settings update is restricted to org OWNER, not just any manager.
    // manager@test.hackhub has role=manager, not owner — correctly returns 403.
    const tok = await apiToken('manager')
    const res = await fetch(`${API}/api/v1/organizations/${ORG_ID}/settings`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: 'closed', joinPolicy: 'invite_only' }),
    })
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEAM LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Team lifecycle API', () => {
  test.describe.configure({ mode: 'serial' })
  let createdTeamId: string | null = null

  test.beforeAll(async () => {
    // Clean up any leftover teams from prior runs to avoid 409 on create
    const tok = await apiToken('admin')
    const teams = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/teams`, {
      headers: { Authorization: `Bearer ${tok}` },
    }).then(r => r.json()) as { id: string; name: string }[]
    for (const t of teams) {
      if (t.name === 'E2E Flow Team' || t.name === 'E2E Flow Team Renamed') {
        await fetch(`${API}/api/v1/teams/${t.id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${tok}` },
        }).catch(() => {})
      }
    }
  })

  test.afterAll(async () => {
    if (createdTeamId) {
      const tok = await apiToken('admin')
      await fetch(`${API}/api/v1/teams/${createdTeamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {})
    }
  })

  test('p3 (no team) can create a new team', async () => {
    const tok = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/teams`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Flow Team', description: 'Created by flow test', isOpen: true }),
    })
    expect(res.status).toBe(201)
    const team = await res.json() as { id: string; name: string }
    createdTeamId = team.id
    expect(team.name).toBe('E2E Flow Team')
  })

  test('team GET returns correct fields', async () => {
    if (!createdTeamId) { test.skip(true, 'Team not created'); return }
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/teams/${createdTeamId}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(200)
    const team = await res.json() as { id: string; hackathonId: string }
    expect(team.id).toBe(createdTeamId)
    expect(team.hackathonId).toBe(HACK_ID)
  })

  test('team leader can update team', async () => {
    if (!createdTeamId) { test.skip(true, 'Team not created'); return }
    const tok = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/teams/${createdTeamId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Flow Team Renamed', description: 'Updated', isOpen: true }),
    })
    expect(res.status).toBe(200)
  })

  test('p1 (already on Team Alpha) cannot join a second team in same hackathon', async () => {
    if (!createdTeamId) { test.skip(true, 'Team not created'); return }
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/teams/${createdTeamId}/members`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(409)
  })

  test('p3 can delete their own team', async () => {
    if (!createdTeamId) { test.skip(true, 'Team not created'); return }
    const tok = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/teams/${createdTeamId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect([200, 204]).toContain(res.status)
    createdTeamId = null
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// IDEA LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Idea lifecycle API', () => {
  test.describe.configure({ mode: 'serial' })
  let createdIdeaId: string | null = null
  const TEAM_ID = TEST_IDS.teamId

  test.afterAll(async () => {
    if (createdIdeaId) {
      const tok = await apiToken('p1')
      await fetch(`${API}/api/v1/ideas/${createdIdeaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {})
    }
  })

  test('team member can create an idea', async () => {
    if (!TEAM_ID) { test.skip(true, 'No team in state'); return }
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Flow Idea',
        description: 'Testing the idea creation flow',
        category: 'AI',
        teamId: TEAM_ID,
        tags: ['e2e', 'flow'],
      }),
    })
    expect([200, 201]).toContain(res.status)
    const idea = await res.json() as { id: string; title: string }
    createdIdeaId = idea.id
    expect(idea.title).toBe('E2E Flow Idea')
  })

  test('idea appears in hackathon idea list', async () => {
    if (!createdIdeaId) { test.skip(true, 'Idea not created'); return }
    const tok = await apiToken('p1')
    const ideas = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
      headers: { Authorization: `Bearer ${tok}` },
    }).then(r => r.json()) as { content: { id: string }[] }
    expect(ideas.content.some(i => i.id === createdIdeaId)).toBe(true)
  })

  test('participant can vote on an idea', async () => {
    if (!createdIdeaId) { test.skip(true, 'Idea not created'); return }
    const tok = await apiToken('p2')
    const res = await fetch(`${API}/api/v1/ideas/${createdIdeaId}/votes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect([200, 201, 204]).toContain(res.status)
  })

  test('double-vote is graceful — never 500', async () => {
    if (!createdIdeaId) { test.skip(true, 'Idea not created'); return }
    const tok = await apiToken('p2')
    const second = await fetch(`${API}/api/v1/ideas/${createdIdeaId}/votes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(second.status).not.toBe(500)
    expect([200, 201, 204, 400, 409]).toContain(second.status)
  })

  test('idea owner can update the idea', async () => {
    if (!createdIdeaId) { test.skip(true, 'Idea not created'); return }
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/ideas/${createdIdeaId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'E2E Flow Idea Updated', description: 'updated', category: 'AI' }),
    })
    expect(res.status).toBe(200)
  })

  test('other participant cannot delete another team\'s idea', async () => {
    if (!createdIdeaId) { test.skip(true, 'Idea not created'); return }
    const tok = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/ideas/${createdIdeaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// HACKATHON STATUS TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Hackathon status transitions', () => {
  test.describe.configure({ mode: 'serial' })
  let tempHackId: string | null = null

  test.afterAll(async () => {
    if (tempHackId) {
      const tok = await apiToken('admin')
      await fetch(`${API}/api/v1/hackathons/${tempHackId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {})
    }
  })

  test('admin creates a draft hackathon', async () => {
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Status Flow Hack',
        description: 'testing status transitions',
        startDate: '2026-09-01T00:00:00Z',
        endDate:   '2026-09-08T00:00:00Z',
        maxTeamSize: 5,
        allowedParticipants: 50,
        organizationId: ORG_ID,
      }),
    })
    expect(res.status).toBe(201)
    const hack = await res.json() as { id: string; status: string }
    tempHackId = hack.id
    expect(hack.status).toBe('draft')
  })

  test('draft → open', async () => {
    if (!tempHackId) { test.skip(true, 'No hackathon'); return }
    const tok = await apiToken('admin')
    expect(await fetch(`${API}/api/v1/hackathons/${tempHackId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    }).then(r => r.status)).toBe(200)
  })

  test('open → running', async () => {
    if (!tempHackId) { test.skip(true, 'No hackathon'); return }
    const tok = await apiToken('admin')
    expect(await fetch(`${API}/api/v1/hackathons/${tempHackId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'running' }),
    }).then(r => r.status)).toBe(200)
  })

  test('running → completed', async () => {
    if (!tempHackId) { test.skip(true, 'No hackathon'); return }
    const tok = await apiToken('admin')
    expect(await fetch(`${API}/api/v1/hackathons/${tempHackId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    }).then(r => r.status)).toBe(200)
  })

  test('backward transition (completed → open) is rejected', async () => {
    if (!tempHackId) { test.skip(true, 'No hackathon'); return }
    const tok = await apiToken('admin')
    const res = await fetch(`${API}/api/v1/hackathons/${tempHackId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    })
    expect([400, 409, 422]).toContain(res.status)
  })

  test('participant cannot change hackathon status', async () => {
    if (!tempHackId) { test.skip(true, 'No hackathon'); return }
    const tok = await apiToken('p1')
    expect(await fetch(`${API}/api/v1/hackathons/${tempHackId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    }).then(r => r.status)).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// JOIN VIA REGISTRATION KEY
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Registration key', () => {
  test('POST /hackathons/join with valid key returns 200 or 409', async () => {
    const key = TEST_IDS.registrationKey
    if (!key) { test.skip(true, 'No registration key in state'); return }
    const tok = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/hackathons/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationKey: key }),
    })
    expect([200, 201, 409]).toContain(res.status)
  })

  test('invalid registration key returns 400 or 404', async () => {
    const tok = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/hackathons/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationKey: 'INVALID000' }),
    })
    expect([400, 404]).toContain(res.status)
  })

  test('unauthenticated join returns 401', async () => {
    const res = await fetch(`${API}/api/v1/hackathons/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationKey: 'ANYKEY' }),
    })
    expect(res.status).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Final submissions API', () => {
  test('GET /submissions returns array to authenticated users', async () => {
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/submissions`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
  })

  test('GET /submissions/my returns 204 for user with no submission', async () => {
    const tok = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/submissions/my`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    // 204 = no submission, 200 = has submission, 404 = also valid
    expect([200, 204, 404]).toContain(res.status)
  })

  test('unauthenticated cannot list submissions', async () => {
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/submissions`)
    expect(res.status).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Notifications API', () => {
  test('GET /notifications returns 200 with content field', async () => {
    const tok = await apiToken('p1')
    const res = await fetch(`${API}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    expect(res.status).toBe(200)
    // Notifications returns a Page response: { content: [], pageable: {...} }
    const data = await res.json() as { content?: unknown[]; length?: number }
    const items = Array.isArray(data) ? data : (data.content ?? [])
    expect(Array.isArray(items)).toBe(true)
  })

  test('unauthenticated returns 401', async () => {
    const res = await fetch(`${API}/api/v1/notifications`)
    expect(res.status).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCORING WITH CRITERIA
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Scoring with criteria', () => {
  test('judge can score an idea', async () => {
    const adminTok = await apiToken('admin')
    const judgeTok = await apiToken('judge')

    const ideas = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
      headers: { Authorization: `Bearer ${adminTok}` },
    }).then(r => r.json()) as { content: { id: string }[] }
    const ideaId = ideas.content[0]?.id
    if (!ideaId) { test.skip(true, 'No ideas to score'); return }

    // Simple score — the backend uses top-level `score` field (criteriaScores is separate)
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/scores`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${judgeTok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, score: 8, comment: 'Strong concept' }),
    })
    expect([200, 201]).toContain(res.status)
    const scored = await res.json() as { score: number; ideaId: string }
    expect(scored.score).toBe(8)
    expect(scored.ideaId).toBe(ideaId)
  })

  test('non-judge participant cannot submit scores', async () => {
    const adminTok = await apiToken('admin')
    const ideas = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/ideas`, {
      headers: { Authorization: `Bearer ${adminTok}` },
    }).then(r => r.json()) as { content: { id: string }[] }
    const ideaId = ideas.content[0]?.id
    if (!ideaId) { test.skip(true, 'No ideas'); return }

    const tok = await apiToken('p3')
    const res = await fetch(`${API}/api/v1/hackathons/${HACK_ID}/judging/scores`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, score: 8 }),
    })
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// MANAGER SCOPING
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Manager hackathon scoping', () => {
  test.describe.configure({ mode: 'serial' })
  let mgrHackId: string | null = null

  test.afterAll(async () => {
    if (mgrHackId) {
      const tok = await apiToken('admin')
      await fetch(`${API}/api/v1/hackathons/${mgrHackId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {})
    }
  })

  test('manager creates hackathon in own org', async () => {
    const tok = await apiToken('manager')
    const res = await fetch(`${API}/api/v1/hackathons`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Mgr Scoping Hack',
        description: 'manager-created',
        startDate: '2026-10-01T00:00:00Z',
        endDate:   '2026-10-08T00:00:00Z',
        maxTeamSize: 4,
        allowedParticipants: 20,
        organizationId: ORG_ID,
      }),
    })
    expect(res.status).toBe(201)
    const hack = await res.json() as { id: string; organizationId: string }
    mgrHackId = hack.id
    expect(hack.organizationId).toBe(ORG_ID)
  })

  test('p1 (org member) can see manager-created hackathon', async () => {
    if (!mgrHackId) { test.skip(true, 'Hackathon not created'); return }
    const tok = await apiToken('p1')
    const hacks = await fetch(`${API}/api/v1/hackathons?size=100`, {
      headers: { Authorization: `Bearer ${tok}` },
    }).then(r => r.json()) as { content: { id: string }[] }
    expect(hacks.content.some(h => h.id === mgrHackId)).toBe(true)
  })

  test('manager cannot create hackathon for a different org', async () => {
    // Use a random org ID that the manager is not part of
    const tok = await apiToken('manager')
    const res = await fetch(`${API}/api/v1/hackathons`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Cross-org Hack',
        description: 'should fail',
        startDate: '2026-10-01T00:00:00Z',
        endDate:   '2026-10-08T00:00:00Z',
        maxTeamSize: 4,
        allowedParticipants: 20,
        organizationId: '00000000-0000-0000-0000-000000000000',
      }),
    })
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard UI', () => {
  test('admin dashboard loads without errors', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const errors = await page.getByText(/500|internal server error/i).count()
    expect(errors).toBe(0)
    await expect(page.locator('main')).toBeVisible()
  })

  test('participant dashboard loads and shows a hackathon', async ({ page }) => {
    await login(page, 'p1')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Dashboard should show at least one hackathon entry (Test Hackathon or others)
    await expect(page.locator('main').getByText(/hackathon/i).first()).toBeVisible({ timeout: 10_000 })
    const errors = await page.getByText(/500|internal server error/i).count()
    expect(errors).toBe(0)
  })

  test('manager dashboard loads without errors', async ({ page }) => {
    await login(page, 'manager')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const errors = await page.getByText(/500|internal server error/i).count()
    expect(errors).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — ORG SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Org Settings UI', () => {
  test('admin (org owner) sees Visibility, Join Policy, and Save button', async ({ page }) => {
    await login(page, 'admin')
    await page.goto(`/organizations/${ORG_ID}`)
    await page.getByRole('tab', { name: /settings/i }).click()
    await expect(page.getByText('Visibility').first()).toBeVisible({ timeout: 6_000 })
    await expect(page.getByText('Join Policy').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /save/i }).first()).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — TEAM CREATION
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Team creation UI', () => {
  // NOTE: The Teams tab in hackathon detail (/hackathons/:id) does not switch
  // content when clicked for users who haven't joined the hackathon via the
  // registration flow. Use the direct route /hackathons/:id/teams instead.

  test('teams route shows Team Alpha', async ({ page }) => {
    await login(page, 'p3')
    await page.goto(`/hackathons/${HACK_ID}/teams`)
    await page.waitForLoadState('networkidle')
    const errors = await page.getByText(/500|internal server error/i).count()
    expect(errors).toBe(0)
    await expect(page.getByText('Team Alpha').first()).toBeVisible({ timeout: 8_000 })
  })

  test('p3 sees Join Team or Manage Team on teams route', async ({ page }) => {
    await login(page, 'p3')
    await page.goto(`/hackathons/${HACK_ID}/teams`)
    await page.waitForLoadState('networkidle')
    // p3 may or may not have a team from prior test state
    const hasCreate = await page.getByRole('button', { name: /create team/i }).first().isVisible({ timeout: 4_000 }).catch(() => false)
    const hasJoin = await page.getByRole('button', { name: /join team/i }).first().isVisible({ timeout: 2_000 }).catch(() => false)
    const hasManage = await page.getByRole('button', { name: /manage team|view my team/i }).first().isVisible({ timeout: 2_000 }).catch(() => false)
    expect(hasCreate || hasJoin || hasManage).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — IDEAS TAB
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Ideas tab UI', () => {
  test('ideas tab loads without crash and shows ideas', async ({ page }) => {
    await login(page, 'p1')
    await page.goto(`/hackathons/${HACK_ID}`)
    await page.getByRole('tab', { name: /ideas/i }).click()
    await page.waitForLoadState('networkidle')
    const errors = await page.getByText(/500|internal server error/i).count()
    expect(errors).toBe(0)
    await expect(page.getByRole('tab', { name: /ideas/i, selected: true })).toBeVisible({ timeout: 4_000 })
    // Either ideas exist (show cards) or empty state shows "Submit an Idea"
    const hasIdeas = await page.locator('[class*="card"], .mantine-Card-root').first().isVisible({ timeout: 4_000 }).catch(() => false)
    const hasEmpty = await page.getByText(/no ideas yet|submit.*idea/i).first().isVisible({ timeout: 2_000 }).catch(() => false)
    expect(hasIdeas || hasEmpty).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UI — JUDGE PANEL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Judge scoring panel UI', () => {
  test('judge can navigate to full judging panel without 500', async ({ page }) => {
    await login(page, 'judge')
    await page.goto(`/hackathons/${HACK_ID}/judge`)
    await expect(page.getByText(/judging panel/i).first()).toBeVisible({ timeout: 8_000 })
    const errors = await page.getByText(/500|internal server error/i).count()
    expect(errors).toBe(0)
  })
})
