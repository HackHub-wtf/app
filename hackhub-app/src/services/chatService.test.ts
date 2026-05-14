import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChatService } from './chatService'
import type { ChatMessageItem } from './chatService'

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
}

const BASE_MESSAGE: ChatMessageItem = {
  id: 'msg-1',
  teamId: 't-1',
  userId: 'u-1',
  content: 'Hello team!',
  messageType: 'text',
  fileUrl: null,
  fileName: null,
  createdAt: '2026-01-01T10:00:00Z',
}

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTeamMessages', () => {
    it('calls correct endpoint with defaults', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [BASE_MESSAGE], totalElements: 1, totalPages: 1, number: 0, size: 50 })
      const result = await ChatService.getTeamMessages('t-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/teams/t-1/messages?page=0&size=50&sort=createdAt,asc')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('msg-1')
    })

    it('passes custom page and size', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [], totalElements: 0, totalPages: 0, number: 1, size: 25 })
      await ChatService.getTeamMessages('t-2', 1, 25)
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/teams/t-2/messages?page=1&size=25&sort=createdAt,asc')
    })

    it('returns empty array when no messages', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 })
      const result = await ChatService.getTeamMessages('t-3')
      expect(result).toHaveLength(0)
    })

    it('handles file message type', async () => {
      const fileMsg: ChatMessageItem = {
        ...BASE_MESSAGE,
        id: 'msg-2',
        messageType: 'file',
        fileUrl: 'https://storage/file.pdf',
        fileName: 'report.pdf',
      }
      mockApi.get.mockResolvedValueOnce({ content: [fileMsg], totalElements: 1, totalPages: 1, number: 0, size: 50 })
      const result = await ChatService.getTeamMessages('t-1')
      expect(result[0].messageType).toBe('file')
      expect(result[0].fileUrl).toBe('https://storage/file.pdf')
    })
  })
})
