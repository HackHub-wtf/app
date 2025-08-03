import { useRealtime } from './useRealtime'

interface RealtimePayload {
  [key: string]: unknown
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
