import { createContext } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'

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
  subscribeToTeamFiles: (teamId: string, callback: (payload: RealtimePayload) => void) => RealtimeChannel | null
}

export const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export type {
  NotificationData,
  TeamInviteData,
  TeamUpdateData,
  RealtimePayload,
  RealtimeContextType
}