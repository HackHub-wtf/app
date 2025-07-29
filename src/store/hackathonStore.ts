import { create } from 'zustand'
import { HackathonService } from '../services/hackathonService'
import { TeamService, type TeamWithMembers } from '../services/teamService'
import { IdeaService, type IdeaWithDetails } from '../services/ideaService'

// Updated interfaces to match Supabase schema
export interface Hackathon {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  registration_key: string
  status: 'draft' | 'open' | 'running' | 'completed'
  max_team_size: number
  allowed_participants: number
  current_participants: number
  created_by: string
  banner_url?: string
  rules?: string
  prizes: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  description: string
  hackathon_id: string
  members: TeamMember[]
  created_by: string
  is_open: boolean
  skills: string[]
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  user_id: string
  name: string
  email: string
  role: 'leader' | 'member'
  skills: string[]
  avatar_url?: string
}

export interface Idea {
  id: string
  title: string
  description: string
  hackathon_id: string
  team_id?: string
  created_by: string
  category: string
  tags: string[]
  votes: number
  user_has_voted: boolean
  status: 'draft' | 'submitted' | 'in-progress' | 'completed'
  attachments: string[]
  comments: Comment[]
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
  avatar_url?: string
}

interface HackathonState {
  hackathons: Hackathon[]
  currentHackathon: Hackathon | null
  teams: TeamWithMembers[]
  ideas: IdeaWithDetails[]
  loading: boolean
  
  // Hackathon actions
  fetchHackathons: () => Promise<void>
  fetchHackathon: (id: string) => Promise<void>
  createHackathon: (hackathon: Omit<Hackathon, 'id' | 'created_at' | 'updated_at' | 'current_participants'>) => Promise<void>
  updateHackathon: (id: string, updates: Partial<Hackathon>) => Promise<void>
  joinHackathon: (registrationKey: string) => Promise<void>
  
  // Team actions
  fetchTeams: (hackathonId: string) => Promise<void>
  createTeam: (team: Omit<Team, 'id' | 'created_at' | 'updated_at' | 'members'>) => Promise<void>
  updateTeam: (id: string, updates: Partial<Team>) => Promise<void>
  joinTeam: (teamId: string, userId: string) => Promise<void>
  leaveTeam: (teamId: string, userId: string) => Promise<void>
  
  // Idea actions
  fetchIdeas: (hackathonId: string, userId?: string) => Promise<void>
  createIdea: (idea: Omit<Idea, 'id' | 'created_at' | 'updated_at' | 'votes' | 'user_has_voted' | 'comments'>) => Promise<void>
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>
  voteIdea: (ideaId: string, userId: string) => Promise<void>
  addComment: (ideaId: string, userId: string, content: string) => Promise<void>
  
  // State setters
  setCurrentHackathon: (hackathon: Hackathon | null) => void
  setLoading: (loading: boolean) => void
}

