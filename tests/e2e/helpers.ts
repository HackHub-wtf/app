import { type Page, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// ── Test state (written by test-up.sh) ──────────────────────────────────────
const STATE_PATH = path.resolve(__dirname, '.test-state.json')

export interface TestState {
  createdAt: string
  users: {
    admin:   UserRecord
    manager: UserRecord
    judge:   UserRecord
    p1:      UserRecord
    p2:      UserRecord
    p3:      UserRecord
  }
  org: { id: string; slug: string; name: string }
  hackathon: {
    id: string; title: string; registrationKey: string
    judgingMode: string; panelWeight: number
  }
  team: { id: string; name: string }
  ideas: { idea1: string; idea2: string }
  criteria: { innovation: string; execution: string; impact: string }
}

interface UserRecord {
  id: string
  email: string
  password: string
  role: string
}

function loadState(): TestState | null {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) as TestState
  } catch {
    return null
  }
}

export const state: TestState | null = loadState()

// ── User accounts ─────────────────────────────────────────────────────────────
// Stable test accounts (created by test-up.sh). All share the password "Password123".
// Falls back to seeded demo accounts when state file doesn't exist.
const DEMO_USERS = {
  admin:   { email: 'admin@hackhub.wtf',   password: 'Admin1234!',   role: 'admin'       },
  manager: { email: 'manager@hackhub.wtf', password: 'Manager1234!', role: 'manager'     },
  alice:   { email: 'alice@example.com',   password: 'Alice1234!',   role: 'participant' },
  bob:     { email: 'bob@example.com',     password: 'Bob12345!',    role: 'participant' },
  carol:   { email: 'carol@example.com',   password: 'Carol123!',    role: 'participant' },
} as const

export const USERS = state
  ? {
      admin:   state.users.admin,
      manager: state.users.manager,
      judge:   state.users.judge,
      p1:      state.users.p1,  // user@test.hackhub — team leader
      p2:      state.users.p2,  // user2@test.hackhub — team member
      p3:      state.users.p3,  // user3@test.hackhub — solo, no team
      // demo aliases — kept for any older spec that references them
      alice:   state.users.p1,
      bob:     state.users.p2,
      carol:   state.users.p3,
    }
  : {
      ...DEMO_USERS,
      judge: DEMO_USERS.manager,
      p1:    DEMO_USERS.alice,
      p2:    DEMO_USERS.bob,
      p3:    DEMO_USERS.carol,
    }

export type UserKey = keyof typeof USERS

export const API = process.env.API_URL ?? 'http://localhost:8080'

// ── Convenience IDs ───────────────────────────────────────────────────────────
export const TEST_IDS = {
  hackathonId:     state?.hackathon.id              ?? 'ddb43593-786e-41f8-8030-1f8ebb07befe',
  orgId:           state?.org.id                    ?? '8c34f33a-a1c1-4b9b-844e-0b28866853c6',
  teamId:          state?.team.id                   ?? null,
  idea1Id:         state?.ideas.idea1 || null,
  idea2Id:         state?.ideas.idea2 || null,
  registrationKey: state?.hackathon.registrationKey ?? null,
}

// ── Login helper ─────────────────────────────────────────────────────────────
export async function login(page: Page, user: UserKey) {
  const { email, password } = USERS[user]
  // Clear cookies (including httpOnly refresh_token) to ensure a clean session
  await page.context().clearCookies()
  await page.goto('/login')
  // Wait for the login form — if redirected immediately, auth cleared correctly
  await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible({ timeout: 10_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByPlaceholder(/password/i).first().fill(password)
  await page.getByRole('button', { name: /login|sign in/i }).click()
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 12_000 })
}

// ── API token helper (bypasses UI) ────────────────────────────────────────────
export async function apiToken(user: UserKey): Promise<string> {
  const { email, password } = USERS[user]
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Login failed for ${email}: HTTP ${res.status}`)
  const data = await res.json() as { accessToken: string }
  return data.accessToken
}

// ── Wait for Mantine notification toast ───────────────────────────────────────
export async function expectNotification(page: Page, pattern: RegExp | string) {
  const toast = page.locator('[class*="notification"]').filter({ hasText: pattern }).first()
  await expect(toast).toBeVisible({ timeout: 8_000 })
}
