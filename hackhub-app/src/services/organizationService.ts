import { api } from '../lib/apiClient'

export type OrgVisibility = 'open' | 'closed'
export type OrgJoinPolicy = 'invite_only' | 'self_register'

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
  memberCount?: number
  hackathonCount?: number
  visibility: OrgVisibility
  joinPolicy: OrgJoinPolicy
}

export interface OrgMember {
  id: string
  organizationId: string
  userId: string
  name: string | null
  email: string | null
  role: 'owner' | 'manager' | 'member' | 'judge'
  joinedAt: string
}

export interface CreateOrgInput {
  name: string
  slug: string
}

export interface UpdateOrgInput {
  name?: string
  description?: string
  websiteUrl?: string
}

export interface UpdateOrgSettingsInput {
  visibility?: OrgVisibility
  joinPolicy?: OrgJoinPolicy
}

export type InvitableRole = 'manager' | 'member' | 'judge'

export interface OrgInvitation {
  id: string
  organizationId: string
  token: string
  invitedRole: InvitableRole
  invitedEmail: string | null
  expiresAt: string
  createdAt: string
  joinUrl: string
}

export interface InvitationPreview {
  organizationId: string
  organizationName: string
  invitedRole: InvitableRole
  expiresAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export class OrganizationService {
  static async getOrganization(id: string): Promise<Organization> {
    return api.get(`/api/v1/organizations/${id}`)
  }

  static async getMyOrganizations(): Promise<Organization[]> {
    return api.get('/api/v1/organizations/my')
  }

  static async createOrganization(data: CreateOrgInput): Promise<Organization> {
    return api.post('/api/v1/organizations', data)
  }

  static async joinOrganization(slug: string): Promise<OrgMember> {
    return api.post('/api/v1/organizations/join', { slug })
  }

  static async getMembers(orgId: string): Promise<OrgMember[]> {
    return api.get(`/api/v1/organizations/${orgId}/members`)
  }

  static async updateMemberRole(
    orgId: string,
    userId: string,
    role: OrgMember['role']
  ): Promise<OrgMember> {
    return api.patch(`/api/v1/organizations/${orgId}/members/${userId}/role`, { role })
  }

  static async checkSlugAvailable(slug: string): Promise<boolean> {
    try {
      await api.get(`/api/v1/organizations/slug/${slug}`)
      return false
    } catch {
      return true
    }
  }

  // Admin-only endpoints
  static async adminListOrganizations(
    page = 0,
    size = 20
  ): Promise<PageResponse<Organization>> {
    return api.get(`/api/v1/admin/organizations?page=${page}&size=${size}&sort=createdAt,desc`)
  }

  static async adminUpdateOrganization(
    id: string,
    data: UpdateOrgInput
  ): Promise<Organization> {
    return api.patch(`/api/v1/admin/organizations/${id}`, data)
  }

  static async adminDeleteOrganization(id: string): Promise<void> {
    return api.delete(`/api/v1/admin/organizations/${id}`)
  }

  static async updateSettings(
    id: string,
    data: UpdateOrgSettingsInput
  ): Promise<Organization> {
    return api.patch(`/api/v1/organizations/${id}/settings`, data)
  }

  // ── Invitations ────────────────────────────────────────────────────────────

  static async createInvitation(
    orgId: string,
    invitedRole: InvitableRole,
    invitedEmail?: string
  ): Promise<OrgInvitation> {
    return api.post(`/api/v1/organizations/${orgId}/invitations`, {
      invitedRole,
      invitedEmail: invitedEmail ?? null,
    })
  }

  static async listInvitations(orgId: string): Promise<OrgInvitation[]> {
    return api.get(`/api/v1/organizations/${orgId}/invitations`)
  }

  static async revokeInvitation(orgId: string, invitationId: string): Promise<void> {
    return api.delete(`/api/v1/organizations/${orgId}/invitations/${invitationId}`)
  }

  static async acceptInvitation(token: string): Promise<OrgMember> {
    return api.post('/api/v1/organizations/accept-invitation', { token })
  }

  static async previewInvitation(token: string): Promise<InvitationPreview> {
    return api.get(`/api/v1/invitations/${token}`, { skipAuth: true } as never)
  }
}
