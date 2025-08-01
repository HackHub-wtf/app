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
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        )
      `)
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
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        )
      `)
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
      .select()
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
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching hackathons by status:', error)
      return []
    }

    return data
  }

  // Join hackathon with registration key
  static async joinHackathon(registrationKey: string, userId: string): Promise<Hackathon | null> {
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

    // Check if user already joined
    const { data: existingParticipant } = await supabase
      .from('hackathon_participants')
      .select('*')
      .eq('hackathon_id', data.id)
      .eq('user_id', userId)
      .single()

    if (existingParticipant) {
      throw new Error('You are already registered for this hackathon')
    }

    // Check if hackathon is full
    if (data.current_participants >= data.allowed_participants) {
      throw new Error('Hackathon has reached maximum participants')
    }

    // Add user to hackathon participants
    const { error: insertError } = await supabase
      .from('hackathon_participants')
      .insert({
        hackathon_id: data.id,
        user_id: userId,
        joined_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error adding participant:', insertError)
      throw insertError
    }

    // Update participant count
    const { data: updated, error: updateError } = await supabase
      .from('hackathons')
      .update({ 
        current_participants: data.current_participants + 1 
      })
      .eq('id', data.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating participant count:', updateError)
      throw updateError
    }

    return updated
  }

  // Check if user is participant of hackathon
  static async isUserParticipant(hackathonId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('hackathon_participants')
      .select('*')
      .eq('hackathon_id', hackathonId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking participant status:', error)
      return false
    }

    return !!data
  }

  // Get hackathon participants
  static async getHackathonParticipants(hackathonId: string) {
    const { data, error } = await supabase
      .from('hackathon_participants')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email,
          avatar_url,
          skills
        )
      `)
      .eq('hackathon_id', hackathonId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching participants:', error)
      return []
    }

    return data
  }

  // Get user's hackathons
  static async getUserHackathons(userId: string): Promise<Hackathon[]> {
    const { data, error } = await supabase
      .from('hackathon_participants')
      .select(`
        hackathons (
          *,
          profiles:created_by (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user hackathons:', error)
      return []
    }

    return data.map(item => item.hackathons).filter(Boolean) as unknown as Hackathon[]
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
  static async checkHackathonStatus(hackathon: any): Promise<string> {
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
