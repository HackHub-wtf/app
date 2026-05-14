import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JudgingService } from './judgingService'
import type { HackathonJudge, JudgeScore, ScoreSummary, FinalSubmission } from './judgingService'

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

const BASE_JUDGE: HackathonJudge = {
  id: 'j-1',
  hackathonId: 'h-1',
  userId: 'u-judge',
  name: 'Judge Alice',
  email: 'judge@example.com',
  invitedAt: '2026-01-01T00:00:00Z',
}

const BASE_SCORE: JudgeScore = {
  id: 'js-1',
  hackathonId: 'h-1',
  ideaId: 'idea-1',
  judgeId: 'u-judge',
  criterionId: 'c-1',
  score: 9,
  comment: 'Excellent',
  createdAt: '2026-01-01T00:00:00Z',
}

const BASE_SUMMARY: ScoreSummary = {
  ideaId: 'idea-1',
  ideaTitle: 'Cool Project',
  panelScore: 8.5,
  communityScore: 7.2,
  blendedScore: 7.9,
  rank: 1,
  judgeCount: 3,
  voteCount: 42,
}

const BASE_SUBMISSION: FinalSubmission = {
  id: 'fs-1',
  hackathonId: 'h-1',
  teamId: 't-1',
  teamName: 'Team Alpha',
  ideaId: 'idea-1',
  title: 'Final Project',
  description: 'Our final submission',
  attachments: [],
  submittedBy: 'u-1',
  submittedAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('JudgingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getJudges', () => {
    it('calls correct endpoint', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_JUDGE])
      const result = await JudgingService.getJudges('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/judging/judges')
      expect(result[0].name).toBe('Judge Alice')
    })
  })

  describe('inviteJudge', () => {
    it('posts userId', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_JUDGE)
      const result = await JudgingService.inviteJudge('h-1', 'u-judge')
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/hackathons/h-1/judging/judges', { userId: 'u-judge' })
      expect(result.id).toBe('j-1')
    })
  })

  describe('removeJudge', () => {
    it('deletes judge by userId', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined)
      await JudgingService.removeJudge('h-1', 'u-judge')
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/hackathons/h-1/judging/judges/u-judge')
    })
  })

  describe('submitScore', () => {
    it('posts score input', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_SCORE)
      const result = await JudgingService.submitScore('h-1', { ideaId: 'idea-1', criterionId: 'c-1', score: 9, comment: 'Excellent' })
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/hackathons/h-1/judging/scores', {
        ideaId: 'idea-1', criterionId: 'c-1', score: 9, comment: 'Excellent',
      })
      expect(result.score).toBe(9)
    })
  })

  describe('getMyScores', () => {
    it('gets scores for hackathon', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_SCORE])
      const result = await JudgingService.getMyScores('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/judging/scores')
      expect(result[0].criterionId).toBe('c-1')
    })
  })

  describe('getScoreSummary', () => {
    it('gets score summary', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_SUMMARY])
      const result = await JudgingService.getScoreSummary('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/judging/scores/summary')
      expect(result[0].rank).toBe(1)
      expect(result[0].blendedScore).toBe(7.9)
    })
  })

  describe('getFinalSubmissions', () => {
    it('gets all submissions', async () => {
      mockApi.get.mockResolvedValueOnce([BASE_SUBMISSION])
      const result = await JudgingService.getFinalSubmissions('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/submissions')
      expect(result[0].title).toBe('Final Project')
    })
  })

  describe('getMySubmission', () => {
    it('returns submission when found', async () => {
      mockApi.get.mockResolvedValueOnce(BASE_SUBMISSION)
      const result = await JudgingService.getMySubmission('h-1')
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/hackathons/h-1/submissions/my')
      expect(result).not.toBeNull()
      expect(result?.teamId).toBe('t-1')
    })

    it('returns null on error (not submitted)', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Not Found'))
      const result = await JudgingService.getMySubmission('h-1')
      expect(result).toBeNull()
    })

    it('returns null when response is undefined', async () => {
      mockApi.get.mockResolvedValueOnce(undefined)
      const result = await JudgingService.getMySubmission('h-1')
      expect(result).toBeNull()
    })
  })

  describe('submitFinal', () => {
    it('posts final submission', async () => {
      mockApi.post.mockResolvedValueOnce(BASE_SUBMISSION)
      const input = {
        title: 'Final Project',
        description: 'Our final submission',
        attachments: [{ type: 'github' as const, url: 'https://github.com/org/repo' }],
        ideaId: 'idea-1',
      }
      const result = await JudgingService.submitFinal('h-1', input)
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/hackathons/h-1/submissions', input)
      expect(result.id).toBe('fs-1')
    })
  })
})
