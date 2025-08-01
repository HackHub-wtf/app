import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'manager' | 'participant'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  skills?: string[]
}

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
  organization_id?: string
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
  hackathon_id: string
  created_by: string
  leader_id?: string // Optional since team leader is derived from team_members
  // ... other team properties
}

export class PermissionService {
  /**
   * Check if user is an admin
   */
  static isAdmin(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Check if user is a manager or admin (has management permissions)
   */
  static isManagerOrAbove(user: User): boolean {
    return ['admin', 'manager'].includes(user.role)
  }

  /**
   * Check if user can view hackathons
   */
  static canViewHackathons(user: User): boolean {
    return ['admin', 'manager', 'user'].includes(user.role)
  }

  /**
   * Check if user can view all hackathons (admin only)
   */
  static canViewAllHackathons(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Check if user can view a specific hackathon
   */
  static async canManageHackathon(user: User, hackathon: Hackathon): Promise<boolean> {
    if (this.isAdmin(user)) return true
    
    // Check if user is the creator
    if (hackathon.created_by === user.id) return true
    
    // Check if user is a manager in the hackathon's organization
    if (hackathon.organization_id) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', hackathon.organization_id)
        .eq('user_id', user.id)
        .single()
      
      return membership?.role === 'manager' || membership?.role === 'owner'
    }
    
    return false
  }

  /**
   * Check if user can manage users (organization-scoped)
   */
  static async canManageOrganizationUsers(user: User, organizationId?: string): Promise<boolean> {
    if (this.isAdmin(user)) return true
    
    if (!organizationId) return false
    
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()
    
    return membership?.role === 'manager' || membership?.role === 'owner'
  }

  /**
   * Check if user can create hackathons
   */
  static canCreateHackathons(user: User): boolean {
    return ['admin', 'manager'].includes(user.role)
  }

  /**
   * Check if user can edit a specific hackathon
   */
  static canEditHackathon(user: User, hackathon: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager') return hackathon.created_by === user.id
    return false
  }

  /**
   * Check if user can delete a specific hackathon
   */
  static canDeleteHackathon(user: User, hackathon: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager') return hackathon.created_by === user.id
    return false
  }

  /**
   * Check if user can view teams
   */
  static canViewTeams(user: User): boolean {
    return ['admin', 'manager', 'user'].includes(user.role)
  }

  /**
   * Check if user can view all teams (admin only)
   */
  static canViewAllTeams(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Check if user can view teams for a specific hackathon
   */
  static canViewTeamsForHackathon(user: User, hackathon: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager') return hackathon.created_by === user.id
    if (user.role === 'participant') return true // Users can view teams in hackathons they participate in
    return false
  }

  /**
   * Check if user can create teams
   */
  static canCreateTeams(user: User): boolean {
    return ['admin', 'manager', 'user'].includes(user.role)
  }

  /**
   * Check if user can edit a specific team
   */
  static canEditTeam(user: User, team: Team, hackathon?: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager' && hackathon) return hackathon.created_by === user.id
    if (user.role === 'participant') return team.created_by === user.id // Team leaders can edit their teams
    return false
  }

  /**
   * Check if user can delete a specific team
   */
  static canDeleteTeam(user: User, team: Team, hackathon?: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager' && hackathon) return hackathon.created_by === user.id
    if (user.role === 'participant') return team.created_by === user.id // Team leaders can delete their teams
    return false
  }

  /**
   * Check if user can manage team members (add/remove)
   */
  static canManageTeamMembers(user: User, team: Team, hackathon?: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager' && hackathon) return hackathon.created_by === user.id
    if (user.role === 'participant') return team.created_by === user.id // Team leaders can manage members
    return false
  }

  /**
   * Check if user can view projects
   */
  static canViewProjects(user: User): boolean {
    return ['admin', 'manager', 'user'].includes(user.role)
  }

  /**
   * Check if user can view all projects (admin only)
   */
  static canViewAllProjects(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Check if user can edit projects
   */
  static canEditProjects(user: User, projectOwnerId?: string): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager' || user.role === 'participant') {
      return projectOwnerId ? projectOwnerId === user.id : false
    }
    return false
  }

  /**
   * Check if user can access admin features
   */
  static canAccessAdmin(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Check if user can manage other users
   */
  static canManageUsers(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Check if user can change user roles
   */
  static canChangeUserRoles(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Get filtered hackathons based on user permissions
   */
  static filterHackathonsForUser(user: User, hackathons: Hackathon[]): Hackathon[] {
    if (user.role === 'admin') return hackathons
    if (user.role === 'manager') return hackathons.filter(h => h.created_by === user.id)
    // For users, we'll need to filter based on team membership - for now return all open hackathons
    return hackathons.filter(h => h.status !== 'draft')
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'manager': return 'Hackathon Manager'
      case 'participant': return 'Participant'
      default: return 'Unknown'
    }
  }

  /**
   * Get role color for badges
   */
  static getRoleColor(role: UserRole): string {
    switch (role) {
      case 'admin': return 'red'
      case 'manager': return 'blue'
      case 'participant': return 'green'
      default: return 'gray'
    }
  }
}