export const useHackathonStore = create<HackathonState>((set, get) => ({
  hackathons: [],
  currentHackathon: null,
  teams: [],
  ideas: [],
  loading: false,

  // Hackathon actions
  fetchHackathons: async () => {
    try {
      set({ loading: true })
      const hackathons = await HackathonService.getHackathons()
      set({ hackathons: hackathons as Hackathon[] })
    } catch (error) {
      console.error('Error fetching hackathons:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchHackathon: async (id: string) => {
    try {
      set({ loading: true })
      const hackathon = await HackathonService.getHackathon(id)
      set({ currentHackathon: hackathon as Hackathon })
    } catch (error) {
      console.error('Error fetching hackathon:', error)
    } finally {
      set({ loading: false })
    }
  },

  createHackathon: async (hackathonData) => {
    try {
      set({ loading: true })
      const hackathon = await HackathonService.createHackathon({
        title: hackathonData.title,
        description: hackathonData.description,
        start_date: hackathonData.start_date,
        end_date: hackathonData.end_date,
        registration_key: hackathonData.registration_key,
        status: hackathonData.status,
        max_team_size: hackathonData.max_team_size,
        allowed_participants: hackathonData.allowed_participants,
        created_by: hackathonData.created_by,
        banner_url: hackathonData.banner_url,
        rules: hackathonData.rules,
        prizes: hackathonData.prizes,
        tags: hackathonData.tags
      })
      
      if (hackathon) {
        set(state => ({ 
          hackathons: [...state.hackathons, hackathon as Hackathon]
        }))
      }
    } catch (error) {
      console.error('Error creating hackathon:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateHackathon: async (id: string, updates) => {
    try {
      set({ loading: true })
      const updatedHackathon = await HackathonService.updateHackathon(id, updates)
      
      if (updatedHackathon) {
        set(state => ({
          hackathons: state.hackathons.map(h => h.id === id ? updatedHackathon as Hackathon : h),
          currentHackathon: state.currentHackathon?.id === id ? updatedHackathon as Hackathon : state.currentHackathon
        }))
      }
    } catch (error) {
      console.error('Error updating hackathon:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  joinHackathon: async (registrationKey: string) => {
    try {
      set({ loading: true })
      const hackathon = await HackathonService.joinHackathon(registrationKey)
      if (hackathon) {
        set({ currentHackathon: hackathon as Hackathon })
      }
    } catch (error) {
      console.error('Error joining hackathon:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // Team actions
  fetchTeams: async (hackathonId: string) => {
    try {
      set({ loading: true })
      const teams = await TeamService.getTeams(hackathonId)
      set({ teams })
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      set({ loading: false })
    }
  },

  createTeam: async (teamData) => {
    try {
      set({ loading: true })
      const team = await TeamService.createTeam({
        name: teamData.name,
        description: teamData.description,
        hackathon_id: teamData.hackathon_id,
        created_by: teamData.created_by,
        is_open: teamData.is_open,
        skills: teamData.skills,
        avatar_url: teamData.avatar_url
      })
      
      if (team) {
        // Refresh teams list
        await get().fetchTeams(teamData.hackathon_id)
      }
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateTeam: async (id: string, updates) => {
    try {
      set({ loading: true })
      await TeamService.updateTeam(id, updates)
      
      // Update local state
      set(state => ({
        teams: state.teams.map(t => t.id === id ? { ...t, ...updates } : t)
      }))
    } catch (error) {
      console.error('Error updating team:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  joinTeam: async (teamId: string, userId: string) => {
    try {
      set({ loading: true })
      await TeamService.addTeamMember(teamId, userId)
      
      // Find the team's hackathon and refresh teams
      const team = get().teams.find(t => t.id === teamId)
      if (team) {
        await get().fetchTeams(team.hackathon_id)
      }
    } catch (error) {
      console.error('Error joining team:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  leaveTeam: async (teamId: string, userId: string) => {
    try {
      set({ loading: true })
      await TeamService.removeTeamMember(teamId, userId)
      
      // Find the team's hackathon and refresh teams
      const team = get().teams.find(t => t.id === teamId)
      if (team) {
        await get().fetchTeams(team.hackathon_id)
      }
    } catch (error) {
      console.error('Error leaving team:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // Idea actions
  fetchIdeas: async (hackathonId: string, userId?: string) => {
    try {
      set({ loading: true })
      const ideas = await IdeaService.getIdeas(hackathonId, userId)
      set({ ideas })
    } catch (error) {
      console.error('Error fetching ideas:', error)
    } finally {
      set({ loading: false })
    }
  },

  createIdea: async (ideaData) => {
    try {
      set({ loading: true })
      const idea = await IdeaService.createIdea({
        title: ideaData.title,
        description: ideaData.description,
        hackathon_id: ideaData.hackathon_id,
        team_id: ideaData.team_id,
        created_by: ideaData.created_by,
        category: ideaData.category,
        tags: ideaData.tags,
        status: ideaData.status,
        attachments: ideaData.attachments
      })
      
      if (idea) {
        // Refresh ideas list
        await get().fetchIdeas(ideaData.hackathon_id)
      }
    } catch (error) {
      console.error('Error creating idea:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateIdea: async (id: string, updates) => {
    try {
      set({ loading: true })
      await IdeaService.updateIdea(id, updates)
      
      // Refresh the idea from the server to get updated data with proper types
      const idea = get().ideas.find(i => i.id === id)
      if (idea) {
        const updatedIdea = await IdeaService.getIdea(id)
        if (updatedIdea) {
          set(state => ({
            ideas: state.ideas.map(i => i.id === id ? updatedIdea : i)
          }))
        }
      }
    } catch (error) {
      console.error('Error updating idea:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  voteIdea: async (ideaId: string, userId: string) => {
    try {
      const hasVoted = await IdeaService.voteIdea(ideaId, userId)
      
      // Update local state optimistically
      set(state => ({
        ideas: state.ideas.map(idea => 
          idea.id === ideaId 
            ? { 
                ...idea, 
                votes: hasVoted ? idea.votes + 1 : idea.votes - 1,
                user_has_voted: hasVoted
              }
            : idea
        )
      }))
    } catch (error) {
      console.error('Error voting on idea:', error)
      throw error
    }
  },

  addComment: async (ideaId: string, userId: string, content: string) => {
    try {
      await IdeaService.addComment(ideaId, userId, content)
      
      // Refresh the specific idea to get updated comments
      const idea = get().ideas.find(i => i.id === ideaId)
      if (idea) {
        const updatedIdea = await IdeaService.getIdea(ideaId, userId)
        if (updatedIdea) {
          set(state => ({
            ideas: state.ideas.map(i => i.id === ideaId ? updatedIdea : i)
          }))
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  },

  // State setters
  setCurrentHackathon: (hackathon) => set({ currentHackathon: hackathon }),
  setLoading: (loading) => set({ loading })
}))
