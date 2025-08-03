import { supabase, type Database } from '../lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeSubscription {
  unsubscribe: () => void
}

// Type aliases for database rows
type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
type IdeaVote = Database['public']['Tables']['idea_votes']['Row']
type Notification = Database['public']['Tables']['notifications']['Row']
type TeamMember = Database['public']['Tables']['team_members']['Row']
type Hackathon = Database['public']['Tables']['hackathons']['Row']
type Idea = Database['public']['Tables']['ideas']['Row']
type Comment = Database['public']['Tables']['comments']['Row']

// User info type for presence
export interface UserInfo {
  name: string
  avatar?: string
}

// Presence user type
export interface PresenceUser {
  user_id: string
  name: string
  avatar?: string
  online_at: string
}

export class RealtimeService {
  // Subscribe to chat messages for a team
  static subscribeToTeamChat(
    teamId: string,
    onMessage: (payload: RealtimePostgresChangesPayload<ChatMessage>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `team_id=eq.${teamId}`
        },
        onMessage
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Subscribe to idea votes for real-time vote updates
  static subscribeToIdeaVotes(
    hackathonId: string,
    onVote: (payload: RealtimePostgresChangesPayload<IdeaVote>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`idea-votes-${hackathonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'idea_votes'
        },
        onVote
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Subscribe to notifications for a user
  static subscribeToNotifications(
    userId: string,
    onNotification: (payload: RealtimePostgresChangesPayload<Notification>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        onNotification
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Subscribe to team member changes
  static subscribeToTeamMembers(
    teamId: string,
    onMemberChange: (payload: RealtimePostgresChangesPayload<TeamMember>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`team-members-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`
        },
        onMemberChange
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Subscribe to hackathon updates
  static subscribeToHackathon(
    hackathonId: string,
    onUpdate: (payload: RealtimePostgresChangesPayload<Hackathon>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`hackathon-${hackathonId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hackathons',
          filter: `id=eq.${hackathonId}`
        },
        onUpdate
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Subscribe to new ideas in a hackathon
  static subscribeToIdeas(
    hackathonId: string,
    onIdeaChange: (payload: RealtimePostgresChangesPayload<Idea>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`ideas-${hackathonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ideas',
          filter: `hackathon_id=eq.${hackathonId}`
        },
        onIdeaChange
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Subscribe to comments on ideas
  static subscribeToComments(
    ideaId: string,
    onComment: (payload: RealtimePostgresChangesPayload<Comment>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`comments-${ideaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `idea_id=eq.${ideaId}`
        },
        onComment
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Send presence updates (for showing who's online)
  static subscribeToPresence(
    channelName: string,
    userId: string,
    userInfo: UserInfo,
    onPresenceChange: (users: PresenceUser[]) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const rawUsers = Object.values(presenceState).flat() as unknown[]
        const users: PresenceUser[] = rawUsers.filter((presence: unknown): presence is PresenceUser => {
            return Boolean(presence) && 
                   typeof presence === 'object' &&
                   presence !== null &&
                   'user_id' in presence &&
                   'name' in presence &&
                   'online_at' in presence &&
                   typeof (presence as Record<string, unknown>).user_id === 'string' &&
                   typeof (presence as Record<string, unknown>).name === 'string' &&
                   typeof (presence as Record<string, unknown>).online_at === 'string'
          })
        onPresenceChange(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('New users joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Users left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            ...userInfo,
            online_at: new Date().toISOString()
          })
        }
      })

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Broadcast custom events (for features like "user is typing")
  static broadcastEvent(
    channelName: string,
    eventName: string,
    payload: Record<string, unknown>
  ): void {
    const channel = supabase.channel(channelName)
    channel.send({
      type: 'broadcast',
      event: eventName,
      payload
    })
  }

  // Subscribe to broadcast events
  static subscribeToBroadcast(
    channelName: string,
    eventName: string,
    onEvent: (payload: Record<string, unknown>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: eventName }, ({ payload }) => {
        onEvent(payload)
      })
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }
}
