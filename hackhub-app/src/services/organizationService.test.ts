import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrganizationService } from './organizationService'
import type { Organization, OrgMember, OrgInvitation } from './organizationService'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../lib/apiClient'
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

const BASE_ORG: Organization = {
  id: 'org-1',
  name: 'Acme',
  slug: 'acme',
  description: 'We build things',
  createdBy: 'u-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  visibility: 'closed',
  joinPolicy: 'invite_only',
}

const BASE_MEMBER: OrgMember = {
  id: 'm-1',
  organizationId: 'org-1',
  userId: 'u-1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'owner',
  joinedAt: '2026-01-01T00:00:00Z',
}

const BASE_INVITATION: OrgInvitation = {
  id: 'inv-1',
  organizationId: 'org-1',
  token: 'tok-abc',
  invitedRole: 'member',
  invitedEmail: null,
  expiresAt: '2026-06-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  joinUrl: 'https://app/accept/tok-abc',
}

describe('OrganizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrganization', () => {
    it('gets by id', async () => {
      mockApi.get.mockResolvedValueOnce(BASE_ORG)
      const result = await OrganizationService.getOrganization('org-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/organizations/org-1')
      expect(result.slug).toBe('acme')
    })
  })

  describe('getMyOrganizations', () => {
    it('calls /organizations/my', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_ORG])
      const result = await OrganizationService.getMyOrganizations()
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/organizations/my')
      expect(result).toHaveLength(1)
    })
  })

  describe('createOrganization', () => {
    it('posts name and slug', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_ORG)
      const result = await OrganizationService.createOrganization({ name: 'Acme', slug: 'acme' })
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/organizations', { name: 'Acme', slug: 'acme' })
      expect(result.id).toBe('org-1')
    })
  })

  describe('joinOrganization', () => {
    it('posts slug', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_MEMBER)
      const result = await OrganizationService.joinOrganization('acme')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/organizations/join', { slug: 'acme' })
      expect(result.role).toBe('owner')
    })
  })

  describe('getMembers', () => {
    it('calls members endpoint', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_MEMBER])
      const result = await OrganizationService.getMembers('org-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/organizations/org-1/members')
      expect(result[0].email).toBe('alice@example.com')
    })
  })

  describe('updateMemberRole', () => {
    it('patches role', async () => {
      const updated = { ...BASE_MEMBER, role: 'manager' as const }
      mockApi.patch.mockResolvedValueOnce(updated)
      const result = await OrganizationService.updateMemberRole('org-1', 'u-1', 'manager')
      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/organizations/org-1/members/u-1/role', { role: 'manager' })
      expect(result.role).toBe('manager')
    })
  })

  describe('checkSlugAvailable', () => {
    it('returns false when slug exists (GET succeeds)', async () => {
      mockApi.get.mockResolvedValueOnce(BASE_ORG)
      const result = await OrganizationService.checkSlugAvailable('acme')
      expect(result).toBe(false)
    })

    it('returns true when slug not found (GET throws)', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Not Found'))
      const result = await OrganizationService.checkSlugAvailable('new-slug')
      expect(result).toBe(true)
    })
  })

  describe('adminListOrganizations', () => {
    it('calls admin endpoint with pagination', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [BASE_ORG], totalElements: 1, totalPages: 1, number: 0, size: 20 })
      const result = await OrganizationService.adminListOrganizations()
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/admin/organizations?page=0&size=20&sort=createdAt,desc')
      expect(result.content).toHaveLength(1)
    })

    it('passes page and size', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 5 })
      await OrganizationService.adminListOrganizations(2, 5)
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/admin/organizations?page=2&size=5&sort=createdAt,desc')
    })
  })

  describe('adminUpdateOrganization', () => {
    it('patches org via admin endpoint', async () => {
      const updated = { ...BASE_ORG, name: 'Acme Corp' }
      mockApi.patch.mockResolvedValueOnce(updated)
      const result = await OrganizationService.adminUpdateOrganization('org-1', { name: 'Acme Corp' })
      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/admin/organizations/org-1', { name: 'Acme Corp' })
      expect(result.name).toBe('Acme Corp')
    })
  })

  describe('adminDeleteOrganization', () => {
    it('deletes via admin endpoint', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await OrganizationService.adminDeleteOrganization('org-1')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/admin/organizations/org-1')
    })
  })

  describe('updateSettings', () => {
    it('patches settings', async () => {
      const updated = { ...BASE_ORG, visibility: 'open' as const }
      mockApi.patch.mockResolvedValueOnce(updated)
      const result = await OrganizationService.updateSettings('org-1', { visibility: 'open' })
      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/organizations/org-1/settings', { visibility: 'open' })
      expect(result.visibility).toBe('open')
    })
  })

  describe('createInvitation', () => {
    it('posts invitation without email', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_INVITATION)
      const result = await OrganizationService.createInvitation('org-1', 'member')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/organizations/org-1/invitations', {
        invitedRole: 'member',
        invitedEmail: null,
      })
      expect(result.token).toBe('tok-abc')
    })

    it('posts invitation with email', async () => {
      mockApi.post.mockResolvedValueOnce({ ...BASE_INVITATION, invitedEmail: 'bob@example.com' })
      await OrganizationService.createInvitation('org-1', 'manager', 'bob@example.com')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/organizations/org-1/invitations', {
        invitedRole: 'manager',
        invitedEmail: 'bob@example.com',
      })
    })
  })

  describe('listInvitations', () => {
    it('gets invitations for org', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_INVITATION])
      const result = await OrganizationService.listInvitations('org-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/organizations/org-1/invitations')
      expect(result).toHaveLength(1)
    })
  })

  describe('revokeInvitation', () => {
    it('deletes the invitation', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await OrganizationService.revokeInvitation('org-1', 'inv-1')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/organizations/org-1/invitations/inv-1')
    })
  })

  describe('acceptInvitation', () => {
    it('posts token to accept endpoint', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_MEMBER)
      const result = await OrganizationService.acceptInvitation('tok-abc')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/organizations/accept-invitation', { token: 'tok-abc' })
      expect(result.organizationId).toBe('org-1')
    })
  })
})
