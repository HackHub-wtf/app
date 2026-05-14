import { api } from '../lib/apiClient'

export interface VotingCriteria {
  id: string
  hackathonId: string
  name: string
  description: string | null
  weight: number
  displayOrder: number
}

export interface IdeaScore {
  id: string
  ideaId: string
  userId: string
  criteriaId: string
  score: number
}

export class VotingService {
  static async getCriteria(hackathonId: string): Promise<VotingCriteria[]> {
    return api.get(`/api/v1/hackathons/${hackathonId}/voting-criteria`)
  }

  static async createCriteria(
    hackathonId: string,
    data: { name: string; description?: string; weight: number; displayOrder: number }
  ): Promise<VotingCriteria> {
    return api.post(`/api/v1/hackathons/${hackathonId}/voting-criteria`, data)
  }

  static async deleteCriteria(hackathonId: string, criteriaId: string): Promise<void> {
    return api.delete(`/api/v1/hackathons/${hackathonId}/voting-criteria/${criteriaId}`)
  }

  static async scoreIdea(ideaId: string, criteriaId: string, score: number): Promise<IdeaScore> {
    return api.post(`/api/v1/ideas/${ideaId}/scores`, { criteriaId, score })
  }

  static async validateCriteriaWeights(criteria: VotingCriteria[]): Promise<boolean> {
    const total = criteria.reduce((sum, c) => sum + c.weight, 0)
    return total === 100
  }
}
