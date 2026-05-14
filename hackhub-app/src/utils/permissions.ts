import { api } from '../lib/apiClient'

export type UserRole = 'admin' | 'manager' | 'participant'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  skills?: string[]
}

export interface HackathonRef {
  id: string
  createdBy: string
  organizationId?: string | null
  status: string
}

export interface TeamRef {
  id: string
  createdBy: string
}

export class PermissionService {
  static isAdmin(user: User): boolean {
    return user.role === 'admin'
  }

  static isManagerOrAbove(user: User): boolean {
    return ['admin', 'manager'].includes(user.role)
  }

  static canCreateHackathons(user: User): boolean {
    return ['admin', 'manager'].includes(user.role)
  }

  static canEditHackathon(user: User, hackathon: HackathonRef): boolean {
    if (user.role === 'admin') return true
    if (user.role === 'manager') return hackathon.createdBy === user.id
    return false
  }

  static canDeleteHackathon(user: User, hackathon: HackathonRef): boolean {
    return this.canEditHackathon(user, hackathon)
  }

  static canManageTeamMembers(user: User, team: TeamRef): boolean {
    if (user.role === 'admin') return true
    return team.createdBy === user.id
  }

  static canEditProjects(user: User, projectOwnerId?: string): boolean {
    if (user.role === 'admin') return true
    return projectOwnerId ? projectOwnerId === user.id : false
  }

  static canAccessAdmin(user: User): boolean {
    return user.role === 'admin'
  }

  static canManageUsers(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Server-enforced via @PreAuthorize — these are UX-only helpers.
   * Org membership is derived from the JWT claim, not a live DB query.
   */
  static async canManageHackathon(user: User, hackathon: HackathonRef): Promise<boolean> {
    if (this.isAdmin(user)) return true
    if (hackathon.createdBy === user.id) return true
    if (hackathon.organizationId) {
      try {
        const members = await api.get<Array<{ userId: string; role: string }>>(
          `/api/v1/organizations/${hackathon.organizationId}/members`
        )
        return members.some(
          m => m.userId === user.id && ['owner', 'manager'].includes(m.role)
        )
      } catch { return false }
    }
    return false
  }

  static async canManageOrganizationUsers(user: User, orgId?: string): Promise<boolean> {
    if (this.isAdmin(user)) return true
    if (!orgId) return false
    try {
      const members = await api.get<Array<{ userId: string; role: string }>>(
        `/api/v1/organizations/${orgId}/members`
      )
      return members.some(
        m => m.userId === user.id && ['owner', 'manager'].includes(m.role)
      )
    } catch { return false }
  }

  static getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
      admin: 'Administrator',
      manager: 'Hackathon Manager',
      participant: 'Participant',
    }
    return names[role] ?? 'Unknown'
  }

  static getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = { admin: 'red', manager: 'blue', participant: 'green' }
    return colors[role] ?? 'gray'
  }
}
