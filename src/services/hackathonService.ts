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
}
