import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Team = Database['public']['Tables']['teams']['Row']
type TeamInsert = Database['public']['Tables']['teams']['Insert']
type TeamUpdate = Database['public']['Tables']['teams']['Update']
type TeamMember = Database['public']['Tables']['team_members']['Row']

export interface TeamWithMembers extends Team {
  team_members: (TeamMember & {
    profiles: {
      id: string
      name: string
      email: string
      avatar_url: string | null
      skills: string[]
    }
  })[]
}

export class TeamService {
  // Get teams for a hackathon
  static async getTeams(hackathonId: string): Promise<TeamWithMembers[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          *,
          profiles (
            id,
            name,
            email,
            avatar_url,
            skills
          )
        )
      `)
      .eq('hackathon_id', hackathonId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching teams:', error)
      return []
    }

    return data as TeamWithMembers[]
  }

  // Get team by ID
  static async getTeam(id: string): Promise<TeamWithMembers | null> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          *,
          profiles (
            id,
            name,
            email,
            avatar_url,
            skills
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching team:', error)
      return null
    }

    return data as TeamWithMembers
  }

  // Create new team
  static async createTeam(team: TeamInsert): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert(team)
        .select()
        .single()

      if (error) {
        console.error('Error creating team:', error)
        throw error
      }

      // Add creator as team leader
      if (data) {
        try {
          await this.addTeamMember(data.id, team.created_by, 'leader')
        } catch (memberError) {
          console.error('Error adding team leader:', memberError)
          // If adding team member fails, we should still return the team
          // but log the error for debugging
        }
      }

      return data
    } catch (error) {
      console.error('Error in createTeam:', error)
      throw error
    }
  }

  // Update team
  static async updateTeam(id: string, updates: TeamUpdate): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating team:', error)
      throw error
    }

    return data
  }

  // Delete team
  static async deleteTeam(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting team:', error)
      throw error
    }

    return true
  }

  // Add team member
  static async addTeamMember(teamId: string, userId: string, role: 'leader' | 'member' = 'member'): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding team member:', error)
      throw error
    }

    return data
  }

  // Remove team member
  static async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing team member:', error)
      throw error
    }

    return true
  }

  // Update team member role
  static async updateTeamMemberRole(teamId: string, userId: string, role: 'leader' | 'member'): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating team member role:', error)
      throw error
    }

    return data
  }

  // Get user's teams
  static async getUserTeams(userId: string): Promise<TeamWithMembers[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        teams (
          *,
          team_members (
            *,
            profiles (
              id,
              name,
              email,
              avatar_url,
              skills
            )
          )
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user teams:', error)
      return []
    }

    return (data?.filter(item => item.teams).map(item => item.teams) || []) as unknown as TeamWithMembers[]
  }

  // Check if user is team member
  static async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single()

    return !error && !!data
  }
}
