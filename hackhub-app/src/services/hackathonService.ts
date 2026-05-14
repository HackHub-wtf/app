import { api } from '../lib/apiClient'

export type HackathonVisibility = 'public' | 'private'
export type HackathonJoinPolicy = 'invite_only' | 'self_register'
export type JudgingMode = 'panel' | 'community' | 'blended'

export interface Hackathon {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  registrationKey: string
  status: 'draft' | 'open' | 'running' | 'completed'
  maxTeamSize: number
  allowedParticipants: number
  currentParticipants: number
  createdBy: string
  organizationId: string | null
  bannerUrl: string | null
  rules: string | null
  prizes: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  visibility: HackathonVisibility
  joinPolicy: HackathonJoinPolicy
  judgingMode: JudgingMode
  panelWeight: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface CreateHackathonInput {
  title: string
  description: string
  startDate: string
  endDate: string
  maxTeamSize: number
  allowedParticipants: number
  organizationId?: string
  tags?: string[]
  prizes?: string[]
}

export interface JudgingConfigInput {
  visibility?: HackathonVisibility
  joinPolicy?: HackathonJoinPolicy
  judgingMode?: JudgingMode
  panelWeight?: number
}

export class HackathonService {
  static async getHackathons(page = 0, size = 20): Promise<PageResponse<Hackathon>> {
    return api.get(`/api/v1/hackathons?page=${page}&size=${size}`)
  }

  static async getHackathon(id: string): Promise<Hackathon> {
    return api.get(`/api/v1/hackathons/${id}`)
  }

  static async getHackathonsByStatus(
    status: Hackathon['status'], page = 0, size = 20
  ): Promise<PageResponse<Hackathon>> {
    return api.get(`/api/v1/hackathons?status=${status}&page=${page}&size=${size}`)
  }

  static async createHackathon(data: CreateHackathonInput): Promise<Hackathon> {
    return api.post('/api/v1/hackathons', data)
  }

  static async updateHackathon(id: string, data: Partial<CreateHackathonInput>): Promise<Hackathon> {
    return api.put(`/api/v1/hackathons/${id}`, data)
  }

  static async deleteHackathon(id: string): Promise<void> {
    return api.delete(`/api/v1/hackathons/${id}`)
  }

  static async joinHackathon(registrationKey: string): Promise<Hackathon> {
    return api.post('/api/v1/hackathons/join', { registrationKey })
  }

  static async transitionStatus(id: string, status: Hackathon['status']): Promise<Hackathon> {
    return api.patch(`/api/v1/hackathons/${id}/status`, { status })
  }

  static async updateJudgingConfig(id: string, config: JudgingConfigInput): Promise<Hackathon> {
    return api.patch(`/api/v1/hackathons/${id}/config`, config)
  }
}
