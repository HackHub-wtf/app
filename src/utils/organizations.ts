import { supabase } from '../lib/supabase'
import type { User } from './permissions'

// Organization-related types and interfaces

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website_url?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'manager' | 'member'
  joined_at: string
  organization?: Organization
  profile?: User
}

export type OrganizationRole = 'owner' | 'manager' | 'member'

// Extended User interface to include organization
export interface UserWithOrganization extends User {
  organization_id?: string
  organization?: Organization
  organization_role?: OrganizationRole
}

export class OrganizationService {
  /**
   * Check if organization slug is available
   */
  static async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    
    // If there's an error that's not "no rows", something went wrong
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking slug availability:', error)
      throw error
    }
    
    // If no data found, slug is available
    return !data
  }

  /**
   * Create a new organization
   */
  static async createOrganization(orgData: {
    name: string
    slug: string
    description?: string
  }, userId: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        ...orgData,
        created_by: userId
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating organization:', error)
      return null
    }

    // Add creator as owner in organization_members table
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: data.id,
        user_id: userId,
        role: 'owner'
      }])

    if (memberError) {
      console.error('Error adding user as organization owner:', memberError)
    }

    // Update user's profile to set their role to manager and link to organization
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'manager',
        organization_id: data.id
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating user profile with organization:', profileError)
    }

    return data
  }

  /**
   * Join an existing organization
   */
  static async joinOrganization(slug: string, userId: string): Promise<boolean> {
    // First get the organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!org) return false

    // Add user as member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: org.id,
        user_id: userId,
        role: 'member'
      }])

    if (memberError) {
      console.error('Error adding user to organization:', memberError)
      return false
    }

    // Update user's profile to link to organization (keep their current role)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: org.id
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating user profile with organization:', profileError)
    }

    return true
  }

  /**
   * Get user's organization membership
   */
  static async getUserOrganization(userId: string): Promise<OrganizationMember | null> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user organization:', error)
      return null
    }

    return data
  }

  /**
   * Get organization members
   */
  static async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching organization members:', error)
      return []
    }

    return data || []
  }

  /**
   * Update organization member role
   */
  static async updateMemberRole(
    orgId: string, 
    userId: string, 
    role: OrganizationRole
  ): Promise<boolean> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('organization_id', orgId)
      .eq('user_id', userId)

    return !error
  }

  /**
   * Remove member from organization
   */
  static async removeMember(orgId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', userId)

    return !error
  }
}
