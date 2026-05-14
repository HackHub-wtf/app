import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TeamService } from './teamService'
import type { Team, TeamWithMembers, TeamMember, CreateTeamInput } from './teamService'

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
  delete: ReturnType<typeof vi.fn>
}

const BASE_TEAM: Team = {
  id: 't-1',
  name: 'Alpha Team',
  description: 'First team',
  hackathonId: 'h-1',
  createdBy: 'user-1',
  isOpen: true,
  skills: ['TypeScript'],
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const BASE_MEMBER: TeamMember = {
  id: 'tm-1',
  teamId: 't-1',
  userId: 'user-1',
  role: 'leader',
  joinedAt: '2026-01-01T00:00:00Z',
}

const TEAM_WITH_MEMBERS: TeamWithMembers = {
  ...BASE_TEAM,
  members: [BASE_MEMBER],
}

describe('TeamService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTeams', () => {
    it('calls correct endpoint with hackathonId', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_TEAM])
      const result = await TeamService.getTeams('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/teams')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Alpha Team')
    })

    it('returns empty array when no teams', async () => {
      mockApi.get.mockResolvedValueOnce([])
      const result = await TeamService.getTeams('h-empty')
      expect(result).toEqual([])
    })
  })

  describe('getTeam', () => {
    it('calls correct endpoint with team id', async () => {
      mockApi.get.mockResolvedValueOnce(TEAM_WITH_MEMBERS)
      const result = await TeamService.getTeam('t-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/teams/t-1')
      expect(result.members).toHaveLength(1)
      expect(result.members[0].role).toBe('leader')
    })
  })

  describe('createTeam', () => {
    it('posts to hackathon-scoped endpoint', async () => {
      const input: CreateTeamInput = {
        name: 'Beta Team',
        description: 'Second team',
        hackathonId: 'h-1',
        skills: ['React'],
      }
      mockApi.post.mockResolvedValueOnce({ ...BASE_TEAM, ...input, id: 't-2' })
      const result = await TeamService.createTeam(input)
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/hackathons/h-1/teams', input)
      expect(result.id).toBe('t-2')
    })
  })

  describe('updateTeam', () => {
    it('puts to correct team endpoint', async () => {
      mockApi.put.mockResolvedValueOnce({ ...BASE_TEAM, name: 'Renamed' })
      const result = await TeamService.updateTeam('t-1', { name: 'Renamed' })
      expect(mockApi.put).toHaveBeenCalledWith('/api/v1/teams/t-1', { name: 'Renamed' })
      expect(result.name).toBe('Renamed')
    })
  })

  describe('joinTeam', () => {
    it('posts to members endpoint and returns TeamMember', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_MEMBER)
      const result = await TeamService.joinTeam('t-1')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/teams/t-1/members')
      expect(result.userId).toBe('user-1')
    })
  })

  describe('leaveTeam', () => {
    it('deletes from members/me endpoint', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await TeamService.leaveTeam('t-1')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/teams/t-1/members/me')
    })
  })

  describe('getTeamMembers', () => {
    it('returns list of members for a team', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_MEMBER])
      const result = await TeamService.getTeamMembers('t-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/teams/t-1/members')
      expect(result).toHaveLength(1)
      expect(result[0].role).toBe('leader')
    })
  })

  describe('removeTeamMember', () => {
    it('deletes specific member from team', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await TeamService.removeTeamMember('t-1', 'user-2')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/teams/t-1/members/user-2')
    })
  })
})
