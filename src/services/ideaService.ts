import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Idea = Database['public']['Tables']['ideas']['Row']
type IdeaInsert = Database['public']['Tables']['ideas']['Insert']
type IdeaUpdate = Database['public']['Tables']['ideas']['Update']
type Comment = Database['public']['Tables']['comments']['Row']

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
}

export class IdeaService {
  // Get ideas for a hackathon
  static async getIdeas(hackathonId: string, userId?: string): Promise<IdeaWithDetails[]> {
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
    const ideasWithVotes = await Promise.all(
      data.map(async (idea) => {
        let userHasVoted = false
        if (userId) {
          const { data: vote } = await supabase
            .from('idea_votes')
            .select('id')
            .eq('idea_id', idea.id)
            .eq('user_id', userId)
            .single()
          userHasVoted = !!vote
        }
        return { ...idea, user_has_voted: userHasVoted }
      })
    )

    return ideasWithVotes as IdeaWithDetails[]
  }

  // Get idea by ID
  static async getIdea(id: string, userId?: string): Promise<IdeaWithDetails | null> {
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
    let userHasVoted = false
    if (userId) {
      const { data: vote } = await supabase
        .from('idea_votes')
        .select('id')
        .eq('idea_id', id)
        .eq('user_id', userId)
        .single()
      userHasVoted = !!vote
    }

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

  // Vote for idea
  static async voteIdea(ideaId: string, userId: string): Promise<boolean> {
    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('idea_votes')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .single()

    if (existingVote) {
      // Remove vote
      const { error } = await supabase
        .from('idea_votes')
        .delete()
        .eq('idea_id', ideaId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error removing vote:', error)
        throw error
      }
      return false
    } else {
      // Add vote
      const { error } = await supabase
        .from('idea_votes')
        .insert({
          idea_id: ideaId,
          user_id: userId
        })

      if (error) {
        console.error('Error adding vote:', error)
        throw error
      }
      return true
    }
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
