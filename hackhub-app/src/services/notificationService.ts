import { api } from '../lib/apiClient'
import type { PageResponse } from './hackathonService'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  actionUrl: string | null
  createdAt: string
}

export class NotificationService {
  static async getNotifications(page = 0, size = 20): Promise<PageResponse<Notification>> {
    return api.get(`/api/v1/notifications?page=${page}&size=${size}`)
  }

  static async getUnreadCount(): Promise<number> {
    const result = await api.get<{ count: number }>('/api/v1/notifications/unread-count')
    return result.count
  }

  static async markAsRead(notificationId: string): Promise<Notification> {
    return api.patch(`/api/v1/notifications/${notificationId}/read`)
  }

  static async markAllRead(): Promise<number> {
    const result = await api.post<{ updated: number }>('/api/v1/notifications/read-all')
    return result.updated
  }

  static async delete(notificationId: string): Promise<void> {
    return api.delete(`/api/v1/notifications/${notificationId}`)
  }
}
