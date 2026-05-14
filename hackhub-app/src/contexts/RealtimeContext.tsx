/**
 * RealtimeContext — STOMP WebSocket over SockJS.
 * Replaces Supabase Realtime + Socket.io.
 *
 * Connects with JWT access token on CONNECT frame.
 * Reconnects automatically on token refresh.
 *
 * Topics:
 *   /topic/team.{teamId}.chat           — team chat messages
 *   /topic/hackathon.{id}.updates       — hackathon-scoped events
 *   /user/queue/notifications           — per-user notifications (server-push)
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../store/authStore'
import { tokenStore } from '../lib/tokenStore'

const WS_URL = `${import.meta.env.VITE_WS_URL ?? 'http://localhost:8080'}/ws`

interface RealtimeContextType {
  isConnected: boolean
  subscribeToTeamChat: (
    teamId: string,
    callback: (msg: ChatEvent) => void
  ) => (() => void) | null
  subscribeToHackathonUpdates: (
    hackathonId: string,
    callback: (event: HackathonEvent) => void
  ) => (() => void) | null
  sendTeamMessage: (teamId: string, content: string) => void
}

export interface ChatEvent {
  id: string
  teamId: string
  userId: string
  content: string
  messageType: string
  fileUrl: string | null
  fileName: string | null
  createdAt: string
}

export interface HackathonEvent {
  event: string
  [key: string]: unknown
}

const Context = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!user) {
      clientRef.current?.deactivate()
      clientRef.current = null
      setIsConnected(false)
      return
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${tokenStore.getAccessToken() ?? ''}`,
      },
      reconnectDelay: 3000,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers?.message)
      },
    })

    // Subscribe to user-specific notifications after connect
    client.onConnect = () => {
      setIsConnected(true)
      client.subscribe('/user/queue/notifications', (msg: IMessage) => {
        try {
          const data = JSON.parse(msg.body) as { title: string; message: string }
          notifications.show({
            title: data.title,
            message: data.message,
            color: 'blue',
          })
        } catch {}
      })
    }

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [user?.id])

  const subscribeToTeamChat = useCallback(
    (teamId: string, callback: (msg: ChatEvent) => void) => {
      const c = clientRef.current
      if (!c?.connected) return null
      const sub: StompSubscription = c.subscribe(
        `/topic/team.${teamId}.chat`,
        (msg: IMessage) => {
          try { callback(JSON.parse(msg.body)) } catch {}
        }
      )
      return () => sub.unsubscribe()
    },
    []
  )

  const subscribeToHackathonUpdates = useCallback(
    (hackathonId: string, callback: (event: HackathonEvent) => void) => {
      const c = clientRef.current
      if (!c?.connected) return null
      const sub: StompSubscription = c.subscribe(
        `/topic/hackathon.${hackathonId}.updates`,
        (msg: IMessage) => {
          try { callback(JSON.parse(msg.body)) } catch {}
        }
      )
      return () => sub.unsubscribe()
    },
    []
  )

  const sendTeamMessage = useCallback((teamId: string, content: string) => {
    clientRef.current?.publish({
      destination: `/app/team.${teamId}.message`,
      body: JSON.stringify({ content }),
    })
  }, [])

  return (
    <Context.Provider
      value={{ isConnected, subscribeToTeamChat, subscribeToHackathonUpdates, sendTeamMessage }}
    >
      {children}
    </Context.Provider>
  )
}

export function useRealtime(): RealtimeContextType {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useRealtime must be used inside RealtimeProvider')
  return ctx
}
