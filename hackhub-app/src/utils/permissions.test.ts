import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PermissionService } from './permissions'
import type { User, HackathonRef, TeamRef } from './permissions'

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
const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> }

function makeUser(role: User['role'], id = 'user-1'): User {
  return { id, email: `${role}@test.com`, name: role, role }
}

describe('PermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── isAdmin ────────────────────────────────────────────────────────────────

  describe('isAdmin', () => {
    it('returns true for admin role', () => {
      expect(PermissionService.isAdmin(makeUser('admin'))).toBe(true)
    })

    it('returns false for manager role', () => {
      expect(PermissionService.isAdmin(makeUser('manager'))).toBe(false)
    })

    it('returns false for participant role', () => {
      expect(PermissionService.isAdmin(makeUser('participant'))).toBe(false)
    })
  })

  // ── isManagerOrAbove ───────────────────────────────────────────────────────

  describe('isManagerOrAbove', () => {
    it('returns true for admin', () => {
      expect(PermissionService.isManagerOrAbove(makeUser('admin'))).toBe(true)
    })

    it('returns true for manager', () => {
      expect(PermissionService.isManagerOrAbove(makeUser('manager'))).toBe(true)
    })

    it('returns false for participant', () => {
      expect(PermissionService.isManagerOrAbove(makeUser('participant'))).toBe(false)
    })
  })

  // ── canCreateHackathons ────────────────────────────────────────────────────

  describe('canCreateHackathons', () => {
    it('admin can create hackathons', () => {
      expect(PermissionService.canCreateHackathons(makeUser('admin'))).toBe(true)
    })

    it('manager can create hackathons', () => {
      expect(PermissionService.canCreateHackathons(makeUser('manager'))).toBe(true)
    })

    it('participant cannot create hackathons', () => {
      expect(PermissionService.canCreateHackathons(makeUser('participant'))).toBe(false)
    })
  })

  // ── canEditHackathon ───────────────────────────────────────────────────────

  describe('canEditHackathon', () => {
    const hackathon: HackathonRef = {
      id: 'h-1',
      createdBy: 'manager-1',
      organizationId: null,
      status: 'draft',
    }

    it('admin can edit any hackathon', () => {
      expect(PermissionService.canEditHackathon(makeUser('admin'), hackathon)).toBe(true)
    })

    it('manager can edit hackathon they created', () => {
      const manager = makeUser('manager', 'manager-1')
      expect(PermissionService.canEditHackathon(manager, hackathon)).toBe(true)
    })

    it('manager cannot edit hackathon created by someone else', () => {
      const otherManager = makeUser('manager', 'manager-2')
      expect(PermissionService.canEditHackathon(otherManager, hackathon)).toBe(false)
    })

    it('participant cannot edit hackathons', () => {
      expect(PermissionService.canEditHackathon(makeUser('participant'), hackathon)).toBe(false)
    })
  })

  // ── canDeleteHackathon ─────────────────────────────────────────────────────

  describe('canDeleteHackathon', () => {
    const hackathon: HackathonRef = {
      id: 'h-1',
      createdBy: 'manager-1',
      organizationId: null,
      status: 'draft',
    }

    it('delegates to canEditHackathon — admin can delete', () => {
      expect(PermissionService.canDeleteHackathon(makeUser('admin'), hackathon)).toBe(true)
    })

    it('delegates to canEditHackathon — participant cannot delete', () => {
      expect(PermissionService.canDeleteHackathon(makeUser('participant'), hackathon)).toBe(false)
    })
  })

  // ── canManageTeamMembers ───────────────────────────────────────────────────

  describe('canManageTeamMembers', () => {
    const team: TeamRef = { id: 't-1', createdBy: 'user-1' }

    it('admin can manage any team', () => {
      expect(PermissionService.canManageTeamMembers(makeUser('admin'), team)).toBe(true)
    })

    it('team creator can manage their team', () => {
      expect(PermissionService.canManageTeamMembers(makeUser('participant', 'user-1'), team)).toBe(true)
    })

    it('non-creator participant cannot manage team', () => {
      expect(PermissionService.canManageTeamMembers(makeUser('participant', 'user-99'), team)).toBe(false)
    })
  })

  // ── canEditProjects ────────────────────────────────────────────────────────

  describe('canEditProjects', () => {
    it('admin can edit any project', () => {
      expect(PermissionService.canEditProjects(makeUser('admin'), 'other-user')).toBe(true)
    })

    it('owner can edit their own project', () => {
      expect(PermissionService.canEditProjects(makeUser('participant', 'user-1'), 'user-1')).toBe(true)
    })

    it('non-owner cannot edit project', () => {
      expect(PermissionService.canEditProjects(makeUser('participant', 'user-1'), 'user-2')).toBe(false)
    })

    it('returns false when no owner id provided and user is not admin', () => {
      expect(PermissionService.canEditProjects(makeUser('participant'))).toBe(false)
    })
  })

  // ── canAccessAdmin ─────────────────────────────────────────────────────────

  describe('canAccessAdmin', () => {
    it('admin can access admin area', () => {
      expect(PermissionService.canAccessAdmin(makeUser('admin'))).toBe(true)
    })

    it('manager cannot access admin area', () => {
      expect(PermissionService.canAccessAdmin(makeUser('manager'))).toBe(false)
    })

    it('participant cannot access admin area', () => {
      expect(PermissionService.canAccessAdmin(makeUser('participant'))).toBe(false)
    })
  })

  // ── canManageUsers ─────────────────────────────────────────────────────────

  describe('canManageUsers', () => {
    it('admin can manage users', () => {
      expect(PermissionService.canManageUsers(makeUser('admin'))).toBe(true)
    })

    it('manager cannot manage users', () => {
      expect(PermissionService.canManageUsers(makeUser('manager'))).toBe(false)
    })
  })

  // ── getRoleDisplayName ─────────────────────────────────────────────────────

  describe('getRoleDisplayName', () => {
    it('returns Administrator for admin', () => {
      expect(PermissionService.getRoleDisplayName('admin')).toBe('Administrator')
    })

    it('returns Hackathon Manager for manager', () => {
      expect(PermissionService.getRoleDisplayName('manager')).toBe('Hackathon Manager')
    })

    it('returns Participant for participant', () => {
      expect(PermissionService.getRoleDisplayName('participant')).toBe('Participant')
    })
  })

  // ── getRoleColor ───────────────────────────────────────────────────────────

  describe('getRoleColor', () => {
    it('returns red for admin', () => {
      expect(PermissionService.getRoleColor('admin')).toBe('red')
    })

    it('returns blue for manager', () => {
      expect(PermissionService.getRoleColor('manager')).toBe('blue')
    })

    it('returns green for participant', () => {
      expect(PermissionService.getRoleColor('participant')).toBe('green')
    })
  })

  // ── canManageHackathon (async) ─────────────────────────────────────────────

  describe('canManageHackathon', () => {
    it('admin can manage any hackathon without API call', async () => {
      const hackathon: HackathonRef = { id: 'h-1', createdBy: 'someone', organizationId: null, status: 'draft' }
      const result = await PermissionService.canManageHackathon(makeUser('admin'), hackathon)
      expect(result).toBe(true)
      expect(mockApi.get).not.toHaveBeenCalled()
    })

    it('creator can manage their own hackathon without API call', async () => {
      const hackathon: HackathonRef = { id: 'h-1', createdBy: 'user-1', organizationId: null, status: 'draft' }
      const result = await PermissionService.canManageHackathon(makeUser('participant', 'user-1'), hackathon)
      expect(result).toBe(true)
      expect(mockApi.get).not.toHaveBeenCalled()
    })

    it('checks org membership when hackathon has organizationId', async () => {
      const hackathon: HackathonRef = { id: 'h-1', createdBy: 'other', organizationId: 'org-1', status: 'draft' }
      mockApi.get.mockResolvedValueOnce([
        { userId: 'user-1', role: 'manager' },
      ])
      const result = await PermissionService.canManageHackathon(makeUser('participant', 'user-1'), hackathon)
      expect(result).toBe(true)
    })

    it('returns false when not org owner/manager', async () => {
      const hackathon: HackathonRef = { id: 'h-1', createdBy: 'other', organizationId: 'org-1', status: 'draft' }
      mockApi.get.mockResolvedValueOnce([
        { userId: 'user-1', role: 'member' },
      ])
      const result = await PermissionService.canManageHackathon(makeUser('participant', 'user-1'), hackathon)
      expect(result).toBe(false)
    })

    it('returns false when API call fails', async () => {
      const hackathon: HackathonRef = { id: 'h-1', createdBy: 'other', organizationId: 'org-1', status: 'draft' }
      mockApi.get.mockRejectedValueOnce(new Error('network error'))
      const result = await PermissionService.canManageHackathon(makeUser('participant', 'user-1'), hackathon)
      expect(result).toBe(false)
    })

    it('returns false when no org and not creator', async () => {
      const hackathon: HackathonRef = { id: 'h-1', createdBy: 'other', organizationId: null, status: 'draft' }
      const result = await PermissionService.canManageHackathon(makeUser('participant', 'user-1'), hackathon)
      expect(result).toBe(false)
    })
  })

  // ── canManageOrganizationUsers (async) ────────────────────────────────────

  describe('canManageOrganizationUsers', () => {
    it('admin can manage org users without API call', async () => {
      const result = await PermissionService.canManageOrganizationUsers(makeUser('admin'), 'org-1')
      expect(result).toBe(true)
      expect(mockApi.get).not.toHaveBeenCalled()
    })

    it('returns false when no orgId provided', async () => {
      const result = await PermissionService.canManageOrganizationUsers(makeUser('manager'))
      expect(result).toBe(false)
    })

    it('returns true when user is org owner', async () => {
      mockApi.get.mockResolvedValueOnce([{ userId: 'user-1', role: 'owner' }])
      const result = await PermissionService.canManageOrganizationUsers(makeUser('manager', 'user-1'), 'org-1')
      expect(result).toBe(true)
    })

    it('returns false when user is regular member', async () => {
      mockApi.get.mockResolvedValueOnce([{ userId: 'user-1', role: 'member' }])
      const result = await PermissionService.canManageOrganizationUsers(makeUser('manager', 'user-1'), 'org-1')
      expect(result).toBe(false)
    })

    it('returns false when API call fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('network'))
      const result = await PermissionService.canManageOrganizationUsers(makeUser('manager', 'user-1'), 'org-1')
      expect(result).toBe(false)
    })
  })

  describe('getRoleDisplayName fallback', () => {
    it('returns Unknown for unrecognized role', () => {
      expect(PermissionService.getRoleDisplayName('unknown' as never)).toBe('Unknown')
    })
  })

  describe('getRoleColor fallback', () => {
    it('returns gray for unrecognized role', () => {
      expect(PermissionService.getRoleColor('unknown' as never)).toBe('gray')
    })
  })
})
