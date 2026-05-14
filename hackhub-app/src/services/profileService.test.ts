import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProfileService } from './profileService'
import type { Profile } from './profileService'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../lib/apiClient'
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
}

const BASE_PROFILE: Profile = {
  id: 'u-1',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'participant',
  avatarUrl: null,
  skills: ['TypeScript', 'React'],
  organizationId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('ProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentProfile', () => {
    it('calls /profiles/me', async () => {
      mockApi.get.mockResolvedValueOnce(BASE_PROFILE)
      const result = await ProfileService.getCurrentProfile()
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/profiles/me')
      expect(result.id).toBe('u-1')
      expect(result.email).toBe('alice@example.com')
    })
  })

  describe('getProfile', () => {
    it('calls correct profile endpoint', async () => {
      mockApi.get.mockResolvedValueOnce(BASE_PROFILE)
      const result = await ProfileService.getProfile('u-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/profiles/u-1')
      expect(result.name).toBe('Alice')
    })
  })

  describe('updateProfile', () => {
    it('patches /profiles/me with updates', async () => {
      const updated = { ...BASE_PROFILE, name: 'Alice B', skills: ['Go'] }
      mockApi.patch.mockResolvedValueOnce(updated)
      const result = await ProfileService.updateProfile({ name: 'Alice B', skills: ['Go'] })
      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/profiles/me', { name: 'Alice B', skills: ['Go'] })
      expect(result.name).toBe('Alice B')
    })

    it('updates avatar url', async () => {
      const updated = { ...BASE_PROFILE, avatarUrl: 'https://cdn/avatar.png' }
      mockApi.patch.mockResolvedValueOnce(updated)
      const result = await ProfileService.updateProfile({ avatarUrl: 'https://cdn/avatar.png' })
      expect(result.avatarUrl).toBe('https://cdn/avatar.png')
    })
  })
})
