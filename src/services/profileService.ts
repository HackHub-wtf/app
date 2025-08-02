import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export class ProfileService {
  // Create user profile
  static async createProfile(id: string, email: string, name: string, role: 'admin' | 'manager' | 'participant' = 'participant'): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id,
        email,
        name,
        role,
        skills: []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      throw error
    }

    return data
  }

  // Get current user profile
  static async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  }

  // Update user profile
  static async updateProfile(id: string, updates: ProfileUpdate): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    return data
  }

  // Get profile by ID
  static async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  }

  // Get multiple profiles
  static async getProfiles(ids: string[]): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids)

    if (error) {
      console.error('Error fetching profiles:', error)
      return []
    }

    return data
  }

  // Search profiles by name or email
  static async searchProfiles(query: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error('Error searching profiles:', error)
      return []
    }

    return data
  }
}
