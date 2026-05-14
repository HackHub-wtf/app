import { create } from 'zustand'
import {
  HackathonService,
  type Hackathon,
  type CreateHackathonInput,
} from '../services/hackathonService'
import { TeamService, type TeamWithMembers, type CreateTeamInput } from '../services/teamService'
import { IdeaService, type Idea, type CreateIdeaInput } from '../services/ideaService'

// Re-export so pages that import these types from here continue to compile.
export type { Hackathon } from '../services/hackathonService'
export type { Idea } from '../services/ideaService'

interface HackathonState {
  hackathons: Hackathon[]
  currentHackathon: Hackathon | null
  teams: TeamWithMembers[]
  ideas: Idea[]
  loading: boolean

  fetchHackathons: () => Promise<void>
  fetchHackathon: (id: string) => Promise<void>
  createHackathon: (hackathon: CreateHackathonInput) => Promise<void>
  updateHackathon: (id: string, updates: Partial<CreateHackathonInput>) => Promise<void>
  joinHackathon: (registrationKey: string) => Promise<void>

  fetchTeams: (hackathonId: string) => Promise<void>
  createTeam: (team: CreateTeamInput) => Promise<void>
  updateTeam: (id: string, updates: Partial<CreateTeamInput>) => Promise<void>
  joinTeam: (teamId: string) => Promise<void>
  leaveTeam: (teamId: string) => Promise<void>

  fetchIdeas: (hackathonId: string) => Promise<void>
  createIdea: (idea: CreateIdeaInput) => Promise<void>
  updateIdea: (id: string, updates: Partial<CreateIdeaInput>) => Promise<void>
  voteIdea: (ideaId: string) => Promise<void>
  addComment: (ideaId: string, content: string) => Promise<void>

  setCurrentHackathon: (hackathon: Hackathon | null) => void
  setLoading: (loading: boolean) => void
}

export const useHackathonStore = create<HackathonState>((set, get) => ({
  hackathons: [],
  currentHackathon: null,
  teams: [],
  ideas: [],
  loading: false,

  fetchHackathons: async () => {
    try {
      set({ loading: true })
      const page = await HackathonService.getHackathons()
      set({ hackathons: page.content })
    } catch (error) {
      console.error('Error fetching hackathons:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchHackathon: async (id) => {
    try {
      set({ loading: true })
      const hackathon = await HackathonService.getHackathon(id)
      set({ currentHackathon: hackathon })
    } catch (error) {
      console.error('Error fetching hackathon:', error)
    } finally {
      set({ loading: false })
    }
  },

  createHackathon: async (hackathonData) => {
    try {
      set({ loading: true })
      const hackathon = await HackathonService.createHackathon(hackathonData)
      set(state => ({ hackathons: [...state.hackathons, hackathon] }))
    } catch (error) {
      console.error('Error creating hackathon:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateHackathon: async (id, updates) => {
    try {
      set({ loading: true })
      const updated = await HackathonService.updateHackathon(id, updates)
      set(state => ({
        hackathons: state.hackathons.map(h => h.id === id ? updated : h),
        currentHackathon: state.currentHackathon?.id === id ? updated : state.currentHackathon,
      }))
    } catch (error) {
      console.error('Error updating hackathon:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  joinHackathon: async (registrationKey) => {
    try {
      set({ loading: true })
      const hackathon = await HackathonService.joinHackathon(registrationKey)
      set(state => ({
        hackathons: state.hackathons.map(h => h.id === hackathon.id ? hackathon : h),
        currentHackathon: state.currentHackathon?.id === hackathon.id ? hackathon : state.currentHackathon,
      }))
    } catch (error) {
      console.error('Error joining hackathon:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchTeams: async (hackathonId) => {
    try {
      set({ loading: true })
      const teams = await TeamService.getTeams(hackathonId)
      // Enrich each team with its member list (separate endpoint)
      const withMembers: TeamWithMembers[] = await Promise.all(
        teams.map(async (t) => {
          const members = await TeamService.getTeamMembers(t.id).catch(() => [])
          return { ...t, members }
        })
      )
      set({ teams: withMembers })
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      set({ loading: false })
    }
  },

  createTeam: async (teamData) => {
    try {
      set({ loading: true })
      await TeamService.createTeam(teamData)
      await get().fetchTeams(teamData.hackathonId)
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateTeam: async (id, updates) => {
    try {
      set({ loading: true })
      const updated = await TeamService.updateTeam(id, updates)
      set(state => ({
        teams: state.teams.map(t => t.id === id ? { ...t, ...updated } : t),
      }))
    } catch (error) {
      console.error('Error updating team:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  joinTeam: async (teamId) => {
    try {
      set({ loading: true })
      await TeamService.joinTeam(teamId)
      const team = get().teams.find(t => t.id === teamId)
      if (team) await get().fetchTeams(team.hackathonId)
    } catch (error) {
      console.error('Error joining team:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  leaveTeam: async (teamId) => {
    try {
      set({ loading: true })
      await TeamService.leaveTeam(teamId)
      const team = get().teams.find(t => t.id === teamId)
      if (team) await get().fetchTeams(team.hackathonId)
    } catch (error) {
      console.error('Error leaving team:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchIdeas: async (hackathonId) => {
    try {
      set({ loading: true })
      const page = await IdeaService.getIdeas(hackathonId)
      set({ ideas: page.content })
    } catch (error) {
      console.error('Error fetching ideas:', error)
    } finally {
      set({ loading: false })
    }
  },

  createIdea: async (ideaData) => {
    try {
      set({ loading: true })
      await IdeaService.createIdea(ideaData)
      await get().fetchIdeas(ideaData.hackathonId)
    } catch (error) {
      console.error('Error creating idea:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateIdea: async (id, updates) => {
    try {
      set({ loading: true })
      const updated = await IdeaService.updateIdea(id, updates)
      set(state => ({
        ideas: state.ideas.map(i => i.id === id ? updated : i),
      }))
    } catch (error) {
      console.error('Error updating idea:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  voteIdea: async (ideaId) => {
    try {
      const result = await IdeaService.voteIdea(ideaId)
      set(state => ({
        ideas: state.ideas.map(idea =>
          idea.id === ideaId
            ? { ...idea, votes: result.voteCount, userHasVoted: result.voted }
            : idea
        ),
      }))
    } catch (error) {
      console.error('Error voting on idea:', error)
      throw error
    }
  },

  addComment: async (ideaId, content) => {
    try {
      await IdeaService.addComment(ideaId, content)
      const updated = await IdeaService.getIdea(ideaId)
      set(state => ({
        ideas: state.ideas.map(i => i.id === ideaId ? updated : i),
      }))
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  },

  setCurrentHackathon: (hackathon) => set({ currentHackathon: hackathon }),
  setLoading: (loading) => set({ loading }),
}))
