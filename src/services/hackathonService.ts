import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Hackathon = Database['public']['Tables']['hackathons']['Row']
type HackathonInsert = Database['public']['Tables']['hackathons']['Insert']
type HackathonUpdate = Database['public']['Tables']['hackathons']['Update']

export class HackathonService {
  // Get all hackathons
  static async getHackathons(): Promise<Hackathon[]> {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching hackathons:', error)
      return []
    }

    return data
  }

  // Get hackathon by ID
  static async getHackathon(id: string): Promise<Hackathon | null> {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching hackathon:', error)
      return null
    }

    return data
  }

  // Create new hackathon
  static async createHackathon(hackathon: HackathonInsert): Promise<Hackathon | null> {
    const { data, error } = await supabase
      .from('hackathons')
      .insert(hackathon)
      .select()
      .single()

    if (error) {
      console.error('Error creating hackathon:', error)
      throw error
    }

    return data
  }

  // Update hackathon
  static async updateHackathon(id: string, updates: HackathonUpdate): Promise<Hackathon | null> {
    const { data, error } = await supabase
      .from('hackathons')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating hackathon:', error)
      throw error
    }

    return data
  }

  // Delete hackathon
  static async deleteHackathon(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('hackathons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting hackathon:', error)
      throw error
    }

    return true
  }

  // Get hackathons by status
  static async getHackathonsByStatus(status: string): Promise<Hackathon[]> {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching hackathons by status:', error)
      return []
    }

    return data
  }

  // Join hackathon with registration key (validates access to team creation/joining)
  // Note: Actual participation happens through team membership, not direct hackathon joining
  static async joinHackathon(registrationKey: string): Promise<Hackathon | null> {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .eq('registration_key', registrationKey)
      .single()

    if (error) {
      console.error('Error finding hackathon with key:', error)
      throw new Error('Invalid registration key')
    }

    // Check if hackathon is open for registration
    if (data.status !== 'open') {
      throw new Error('Hackathon is not open for registration')
    }

    // The registration key just validates access - actual participation happens through team membership
    // Return the hackathon data so the user can proceed to create/join teams
    return data
  }

  // Check if user is participant of hackathon (via team membership)
  static async isUserParticipant(hackathonId: string, userId: string): Promise<boolean> {
    // Check if user is a member of any team in this hackathon
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team_id,
        teams!inner(hackathon_id)
      `)
      .eq('user_id', userId)
      .eq('teams.hackathon_id', hackathonId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking participant status:', error)
      return false
    }

    return !!data
  }

  // Get hackathon participants (users who are members of teams in this hackathon)
  static async getHackathonParticipants(hackathonId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        user_id,
        role,
        joined_at,
        teams!inner(hackathon_id, name),
        profiles!inner(id, name, email, avatar_url)
      `)
      .eq('teams.hackathon_id', hackathonId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching hackathon participants:', error)
      return []
    }

    return data
  }

  // Get user's hackathons (hackathons where user is a team member)
  static async getUserHackathons(userId: string): Promise<Hackathon[]> {
    // First get all team IDs the user is a member of
    const { data: teamMemberships, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)

    if (memberError) {
      console.error('Error fetching user team memberships:', memberError)
      return []
    }

    if (!teamMemberships.length) {
      return []
    }

    // Get unique hackathon IDs from teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('hackathon_id')
      .in('id', teamMemberships.map(tm => tm.team_id))

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return []
    }

    const hackathonIds = [...new Set(teams.map(team => team.hackathon_id))]

    if (!hackathonIds.length) {
      return []
    }

    // Get hackathons
    const { data: hackathons, error: hackathonsError } = await supabase
      .from('hackathons')
      .select('*')
      .in('id', hackathonIds)

    if (hackathonsError) {
      console.error('Error fetching hackathons:', hackathonsError)
      return []
    }

    return hackathons
  }

  // Update hackathon status based on dates
  static async updateHackathonStatuses(): Promise<void> {
    const now = new Date().toISOString()
    
    try {
      // Update to 'running' for hackathons that have started
      await supabase
        .from('hackathons')
        .update({ status: 'running' })
        .eq('status', 'open')
        .lte('start_date', now)

      // Update to 'completed' for hackathons that have ended
      await supabase
        .from('hackathons')
        .update({ status: 'completed' })
        .eq('status', 'running')
        .lte('end_date', now)
    } catch (error) {
      console.error('Error updating hackathon statuses:', error)
    }
  }

  // Check and update specific hackathon status
  static async checkHackathonStatus(hackathon: Hackathon): Promise<string> {
    const now = new Date()
    const startDate = new Date(hackathon.start_date)
    const endDate = new Date(hackathon.end_date)
    
    let newStatus = hackathon.status
    
    if (hackathon.status === 'open' && now >= startDate) {
      newStatus = 'running'
    } else if (hackathon.status === 'running' && now >= endDate) {
      newStatus = 'completed'
    }
    
    // Update status if it changed
    if (newStatus !== hackathon.status) {
      try {
        await supabase
          .from('hackathons')
          .update({ status: newStatus })
          .eq('id', hackathon.id)
      } catch (error) {
        console.error('Error updating hackathon status:', error)
      }
    }
    
    return newStatus
  }

  // Generate unique registration key
  static generateRegistrationKey(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }
}
