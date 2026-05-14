import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HackathonService } from './hackathonService'
import type { Hackathon, CreateHackathonInput } from './hackathonService'

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
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

const BASE_HACKATHON: Hackathon = {
  id: 'h-1',
  title: 'Test Hackathon',
  description: 'A test',
  startDate: '2026-06-01T00:00:00Z',
  endDate: '2026-06-03T00:00:00Z',
  registrationKey: 'REG-KEY',
  status: 'open',
  maxTeamSize: 5,
  allowedParticipants: 100,
  currentParticipants: 10,
  createdBy: 'user-1',
  organizationId: null,
  bannerUrl: null,
  rules: null,
  prizes: [],
  tags: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  visibility: 'private',
  joinPolicy: 'self_register',
  judgingMode: 'community',
  panelWeight: 70,
}

describe('HackathonService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHackathons', () => {
    it('calls correct endpoint with defaults', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [BASE_HACKATHON], totalElements: 1, totalPages: 1, number: 0, size: 20 })
      const result = await HackathonService.getHackathons()
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons?page=0&size=20')
      expect(result.content).toHaveLength(1)
      expect(result.content[0].id).toBe('h-1')
    })

    it('passes custom page and size', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 10 })
      await HackathonService.getHackathons(2, 10)
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons?page=2&size=10')
    })
  })

  describe('getHackathon', () => {
    it('calls correct endpoint with id', async () => {
      mockApi.get.mockResolvedValueOnce(BASE_HACKATHON)
      const result = await HackathonService.getHackathon('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1')
      expect(result.title).toBe('Test Hackathon')
    })
  })

  describe('getHackathonsByStatus', () => {
    it('includes status in query string', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 })
      await HackathonService.getHackathonsByStatus('running')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons?status=running&page=0&size=20')
    })
  })

  describe('createHackathon', () => {
    it('posts to correct endpoint and returns hackathon', async () => {
      const input: CreateHackathonInput = {
        title: 'New Hackathon',
        description: 'desc',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-03T00:00:00Z',
        maxTeamSize: 4,
        allowedParticipants: 50,
      }
      mockApi.post.mockResolvedValueOnce({ ...BASE_HACKATHON, ...input, id: 'h-2' })
      const result = await HackathonService.createHackathon(input)
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/hackathons', input)
      expect(result.id).toBe('h-2')
    })
  })

  describe('updateHackathon', () => {
    it('puts to correct endpoint with partial data', async () => {
      mockApi.put.mockResolvedValueOnce({ ...BASE_HACKATHON, title: 'Updated' })
      const result = await HackathonService.updateHackathon('h-1', { title: 'Updated' })
      expect(mockApi.put).toHaveBeenCalledWith('/api/v1/hackathons/h-1', { title: 'Updated' })
      expect(result.title).toBe('Updated')
    })
  })

  describe('deleteHackathon', () => {
    it('calls delete on correct endpoint', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await HackathonService.deleteHackathon('h-1')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/hackathons/h-1')
    })
  })

  describe('joinHackathon', () => {
    it('posts registration key and returns hackathon', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_HACKATHON)
      const result = await HackathonService.joinHackathon('REG-KEY')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/hackathons/join', { registrationKey: 'REG-KEY' })
      expect(result.id).toBe('h-1')
    })
  })

  describe('transitionStatus', () => {
    it('patches status on correct endpoint', async () => {
      mockApi.patch.mockResolvedValueOnce({ ...BASE_HACKATHON, status: 'running' })
      const result = await HackathonService.transitionStatus('h-1', 'running')
      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/hackathons/h-1/status', { status: 'running' })
      expect(result.status).toBe('running')
    })
  })
})
