import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHackathonStore } from './hackathonStore'
import type { Hackathon } from '../services/hackathonService'
import type { TeamWithMembers } from '../services/teamService'
import type { Idea } from '../services/ideaService'

vi.mock('../services/hackathonService', () => ({
  HackathonService: {
    getHackathons: vi.fn(),
    getHackathon: vi.fn(),
    createHackathon: vi.fn(),
    updateHackathon: vi.fn(),
    joinHackathon: vi.fn(),
  },
}))

vi.mock('../services/teamService', () => ({
  TeamService: {
    getTeams: vi.fn(),
    getTeam: vi.fn(),
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    joinTeam: vi.fn(),
    leaveTeam: vi.fn(),
  },
}))

vi.mock('../services/ideaService', () => ({
  IdeaService: {
    getIdeas: vi.fn(),
    getIdea: vi.fn(),
    createIdea: vi.fn(),
    updateIdea: vi.fn(),
    voteIdea: vi.fn(),
    addComment: vi.fn(),
  },
}))

import { HackathonService } from '../services/hackathonService'
import { TeamService } from '../services/teamService'
import { IdeaService } from '../services/ideaService'

const mockHackathonService = HackathonService as unknown as {
  getHackathons: ReturnType<typeof vi.fn>
  getHackathon: ReturnType<typeof vi.fn>
  createHackathon: ReturnType<typeof vi.fn>
  updateHackathon: ReturnType<typeof vi.fn>
  joinHackathon: ReturnType<typeof vi.fn>
}
const mockTeamService = TeamService as unknown as {
  getTeams: ReturnType<typeof vi.fn>
  getTeam: ReturnType<typeof vi.fn>
  createTeam: ReturnType<typeof vi.fn>
  updateTeam: ReturnType<typeof vi.fn>
  joinTeam: ReturnType<typeof vi.fn>
  leaveTeam: ReturnType<typeof vi.fn>
}
const mockIdeaService = IdeaService as unknown as {
  getIdeas: ReturnType<typeof vi.fn>
  getIdea: ReturnType<typeof vi.fn>
  createIdea: ReturnType<typeof vi.fn>
  updateIdea: ReturnType<typeof vi.fn>
  voteIdea: ReturnType<typeof vi.fn>
  addComment: ReturnType<typeof vi.fn>
}

