import { api } from '../lib/apiClient'
import type { PageResponse } from './hackathonService'

export interface ChatMessageItem {
  id: string
  teamId: string
  userId: string
  content: string
  messageType: 'text' | 'file' | 'system'
  fileUrl: string | null
  fileName: string | null
  createdAt: string
}

export class ChatService {
  static async getTeamMessages(teamId: string, page = 0, size = 50): Promise<ChatMessageItem[]> {
    const result = await api.get<PageResponse<ChatMessageItem>>(
      `/api/v1/teams/${teamId}/messages?page=${page}&size=${size}&sort=createdAt,asc`
    )
    return result.content
  }
}
