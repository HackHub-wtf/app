import React, { createContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'

interface NotificationData {
  title: string
  message: string
  type: 'error' | 'success' | 'info'
}

interface TeamInviteData {
  teamName: string
  teamId: string
  invitedBy: string
}

interface TeamUpdateData {
  teamId: string
  type: string
  data: unknown
}

interface IdeaVoteData {
  ideaId: string
  votes: number
  userVote?: string
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data?: unknown) => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emit: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
})

export { SocketContext }

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      // In production, this would be your API URL
      const newSocket = io(import.meta.env.VITE_API_URL || 'ws://localhost:8000', {
        auth: {
          userId: user.id,
          userEmail: user.email,
        },
        transports: ['websocket'],
      })

      newSocket.on('connect', () => {
        console.log('Connected to socket server')
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server')
        setIsConnected(false)
      })

      // Handle incoming notifications
      newSocket.on('notification', (data: NotificationData) => {
        notifications.show({
          title: data.title,
          message: data.message,
          color: data.type === 'error' ? 'red' : data.type === 'success' ? 'green' : 'blue',
        })
      })

      // Handle team invites
      newSocket.on('team_invite', (data: TeamInviteData) => {
        notifications.show({
          title: 'Team Invitation',
          message: `You've been invited to join ${data.teamName}`,
          color: 'blue',
          autoClose: false,
        })
      })

      // Handle real-time team updates
      newSocket.on('team_update', (data: TeamUpdateData) => {
        // This will be handled by the team store
        console.log('Team update received:', data)
      })

      // Handle real-time idea votes
      newSocket.on('idea_vote_update', (data: IdeaVoteData) => {
        console.log('Idea vote update:', data)
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [user])

  const emit = (event: string, data?: unknown) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  const joinRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', room)
    }
  }

  const leaveRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('leave_room', room)
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        emit,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
