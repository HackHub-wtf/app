export type UserRole = 'admin' | 'manager' | 'user'

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
  static canViewHackathon(user: User, hackathon: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager') return hackathon.created_by === user.id
    if (user.role === 'user') {
      // Users can view hackathons they are participating in
      // This will need to be checked against team membership
      return true // For now, allow all users to view hackathons
    }
    return false
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
    if (user.role === 'user') return true // Users can view teams in hackathons they participate in
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
    if (user.role === 'user') return team.created_by === user.id // Team leaders can edit their teams
    return false
  }

  /**
   * Check if user can delete a specific team
   */
  static canDeleteTeam(user: User, team: Team, hackathon?: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager' && hackathon) return hackathon.created_by === user.id
    if (user.role === 'user') return team.created_by === user.id // Team leaders can delete their teams
    return false
  }

  /**
   * Check if user can manage team members (add/remove)
   */
  static canManageTeamMembers(user: User, team: Team, hackathon?: Hackathon): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager' && hackathon) return hackathon.created_by === user.id
    if (user.role === 'user') return team.created_by === user.id // Team leaders can manage members
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
    if (user.role === 'manager' || user.role === 'user') {
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
      case 'user': return 'Participant'
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
      case 'user': return 'green'
      default: return 'gray'
    }
  }
}
