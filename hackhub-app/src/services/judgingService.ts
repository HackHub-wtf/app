import { api } from '../lib/apiClient'

export interface HackathonJudge {
  id: string
  hackathonId: string
  userId: string
  name: string | null
  email: string | null
  invitedAt: string
}

export interface JudgeScore {
  id: string
  hackathonId: string
  ideaId: string
  judgeId: string
  criterionId: string | null
  score: number
  comment: string | null
  createdAt: string
}

export interface ScoreSummary {
  ideaId: string
  ideaTitle: string
  panelScore: number | null
  communityScore: number | null
  blendedScore: number
  rank: number
  judgeCount: number
  voteCount: number
}

export interface SubmitScoreInput {
  ideaId: string
  criterionId?: string
  score: number
  comment?: string
}

export interface FinalSubmission {
  id: string
  hackathonId: string
  teamId: string
  teamName: string | null
  ideaId: string | null
  title: string
  description: string | null
  attachments: Attachment[]
  submittedBy: string
  submittedAt: string
  updatedAt: string
}

export type AttachmentType = 'pptx' | 'video' | 'youtube' | 'github' | 'bitbucket' | 'url'

export interface Attachment {
  type: AttachmentType
  url: string
  filename?: string
}

export interface FinalSubmissionInput {
  title: string
  description?: string
  attachments: Attachment[]
  ideaId?: string
}

export class JudgingService {
  // ── Judges ────────────────────────────────────────────────────────────────

  static async getJudges(hackathonId: string): Promise<HackathonJudge[]> {
    return api.get(`/api/v1/hackathons/${hackathonId}/judging/judges`)
  }

  static async inviteJudge(hackathonId: string, userId: string): Promise<HackathonJudge> {
    return api.post(`/api/v1/hackathons/${hackathonId}/judging/judges`, { userId })
  }

  static async removeJudge(hackathonId: string, userId: string): Promise<void> {
    return api.delete(`/api/v1/hackathons/${hackathonId}/judging/judges/${userId}`)
  }

  // ── Scores ─────────────────────────────────────────────────────────────────

  static async submitScore(hackathonId: string, input: SubmitScoreInput): Promise<JudgeScore> {
    return api.post(`/api/v1/hackathons/${hackathonId}/judging/scores`, input)
  }

  static async getMyScores(hackathonId: string): Promise<JudgeScore[]> {
    return api.get(`/api/v1/hackathons/${hackathonId}/judging/scores`)
  }

  static async getScoreSummary(hackathonId: string): Promise<ScoreSummary[]> {
    return api.get(`/api/v1/hackathons/${hackathonId}/judging/scores/summary`)
  }

  // ── Final Submissions ──────────────────────────────────────────────────────

  static async getFinalSubmissions(hackathonId: string): Promise<FinalSubmission[]> {
    return api.get(`/api/v1/hackathons/${hackathonId}/submissions`)
  }

  static async getMySubmission(hackathonId: string): Promise<FinalSubmission | null> {
    try {
      return (await api.get<FinalSubmission | undefined>(`/api/v1/hackathons/${hackathonId}/submissions/my`)) ?? null
    } catch {
      return null
    }
  }

  static async submitFinal(
    hackathonId: string,
    input: FinalSubmissionInput
  ): Promise<FinalSubmission> {
    return api.post(`/api/v1/hackathons/${hackathonId}/submissions`, input)
  }
}
