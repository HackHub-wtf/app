import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VotingService } from './votingService'
import type { VotingCriteria, IdeaScore } from './votingService'

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
  delete: ReturnType<typeof vi.fn>
}

const BASE_CRITERIA: VotingCriteria = {
  id: 'c-1',
  hackathonId: 'h-1',
  name: 'Innovation',
  description: 'How innovative is the idea?',
  weight: 40,
  displayOrder: 1,
}

const BASE_SCORE: IdeaScore = {
  id: 's-1',
  ideaId: 'idea-1',
  userId: 'u-1',
  criteriaId: 'c-1',
  score: 8,
}

describe('VotingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCriteria', () => {
    it('calls correct endpoint', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_CRITERIA])
      const result = await VotingService.getCriteria('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/voting-criteria')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Innovation')
    })
  })

  describe('createCriteria', () => {
    it('posts to correct endpoint', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_CRITERIA)
      const result = await VotingService.createCriteria('h-1', {
        name: 'Innovation',
        description: 'How innovative?',
        weight: 40,
        displayOrder: 1,
      })
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/hackathons/h-1/voting-criteria', {
        name: 'Innovation',
        description: 'How innovative?',
        weight: 40,
        displayOrder: 1,
      })
      expect(result.id).toBe('c-1')
    })
  })

  describe('deleteCriteria', () => {
    it('deletes correct criteria', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await VotingService.deleteCriteria('h-1', 'c-1')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/hackathons/h-1/voting-criteria/c-1')
    })
  })

  describe('scoreIdea', () => {
    it('posts score to correct endpoint', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_SCORE)
      const result = await VotingService.scoreIdea('idea-1', 'c-1', 8)
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/ideas/idea-1/scores', { criteriaId: 'c-1', score: 8 })
      expect(result.score).toBe(8)
    })
  })

  describe('validateCriteriaWeights', () => {
    it('returns true when weights sum to 100', async () => {
      const criteria: VotingCriteria[] = [
        { ...BASE_CRITERIA, weight: 40 },
        { ...BASE_CRITERIA, id: 'c-2', name: 'Execution', weight: 35 },
        { ...BASE_CRITERIA, id: 'c-3', name: 'Impact', weight: 25 },
      ]
      expect(await VotingService.validateCriteriaWeights(criteria)).toBe(true)
    })

    it('returns false when weights do not sum to 100', async () => {
      const criteria: VotingCriteria[] = [
        { ...BASE_CRITERIA, weight: 50 },
        { ...BASE_CRITERIA, id: 'c-2', name: 'Execution', weight: 30 },
      ]
      expect(await VotingService.validateCriteriaWeights(criteria)).toBe(false)
    })

    it('returns true for single criteria with weight 100', async () => {
      expect(await VotingService.validateCriteriaWeights([{ ...BASE_CRITERIA, weight: 100 }])).toBe(true)
    })

    it('returns false for empty list', async () => {
      expect(await VotingService.validateCriteriaWeights([])).toBe(false)
    })
  })
})
