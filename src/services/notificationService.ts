import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Notification = Database['public']['Tables']['notifications']['Row']

export class NotificationService {
  // Get notifications for a user
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data
  }

  // Get unread notifications count
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }

    return count || 0
  }

  // Create a notification
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionUrl?: string
  ): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }

    return data
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }

    return true
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }

    return true
  }

  // Delete a notification
  static async deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting notification:', error)
      throw error
    }

    return true
  }

  // Create team-related notifications
  static async notifyTeamJoin(teamId: string, userName: string): Promise<void> {
    // Get team members to notify
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('user_id, teams(name)')
      .eq('team_id', teamId)

    if (teamMembers) {
      const promises = teamMembers.map(member => 
        this.createNotification(
          member.user_id,
          'New Team Member',
          `${userName} has joined your team`,
          'info'
        )
      )
      await Promise.all(promises)
    }
  }

  // Create hackathon-related notifications
  static async notifyHackathonUpdate(hackathonId: string, title: string, message: string): Promise<void> {
    // Get hackathon participants (team members)
    const { data: participants } = await supabase
      .from('team_members')
      .select(`
        user_id,
        teams!inner(hackathon_id)
      `)
      .eq('teams.hackathon_id', hackathonId)

    if (participants) {
      const uniqueUserIds = [...new Set(participants.map(p => p.user_id))]
      const promises = uniqueUserIds.map(userId => 
        this.createNotification(
          userId,
          title,
          message,
          'info'
        )
      )
      await Promise.all(promises)
    }
  }

  // Create idea-related notifications
  static async notifyIdeaVote(ideaId: string, voterName: string): Promise<void> {
    // Get idea creator
    const { data: idea } = await supabase
      .from('ideas')
      .select('created_by, title')
      .eq('id', ideaId)
      .single()

    if (idea) {
      await this.createNotification(
        idea.created_by,
        'New Vote',
        `${voterName} voted on your idea "${idea.title}"`,
        'success'
      )
    }
  }

  // Create comment notification
  static async notifyIdeaComment(ideaId: string, commenterName: string): Promise<void> {
    // Get idea creator
    const { data: idea } = await supabase
      .from('ideas')
      .select('created_by, title')
      .eq('id', ideaId)
      .single()

    if (idea) {
      await this.createNotification(
        idea.created_by,
        'New Comment',
        `${commenterName} commented on your idea "${idea.title}"`,
        'info'
      )
    }
  }
}
