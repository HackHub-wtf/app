import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Idea = Database['public']['Tables']['ideas']['Row']
type IdeaInsert = Database['public']['Tables']['ideas']['Insert']
type IdeaUpdate = Database['public']['Tables']['ideas']['Update']
type Comment = Database['public']['Tables']['comments']['Row']

// New types for flexible voting system
export interface VotingCriteria {
  id: string
  hackathon_id: string
  name: string
  description: string | null
  weight: number
  display_order: number
  created_at: string
  updated_at: string
}

export interface IdeaScore {
  id: string
  idea_id: string
  user_id: string
  criteria_id: string
  score: number
  created_at: string
  updated_at: string
}

export interface IdeaScoreWithCriteria extends IdeaScore {
  voting_criteria: VotingCriteria
}

export interface UserScores {
  [criteriaId: string]: number
}

export interface IdeaWithDetails extends Idea {
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  }
  comments: (Comment & {
    profiles: {
      id: string
      name: string
      avatar_url: string | null
    }
  })[]
  user_has_voted: boolean
  // New fields for flexible voting
  total_score?: number
  vote_count?: number
  user_scores?: UserScores
  criteria_scores?: { [criteriaId: string]: number[] }
}

export class IdeaService {
  // Get ideas for a hackathon
  static async getIdeas(hackathonId: string, userId?: string): Promise<IdeaWithDetails[]> {
    // Temporarily disable voting to prevent 406 errors
    console.log('Fetching ideas for hackathon:', hackathonId, 'user:', userId || 'anonymous')
    
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        ),
        comments (
          *,
          profiles:user_id (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq('hackathon_id', hackathonId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ideas:', error)
      return []
    }

    // Check if user has voted for each idea
    const ideasWithVotes = data.map((idea) => {
      // Temporarily disable voting functionality to prevent 406 errors
      // TODO: Re-enable when idea_votes table is properly configured
      return { ...idea, user_has_voted: false }
    })

    return ideasWithVotes as IdeaWithDetails[]
  }

  // Get idea by ID
  static async getIdea(id: string, userId?: string): Promise<IdeaWithDetails | null> {
    // Temporarily disable voting to prevent 406 errors
    console.log('Fetching idea:', id, 'for user:', userId || 'anonymous')
    
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        ),
        comments (
          *,
          profiles:user_id (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching idea:', error)
      return null
    }

    // Check if user has voted
    // Temporarily disable voting functionality to prevent 406 errors
    // TODO: Re-enable when idea_votes table is properly configured
    const userHasVoted = false

    return { ...data, user_has_voted: userHasVoted } as IdeaWithDetails
  }

  // Create new idea
  static async createIdea(idea: IdeaInsert): Promise<Idea | null> {
    const { data, error } = await supabase
      .from('ideas')
      .insert(idea)
      .select()
      .single()

    if (error) {
      console.error('Error creating idea:', error)
      throw error
    }

    return data
  }

  // Update idea
  static async updateIdea(id: string, updates: IdeaUpdate): Promise<Idea | null> {
    const { data, error } = await supabase
      .from('ideas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating idea:', error)
      throw error
    }

    return data
  }

  // Delete idea
  static async deleteIdea(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting idea:', error)
      throw error
    }

    return true
  }

    // Vote for idea (temporarily disabled to prevent 406 errors)
  static async voteIdea(ideaId: string, userId: string): Promise<boolean> {
    // TODO: Re-enable when idea_votes table is properly configured
    console.warn('Voting feature is temporarily disabled for idea:', ideaId, 'user:', userId)
    throw new Error('Voting feature is currently unavailable')
  }

  // Add comment to idea
  static async addComment(ideaId: string, userId: string, content: string): Promise<Comment | null> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        idea_id: ideaId,
        user_id: userId,
        content
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      throw error
    }

    return data
  }

  // Update comment
  static async updateComment(id: string, content: string): Promise<Comment | null> {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      throw error
    }

    return data
  }

  // Delete comment
  static async deleteComment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting comment:', error)
      throw error
    }

    return true
  }

  // Get ideas by team
  static async getTeamIdeas(teamId: string): Promise<IdeaWithDetails[]> {
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        ),
        comments (
          *,
          profiles:user_id (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching team ideas:', error)
      return []
    }

    return data.map(idea => ({ ...idea, user_has_voted: false })) as IdeaWithDetails[]
  }
}
