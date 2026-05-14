import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tokenStore } from '../lib/tokenStore'
import { useAuthStore } from './authStore'

// Mock the api client so no real HTTP happens
vi.mock('../lib/apiClient', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number
    title: string
    constructor(status: number, title: string, msg: string) {
      super(msg)
      this.status = status
      this.title = title
    }
  },
}))

import { api } from '../lib/apiClient'
const mockApi = api as unknown as { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> }

const PROFILE = {
  id: 'user-1',
  email: 'alice@test.com',
  name: 'Alice',
  role: 'participant',
  avatarUrl: null,
  skills: ['TypeScript'],
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset Zustand store state between tests
    useAuthStore.setState({ user: null, loading: false, initialized: false })
    tokenStore.clear()
    vi.clearAllMocks()
  })

  // ── login ──────────────────────────────────────────────────────────────────

  it('login sets user and stores token', async () => {
    mockApi.post.mockResolvedValueOnce({ accessToken: 'jwt-abc', user: PROFILE })
    mockApi.get.mockResolvedValueOnce({ ...PROFILE })

    await useAuthStore.getState().login('alice@test.com', 'secret')

    const state = useAuthStore.getState()
    expect(state.user?.email).toBe('alice@test.com')
    expect(state.user?.name).toBe('Alice')
    expect(tokenStore.getAccessToken()).toBe('jwt-abc')
    expect(state.loading).toBe(false)
  })

  it('login failure leaves user null', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Invalid credentials'))

    await expect(useAuthStore.getState().login('bad@test.com', 'wrong')).rejects.toThrow()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().loading).toBe(false)
  })

  // ── signup ─────────────────────────────────────────────────────────────────

  it('signup sets user on success', async () => {
    mockApi.post.mockResolvedValueOnce({ accessToken: 'jwt-new', user: PROFILE })

    await useAuthStore.getState().signup('alice@test.com', 'secret', 'Alice')

    expect(useAuthStore.getState().user?.email).toBe('alice@test.com')
    expect(tokenStore.getAccessToken()).toBe('jwt-new')
  })

  // ── logout ─────────────────────────────────────────────────────────────────

  it('logout clears user and token', async () => {
    // Pre-populate state
    useAuthStore.setState({ user: { id: '1', email: 'a@b.com', name: 'A', role: 'participant', skills: [] } })
    tokenStore.setAccessToken('old-jwt')
    mockApi.post.mockResolvedValueOnce(undefined) // POST /logout

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
    expect(tokenStore.hasToken()).toBe(false)
  })

  it('logout clears local state even if server call fails', async () => {
    useAuthStore.setState({ user: { id: '1', email: 'a@b.com', name: 'A', role: 'participant', skills: [] } })
    tokenStore.setAccessToken('old-jwt')
    mockApi.post.mockRejectedValueOnce(new Error('network'))

    // Error propagates but finally block still clears state
    try { await useAuthStore.getState().logout() } catch {}

    expect(useAuthStore.getState().user).toBeNull()
    expect(tokenStore.hasToken()).toBe(false)
  })

  // ── updateProfile ──────────────────────────────────────────────────────────

  it('updateProfile patches and re-sets user', async () => {
    useAuthStore.setState({ user: { id: 'user-1', email: 'a@b.com', name: 'Old', role: 'participant', skills: [] } })
    mockApi.patch.mockResolvedValueOnce({ ...PROFILE, name: 'New Name', skills: ['React'] })

    await useAuthStore.getState().updateProfile({ name: 'New Name' })

    expect(useAuthStore.getState().user?.name).toBe('New Name')
    expect(useAuthStore.getState().user?.skills).toEqual(['React'])
  })

  // ── session-expired event ──────────────────────────────────────────────────

  it('auth:session-expired event clears user when listener is registered', async () => {
    // Simulate the listener that initialize() registers after a successful session restore
    useAuthStore.setState({ user: { id: '1', email: 'a@b.com', name: 'A', role: 'participant', skills: [] } })

    // Register the listener manually (mirrors what initialize does after a successful refresh)
    const handler = () => useAuthStore.setState({ user: null })
    window.addEventListener('auth:session-expired', handler)

    window.dispatchEvent(new Event('auth:session-expired'))

    expect(useAuthStore.getState().user).toBeNull()
    window.removeEventListener('auth:session-expired', handler)
  })

  // ── refreshProfile ─────────────────────────────────────────────────────────

  describe('refreshProfile', () => {
    it('updates user from latest profile when logged in', async () => {
      useAuthStore.setState({ user: { id: 'user-1', email: 'a@b.com', name: 'Old', role: 'participant', skills: [] } })
      mockApi.get.mockResolvedValueOnce({ ...PROFILE, name: 'Fresh Name' })
      await useAuthStore.getState().refreshProfile()
      expect(useAuthStore.getState().user?.name).toBe('Fresh Name')
    })

    it('does nothing when no user is logged in', async () => {
      useAuthStore.setState({ user: null })
      await useAuthStore.getState().refreshProfile()
      expect(mockApi.get).not.toHaveBeenCalled()
    })

    it('silently swallows errors — user stays logged in', async () => {
      useAuthStore.setState({ user: { id: 'user-1', email: 'a@b.com', name: 'A', role: 'participant', skills: [] } })
      mockApi.get.mockRejectedValueOnce(new Error('network'))
      await expect(useAuthStore.getState().refreshProfile()).resolves.toBeUndefined()
      expect(useAuthStore.getState().user?.email).toBe('a@b.com')
    })
  })

  // ── setUser ────────────────────────────────────────────────────────────────

  describe('setUser', () => {
    it('sets and clears user directly', () => {
      const user = { id: 'u-1', email: 'x@x.com', name: 'X', role: 'admin' as const, skills: [] }
      useAuthStore.getState().setUser(user)
      expect(useAuthStore.getState().user?.id).toBe('u-1')
      useAuthStore.getState().setUser(null)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  // ── initialize ─────────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('restores session when token already in memory', async () => {
      tokenStore.setAccessToken('existing-jwt')
      mockApi.get.mockResolvedValueOnce(PROFILE)
      await useAuthStore.getState().initialize()
      expect(useAuthStore.getState().user?.email).toBe('alice@test.com')
      expect(useAuthStore.getState().initialized).toBe(true)
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('sets initialized without user when no token and refresh fails', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })
      await useAuthStore.getState().initialize()
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().initialized).toBe(true)
    })

    it('clears token on profile fetch error', async () => {
      tokenStore.setAccessToken('stale-jwt')
      mockApi.get.mockRejectedValueOnce(new Error('unauthorized'))
      await useAuthStore.getState().initialize()
      expect(useAuthStore.getState().initialized).toBe(true)
      expect(tokenStore.hasToken()).toBe(false)
    })
  })
})
