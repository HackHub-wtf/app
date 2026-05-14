import { api } from '../lib/apiClient'
import type { PageResponse } from './hackathonService'

export interface Idea {
  id: string
  title: string
  description: string
  hackathonId: string
  teamId: string | null
  createdBy: string
  category: string
  tags: string[]
  votes: number
  status: 'draft' | 'submitted' | 'in-progress' | 'completed'
  attachments: string[]
  repositoryUrl: string | null
  demoUrl: string | null
  projectAttachments: ProjectAttachment[] | null
  totalScore: number
  voteCount: number
  createdAt: string
  updatedAt: string
  userHasVoted?: boolean
}

export interface ProjectAttachment {
  type: 'screenshot' | 'video' | 'document' | 'link'
  url: string
  name: string
  description?: string
}

export interface CreateIdeaInput {
  title: string
  description: string
  hackathonId: string
  teamId?: string
  category: string
  tags?: string[]
}

export interface VoteResult {
  voted: boolean
  voteCount: number
}

export class IdeaService {
  static async getIdeas(hackathonId: string, page = 0, size = 20): Promise<PageResponse<Idea>> {
    return api.get(`/api/v1/hackathons/${hackathonId}/ideas?page=${page}&size=${size}`)
  }

  static async getIdea(id: string): Promise<Idea> {
    return api.get(`/api/v1/ideas/${id}`)
  }

  static async createIdea(data: CreateIdeaInput): Promise<Idea> {
    return api.post(`/api/v1/hackathons/${data.hackathonId}/ideas`, data)
  }

  static async updateIdea(id: string, updates: Partial<CreateIdeaInput>): Promise<Idea> {
    return api.put(`/api/v1/ideas/${id}`, updates)
  }

  static async deleteIdea(id: string): Promise<void> {
    return api.delete(`/api/v1/ideas/${id}`)
  }

  /** Toggle vote — returns new state. Previously broken due to Supabase 406 errors. */
  static async voteIdea(ideaId: string): Promise<VoteResult> {
    return api.post(`/api/v1/ideas/${ideaId}/votes`)
  }

  static async addComment(ideaId: string, content: string): Promise<void> {
    return api.post(`/api/v1/ideas/${ideaId}/comments`, { content })
  }

  static async getComments(ideaId: string): Promise<Comment[]> {
    return api.get(`/api/v1/ideas/${ideaId}/comments`)
  }
}

export interface Comment {
  id: string
  ideaId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
}
