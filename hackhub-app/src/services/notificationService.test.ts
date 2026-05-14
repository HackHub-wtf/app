import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotificationService } from './notificationService'
import type { Notification } from './notificationService'

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

const BASE_NOTIF: Notification = {
  id: 'n-1',
  userId: 'u-1',
  title: 'Welcome',
  message: 'You joined HackHub',
  type: 'info',
  read: false,
  actionUrl: null,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getNotifications', () => {
    it('calls correct endpoint with defaults', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [BASE_NOTIF], totalElements: 1, totalPages: 1, number: 0, size: 20 })
      const result = await NotificationService.getNotifications()
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications?page=0&size=20')
      expect(result.content).toHaveLength(1)
    })

    it('passes custom page and size', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [], totalElements: 0, totalPages: 0, number: 1, size: 5 })
      await NotificationService.getNotifications(1, 5)
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications?page=1&size=5')
    })
  })

  describe('getUnreadCount', () => {
    it('returns the count from response', async () => {
      mockApi.get.mockResolvedValueOnce({ count: 7 })
      const result = await NotificationService.getUnreadCount()
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications/unread-count')
      expect(result).toBe(7)
    })

    it('returns 0 when no unread', async () => {
      mockApi.get.mockResolvedValueOnce({ count: 0 })
      const result = await NotificationService.getUnreadCount()
      expect(result).toBe(0)
    })
  })

  describe('markAsRead', () => {
    it('patches the correct notification', async () => {
      const read = { ...BASE_NOTIF, read: true }
      mockApi.patch.mockResolvedValueOnce(read)
      const result = await NotificationService.markAsRead('n-1')
      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/notifications/n-1/read')
      expect(result.read).toBe(true)
    })
  })

  describe('markAllRead', () => {
    it('posts to read-all and returns updated count', async () => {
      mockApi.post.mockResolvedValueOnce({ updated: 5 })
      const result = await NotificationService.markAllRead()
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/read-all')
      expect(result).toBe(5)
    })
  })

  describe('delete', () => {
    it('deletes the correct notification', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await NotificationService.delete('n-1')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/notifications/n-1')
    })
  })
})
