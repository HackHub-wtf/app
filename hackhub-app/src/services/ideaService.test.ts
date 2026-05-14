import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IdeaService } from './ideaService'
import type { Idea, CreateIdeaInput } from './ideaService'

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
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

const BASE_IDEA: Idea = {
  id: 'idea-1',
  title: 'AI Debugger',
  description: 'An AI-powered debugger',
  hackathonId: 'h-1',
  teamId: 't-1',
  createdBy: 'user-1',
  category: 'AI',
  tags: ['machine-learning'],
  votes: 5,
  status: 'submitted',
  attachments: [],
  repositoryUrl: null,
  demoUrl: null,
  projectAttachments: null,
  totalScore: 0,
  voteCount: 5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  userHasVoted: false,
}

describe('IdeaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getIdeas', () => {
    it('calls correct endpoint with hackathonId and defaults', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [BASE_IDEA], totalElements: 1, totalPages: 1, number: 0, size: 20 })
      const result = await IdeaService.getIdeas('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/ideas?page=0&size=20')
      expect(result.content).toHaveLength(1)
    })

    it('passes custom page and size', async () => {
      mockApi.get.mockResolvedValueOnce({ content: [], totalElements: 0, totalPages: 0, number: 1, size: 5 })
      await IdeaService.getIdeas('h-1', 1, 5)
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/ideas?page=1&size=5')
    })
  })

  describe('getIdea', () => {
    it('fetches single idea by id', async () => {
      mockApi.get.mockResolvedValueOnce(BASE_IDEA)
      const result = await IdeaService.getIdea('idea-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/ideas/idea-1')
      expect(result.title).toBe('AI Debugger')
    })
  })

  describe('createIdea', () => {
    it('posts to hackathon-scoped endpoint', async () => {
      const input: CreateIdeaInput = {
        title: 'New Idea',
        description: 'desc',
        hackathonId: 'h-1',
        category: 'Web',
      }
      mockApi.post.mockResolvedValueOnce({ ...BASE_IDEA, ...input, id: 'idea-2' })
      const result = await IdeaService.createIdea(input)
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/hackathons/h-1/ideas', input)
      expect(result.id).toBe('idea-2')
    })
  })

  describe('updateIdea', () => {
    it('puts to correct idea endpoint', async () => {
      mockApi.put.mockResolvedValueOnce({ ...BASE_IDEA, title: 'Updated Idea' })
      const result = await IdeaService.updateIdea('idea-1', { title: 'Updated Idea' })
      expect(mockApi.put).toHaveBeenCalledWith('/api/v1/ideas/idea-1', { title: 'Updated Idea' })
      expect(result.title).toBe('Updated Idea')
    })
  })

  describe('deleteIdea', () => {
    it('deletes idea by id', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await IdeaService.deleteIdea('idea-1')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/ideas/idea-1')
    })
  })

  describe('voteIdea', () => {
    it('posts to votes endpoint and returns VoteResult', async () => {
      mockApi.post.mockResolvedValueOnce({ voted: true, voteCount: 6 })
      const result = await IdeaService.voteIdea('idea-1')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/ideas/idea-1/votes')
      expect(result.voted).toBe(true)
      expect(result.voteCount).toBe(6)
    })

    it('handles unvote (toggle off)', async () => {
      mockApi.post.mockResolvedValueOnce({ voted: false, voteCount: 4 })
      const result = await IdeaService.voteIdea('idea-1')
      expect(result.voted).toBe(false)
      expect(result.voteCount).toBe(4)
    })
  })

  describe('addComment', () => {
    it('posts comment to idea', async () => {
      mockApi.post.mockResolvedValueOnce(undefined)
      await IdeaService.addComment('idea-1', 'Great idea!')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/ideas/idea-1/comments', { content: 'Great idea!' })
    })
  })

  describe('getComments', () => {
    it('fetches comments for an idea', async () => {
      const comment = { id: 'c-1', ideaId: 'idea-1', userId: 'user-1', content: 'Nice', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }
      mockApi.get.mockResolvedValueOnce([comment])
      const result = await IdeaService.getComments('idea-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/ideas/idea-1/comments')
      expect(result).toHaveLength(1)
    })
  })
})
