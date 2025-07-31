import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

interface NotificationData {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface TeamInviteData {
  teamName: string
  teamId: string
  invitedBy: string
}

interface TeamUpdateData {
  teamId: string
  type: 'member_joined' | 'member_left' | 'team_updated'
  data: unknown
}

interface RealtimePayload {
  [key: string]: unknown
}

interface RealtimeContextType {
  isConnected: boolean
  subscribeToChannel: (channelName: string, callback: (payload: RealtimePayload) => void) => RealtimeChannel | null
  unsubscribeFromChannel: (channel: RealtimeChannel) => void
  broadcastEvent: (channelName: string, event: string, payload: RealtimePayload) => void
  subscribeToNotifications: () => void
  subscribeToTeamUpdates: (teamId: string) => void
  subscribeToIdeaVotes: (ideaId: string) => void
  subscribeToTeamChat: (teamId: string, callback: (payload: RealtimePayload) => void) => RealtimeChannel | null
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [channels, setChannels] = useState<RealtimeChannel[]>([])
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      // Wait a bit for auth to fully establish before connecting to realtime
      const timer = setTimeout(() => {
        // Check if we can connect to Supabase real-time
        const checkConnection = async () => {
          try {
            const { error } = await supabase.from('hackathons').select('id').limit(1)
            if (!error) {
              console.log('✅ Supabase connection established')
              setIsConnected(true)
            }
          } catch (err) {
            console.error('Failed to connect to Supabase:', err)
            setIsConnected(false)
          }
        }
        
        checkConnection()
      }, 1000) // Wait 1 second for auth to stabilize

      return () => {
        clearTimeout(timer)
        // Clean up all channels when component unmounts
        channels.forEach(channel => {
          supabase.removeChannel(channel)
        })
        setChannels([])
        setIsConnected(false)
      }
    } else {
      // User logged out
      setIsConnected(false)
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      setChannels([])
    }
  }, [user]) // Don't include channels as dependency to avoid cleanup loops

  const subscribeToChannel = useCallback((channelName: string, callback: (payload: RealtimePayload) => void): RealtimeChannel | null => {
    if (!user || !isConnected) return null

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: '*' }, callback)
      .subscribe()

    setChannels(prev => [...prev, channel])
    return channel
  }, [user, isConnected])

  const unsubscribeFromChannel = useCallback((channel: RealtimeChannel) => {
    supabase.removeChannel(channel)
    setChannels(prev => prev.filter(c => c !== channel))
  }, [])

  const broadcastEvent = useCallback((channelName: string, event: string, payload: RealtimePayload) => {
    if (!user || !isConnected) return

    const channel = channels.find(c => c.topic === channelName)
    if (channel) {
      channel.send({
        type: 'broadcast',
        event,
        payload
      })
    }
  }, [user, isConnected, channels])

  const subscribeToNotifications = useCallback(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        const data = payload.payload as NotificationData
        notifications.show({
          title: data.title,
          message: data.message,
          color: data.type === 'error' ? 'red' : data.type === 'success' ? 'green' : 'blue',
        })
      })
      .on('broadcast', { event: 'team_invite' }, (payload) => {
        const data = payload.payload as TeamInviteData
        notifications.show({
          title: 'Team Invitation',
          message: `You've been invited to join ${data.teamName}`,
          color: 'blue',
          autoClose: false,
        })
      })
      .subscribe()

    setChannels(prev => [...prev, channel])
    return channel
  }, [user])

  const subscribeToTeamUpdates = useCallback((teamId: string) => {
    if (!user) return

    const channel = supabase
      .channel(`team:${teamId}`)
      .on('broadcast', { event: 'team_update' }, (payload) => {
        const data = payload.payload as TeamUpdateData
        console.log('Team update received:', data)
        // This can trigger team store updates
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `id=eq.${teamId}`
      }, (payload) => {
        console.log('Team database update:', payload)
        // Handle database changes for the team
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${teamId}`
      }, (payload) => {
        console.log('Team members update:', payload)
        // Handle team member changes
      })
      .subscribe()

    setChannels(prev => [...prev, channel])
    return channel
  }, [user])

  const subscribeToIdeaVotes = useCallback((ideaId: string) => {
    if (!user) return

    const channel = supabase
      .channel(`idea:${ideaId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'idea_votes',
        filter: `idea_id=eq.${ideaId}`
      }, (payload) => {
        console.log('Idea vote update:', payload)
        // This can trigger idea store updates
      })
      .subscribe()

    setChannels(prev => [...prev, channel])
    return channel
  }, [user])

  const subscribeToTeamChat = useCallback((teamId: string, callback: (payload: RealtimePayload) => void): RealtimeChannel | null => {
    if (!user) return null

    const channel = supabase
      .channel(`team_chat:${teamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `team_id=eq.${teamId}`
      }, (payload) => {
        console.log('Chat message inserted:', payload)
        callback({ event: 'INSERT', payload: payload.new })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `team_id=eq.${teamId}`
      }, (payload) => {
        console.log('Chat message updated:', payload)
        callback({ event: 'UPDATE', payload: payload.new })
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: `team_id=eq.${teamId}`
      }, (payload) => {
        console.log('Chat message deleted:', payload)
        callback({ event: 'DELETE', payload: payload.old })
      })
      .subscribe()

    setChannels(prev => [...prev, channel])
    return channel
  }, [user])

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        subscribeToChannel,
        unsubscribeFromChannel,
        broadcastEvent,
        subscribeToNotifications,
        subscribeToTeamUpdates,
        subscribeToIdeaVotes,
        subscribeToTeamChat,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

// Legacy hook for backward compatibility
export function useSocket() {
  console.warn('useSocket is deprecated. Use useRealtime instead.')
  const realtime = useRealtime()
  
  return {
    socket: null, // Legacy compatibility
    isConnected: realtime.isConnected,
    emit: (event: string, data?: unknown) => {
      // Convert to broadcast format
      realtime.broadcastEvent('legacy', event, (data as RealtimePayload) || {})
    },
    joinRoom: (room: string) => {
      realtime.subscribeToChannel(room, () => {})
    },
    leaveRoom: (room: string) => {
      // Find and unsubscribe from the channel
      console.log(`Legacy leaveRoom called for ${room}`)
    },
  }
}
