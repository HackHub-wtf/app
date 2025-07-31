import { supabase } from '../lib/supabase'
import type { VotingCriteria, UserScores, IdeaScoreWithCriteria } from './ideaService'

export class VotingService {
  // Get voting criteria for a hackathon
  static async getVotingCriteria(hackathonId: string): Promise<VotingCriteria[]> {
    const { data, error } = await supabase
      .from('voting_criteria')
      .select('*')
      .eq('hackathon_id', hackathonId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching voting criteria:', error)
      return []
    }

    return data as VotingCriteria[]
  }

  // Create voting criteria (managers only)
  static async createVotingCriteria(
    hackathonId: string,
    criteria: Omit<VotingCriteria, 'id' | 'hackathon_id' | 'created_at' | 'updated_at'>
  ): Promise<VotingCriteria | null> {
    const { data, error } = await supabase
      .from('voting_criteria')
      .insert({
        hackathon_id: hackathonId,
        ...criteria
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating voting criteria:', error)
      throw error
    }

    return data as VotingCriteria
  }

  // Update voting criteria (managers only)
  static async updateVotingCriteria(
    id: string,
    updates: Partial<Omit<VotingCriteria, 'id' | 'hackathon_id' | 'created_at' | 'updated_at'>>
  ): Promise<VotingCriteria | null> {
    const { data, error } = await supabase
      .from('voting_criteria')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating voting criteria:', error)
      throw error
    }

    return data as VotingCriteria
  }

  // Delete voting criteria (managers only)
  static async deleteVotingCriteria(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('voting_criteria')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting voting criteria:', error)
      throw error
    }

    return true
  }

  // Validate criteria weights sum to 100%
  static async validateCriteriaWeights(hackathonId: string): Promise<{ isValid: boolean; totalWeight: number }> {
    const criteria = await this.getVotingCriteria(hackathonId)
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
    return { isValid: totalWeight === 100, totalWeight }
  }

  // Bulk update criteria weights
  static async updateCriteriaWeights(
    updates: Array<{ id: string; weight: number }>
  ): Promise<boolean> {
    try {
      // Validate total weight first
      const totalWeight = updates.reduce((sum, update) => sum + update.weight, 0)
      if (totalWeight !== 100) {
        throw new Error(`Total weight must equal 100%, got ${totalWeight}%`)
      }

      // Update all criteria in parallel
      const updatePromises = updates.map(({ id, weight }) =>
        supabase
          .from('voting_criteria')
          .update({ weight })
          .eq('id', id)
      )

      const results = await Promise.all(updatePromises)
      
      // Check if any update failed
      const hasError = results.some(result => result.error)
      if (hasError) {
        throw new Error('Failed to update some criteria weights')
      }

      return true
    } catch (error) {
      console.error('Error updating criteria weights:', error)
      throw error
    }
  }

  // Get user's scores for an idea
  static async getUserScores(ideaId: string, userId: string): Promise<UserScores> {
    const { data, error } = await supabase
      .from('idea_scores')
      .select('criteria_id, score')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user scores:', error)
      return {}
    }

    const scores: UserScores = {}
    data.forEach(score => {
      scores[score.criteria_id] = score.score
    })

    return scores
  }

  // Submit scores for an idea
  static async submitIdeaScores(
    ideaId: string,
    userId: string,
    scores: UserScores
  ): Promise<boolean> {
    try {
      // Validate all scores are between 1-10
      const invalidScores = Object.entries(scores).filter(([, score]) => score < 1 || score > 10)
      if (invalidScores.length > 0) {
        throw new Error('All scores must be between 1 and 10')
      }

      // Delete existing scores for this user and idea
      await supabase
        .from('idea_scores')
        .delete()
        .eq('idea_id', ideaId)
        .eq('user_id', userId)

      // Insert new scores
      const scoreData = Object.entries(scores).map(([criteriaId, score]) => ({
        idea_id: ideaId,
        user_id: userId,
        criteria_id: criteriaId,
        score: score
      }))

      const { error } = await supabase
        .from('idea_scores')
        .insert(scoreData)

      if (error) {
        console.error('Error submitting scores:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in submitIdeaScores:', error)
      throw error
    }
  }

  // Get detailed scores for an idea (for analytics)
  static async getIdeaScoreDetails(ideaId: string): Promise<IdeaScoreWithCriteria[]> {
    const { data, error } = await supabase
      .from('idea_scores')
      .select(`
        *,
        voting_criteria (*)
      `)
      .eq('idea_id', ideaId)

    if (error) {
      console.error('Error fetching idea score details:', error)
      return []
    }

    return data as IdeaScoreWithCriteria[]
  }

  // Get aggregated scoring statistics for an idea
  static async getIdeaScoreStats(ideaId: string): Promise<{
    criteriaStats: Array<{
      criteria: VotingCriteria
      averageScore: number
      scoreCount: number
      scores: number[]
    }>
    totalWeightedScore: number
    totalVotes: number
  }> {
    const scoreDetails = await this.getIdeaScoreDetails(ideaId)
    
    // Group scores by criteria
    const criteriaMap = new Map<string, {
      criteria: VotingCriteria
      scores: number[]
    }>()

    scoreDetails.forEach(score => {
      const criteriaId = score.criteria_id
      if (!criteriaMap.has(criteriaId)) {
        criteriaMap.set(criteriaId, {
          criteria: score.voting_criteria,
          scores: []
        })
      }
      criteriaMap.get(criteriaId)!.scores.push(score.score)
    })

    // Calculate stats for each criteria
    const criteriaStats = Array.from(criteriaMap.values()).map(({ criteria, scores }) => ({
      criteria,
      averageScore: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
      scoreCount: scores.length,
      scores
    }))

    // Calculate total weighted score
    const totalWeightedScore = criteriaStats.reduce((total, stat) => 
      total + (stat.averageScore * stat.criteria.weight / 100), 0
    )

    const uniqueVoters = new Set(scoreDetails.map(score => score.user_id))
    const totalVotes = uniqueVoters.size

    return {
      criteriaStats,
      totalWeightedScore,
      totalVotes
    }
  }

  // Check if user has voted on an idea
  static async hasUserVoted(ideaId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('idea_scores')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .limit(1)

    if (error) {
      console.error('Error checking user vote status:', error)
      return false
    }

    return data.length > 0
  }

  // Remove user's vote (delete all their scores for an idea)
  static async removeUserVote(ideaId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('idea_scores')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing user vote:', error)
      throw error
    }

    return true
  }
}
