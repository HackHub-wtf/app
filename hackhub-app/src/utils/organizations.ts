import { api } from '../lib/apiClient'

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: 'owner' | 'manager' | 'member'
  joinedAt: string
}

export class OrganizationService {
  static async createOrganization(
    name: string, slug: string, _userId?: string
  ): Promise<Organization> {
    return api.post('/api/v1/organizations', { name, slug })
  }

  static async joinOrganization(slug: string): Promise<OrganizationMember> {
    return api.post('/api/v1/organizations/join', { slug })
  }

  static async getUserOrganization(_userId?: string): Promise<OrganizationMember | null> {
    try {
      return await api.get<OrganizationMember>('/api/v1/organizations/my-membership')
    } catch { return null }
  }

  static async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    return api.get(`/api/v1/organizations/${orgId}/members`)
  }

  static async updateMemberRole(
    orgId: string, userId: string, role: OrganizationMember['role']
  ): Promise<OrganizationMember> {
    return api.patch(`/api/v1/organizations/${orgId}/members/${userId}/role`, { role })
  }

  static async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      await api.get(`/api/v1/organizations/slug/${slug}`)
      return false // exists
    } catch {
      return true // not found = available
    }
  }
}