const BASE_HACKATHON: Hackathon = {
  id: 'h-1',
  title: 'Test Hackathon',
  description: 'desc',
  startDate: '2026-06-01T00:00:00Z',
  endDate: '2026-06-03T00:00:00Z',
  registrationKey: 'KEY',
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

const BASE_TEAM_WITH_MEMBERS: TeamWithMembers = {
  id: 't-1',
  name: 'Alpha',
  description: 'team',
  hackathonId: 'h-1',
  createdBy: 'user-1',
  isOpen: true,
  skills: [],
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [],
}

const BASE_IDEA: Idea = {
  id: 'idea-1',
  title: 'Cool Idea',
  description: 'desc',
  hackathonId: 'h-1',
  teamId: 't-1',
  createdBy: 'user-1',
  category: 'Tech',
  tags: [],
  votes: 0,
  status: 'submitted',
  attachments: [],
  repositoryUrl: null,
  demoUrl: null,
  projectAttachments: null,
  totalScore: 0,
  voteCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  userHasVoted: false,
}

describe('hackathonStore', () => {
  beforeEach(() => {
    useHackathonStore.setState({
      hackathons: [],
      currentHackathon: null,
      teams: [],
      ideas: [],
      loading: false,
    })
    vi.clearAllMocks()
  })

  // ── fetchHackathons ────────────────────────────────────────────────────────

  describe('fetchHackathons', () => {
    it('loads hackathons into state', async () => {
      mockHackathonService.getHackathons.mockResolvedValueOnce({
        content: [BASE_HACKATHON],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
      })
      await useHackathonStore.getState().fetchHackathons()
      expect(useHackathonStore.getState().hackathons).toHaveLength(1)
      expect(useHackathonStore.getState().hackathons[0].id).toBe('h-1')
      expect(useHackathonStore.getState().loading).toBe(false)
    })

    it('does not throw on service error — logs and resets loading', async () => {
      mockHackathonService.getHackathons.mockRejectedValueOnce(new Error('network'))
      await expect(useHackathonStore.getState().fetchHackathons()).resolves.toBeUndefined()
      expect(useHackathonStore.getState().loading).toBe(false)
    })
  })

  // ── fetchHackathon ─────────────────────────────────────────────────────────

  describe('fetchHackathon', () => {
    it('sets currentHackathon', async () => {
      mockHackathonService.getHackathon.mockResolvedValueOnce(BASE_HACKATHON)
      await useHackathonStore.getState().fetchHackathon('h-1')
      expect(useHackathonStore.getState().currentHackathon?.id).toBe('h-1')
    })

    it('does not throw on service error', async () => {
      mockHackathonService.getHackathon.mockRejectedValueOnce(new Error('not found'))
      await expect(useHackathonStore.getState().fetchHackathon('missing')).resolves.toBeUndefined()
    })
  })

  // ── createHackathon ────────────────────────────────────────────────────────

  describe('createHackathon', () => {
    it('appends new hackathon to state', async () => {
      const newHackathon = { ...BASE_HACKATHON, id: 'h-2' }
      mockHackathonService.createHackathon.mockResolvedValueOnce(newHackathon)
      await useHackathonStore.getState().createHackathon({
        title: 'H2',
        description: 'x',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-03T00:00:00Z',
        maxTeamSize: 4,
        allowedParticipants: 50,
      })
      expect(useHackathonStore.getState().hackathons).toHaveLength(1)
      expect(useHackathonStore.getState().hackathons[0].id).toBe('h-2')
    })

    it('rethrows on error', async () => {
      mockHackathonService.createHackathon.mockRejectedValueOnce(new Error('forbidden'))
      await expect(useHackathonStore.getState().createHackathon({
        title: 'x',
        description: 'x',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-03T00:00:00Z',
        maxTeamSize: 4,
        allowedParticipants: 50,
      })).rejects.toThrow('forbidden')
    })
  })

  // ── setCurrentHackathon ────────────────────────────────────────────────────

  describe('setCurrentHackathon', () => {
    it('sets and clears currentHackathon', () => {
      useHackathonStore.getState().setCurrentHackathon(BASE_HACKATHON)
      expect(useHackathonStore.getState().currentHackathon?.id).toBe('h-1')
      useHackathonStore.getState().setCurrentHackathon(null)
      expect(useHackathonStore.getState().currentHackathon).toBeNull()
    })
  })

  // ── fetchTeams ─────────────────────────────────────────────────────────────

  describe('fetchTeams', () => {
    it('loads teams with members into state', async () => {
      mockTeamService.getTeams.mockResolvedValueOnce([{ ...BASE_TEAM_WITH_MEMBERS }])
      mockTeamService.getTeam.mockResolvedValueOnce(BASE_TEAM_WITH_MEMBERS)
      await useHackathonStore.getState().fetchTeams('h-1')
      expect(useHackathonStore.getState().teams).toHaveLength(1)
      expect(useHackathonStore.getState().teams[0].id).toBe('t-1')
    })
  })

  // ── createTeam ─────────────────────────────────────────────────────────────

  describe('createTeam', () => {
    it('creates team and re-fetches team list', async () => {
      mockTeamService.createTeam.mockResolvedValueOnce(BASE_TEAM_WITH_MEMBERS)
      mockTeamService.getTeams.mockResolvedValueOnce([BASE_TEAM_WITH_MEMBERS])
      mockTeamService.getTeam.mockResolvedValueOnce(BASE_TEAM_WITH_MEMBERS)
      await useHackathonStore.getState().createTeam({
        name: 'Alpha',
        description: 'team',
        hackathonId: 'h-1',
      })
      expect(mockTeamService.createTeam).toHaveBeenCalledOnce()
    })

    it('rethrows on error', async () => {
      mockTeamService.createTeam.mockRejectedValueOnce(new Error('team exists'))
      await expect(useHackathonStore.getState().createTeam({
        name: 'Alpha',
        description: 'team',
        hackathonId: 'h-1',
      })).rejects.toThrow('team exists')
    })
  })

  // ── fetchIdeas ─────────────────────────────────────────────────────────────

  describe('fetchIdeas', () => {
    it('loads ideas into state', async () => {
      mockIdeaService.getIdeas.mockResolvedValueOnce({
        content: [BASE_IDEA],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
      })
      await useHackathonStore.getState().fetchIdeas('h-1')
      expect(useHackathonStore.getState().ideas).toHaveLength(1)
      expect(useHackathonStore.getState().ideas[0].id).toBe('idea-1')
    })
  })

  // ── createIdea ─────────────────────────────────────────────────────────────

  describe('createIdea', () => {
    it('creates idea and re-fetches idea list', async () => {
      mockIdeaService.createIdea.mockResolvedValueOnce(BASE_IDEA)
      mockIdeaService.getIdeas.mockResolvedValueOnce({
        content: [BASE_IDEA],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
      })
      await useHackathonStore.getState().createIdea({
        title: 'Cool Idea',
        description: 'desc',
        hackathonId: 'h-1',
        category: 'Tech',
      })
      expect(mockIdeaService.createIdea).toHaveBeenCalledOnce()
      expect(useHackathonStore.getState().ideas).toHaveLength(1)
    })
  })

  // ── voteIdea ───────────────────────────────────────────────────────────────

  describe('voteIdea', () => {
    it('updates vote count in state', async () => {
      useHackathonStore.setState({ ideas: [BASE_IDEA] })
      mockIdeaService.voteIdea.mockResolvedValueOnce({ voted: true, voteCount: 1 })
      await useHackathonStore.getState().voteIdea('idea-1')
      const ideas = useHackathonStore.getState().ideas
      expect(ideas[0].userHasVoted).toBe(true)
      expect(ideas[0].votes).toBe(1)
    })

    it('rethrows on error', async () => {
      mockIdeaService.voteIdea.mockRejectedValueOnce(new Error('cannot vote'))
      await expect(useHackathonStore.getState().voteIdea('idea-1')).rejects.toThrow('cannot vote')
    })
  })

  // ── setLoading ─────────────────────────────────────────────────────────────

  describe('setLoading', () => {
    it('manually sets loading state', () => {
      useHackathonStore.getState().setLoading(true)
      expect(useHackathonStore.getState().loading).toBe(true)
      useHackathonStore.getState().setLoading(false)
      expect(useHackathonStore.getState().loading).toBe(false)
    })
  })
})
