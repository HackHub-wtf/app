import { useRealtime } from './useRealtime'

// Legacy hook for backward compatibility
export function useSocket() {
  console.warn('useSocket is deprecated. Use useRealtime instead.')
  const realtime = useRealtime()

  return {
    socket: null, // Legacy compatibility
    isConnected: realtime.isConnected,
    emit: (_event: string, _data?: unknown) => {
      console.warn('useSocket.emit is no longer supported. Use useRealtime instead.')
    },
    joinRoom: (_room: string) => {
      console.warn('useSocket.joinRoom is no longer supported. Use useRealtime instead.')
    },
    leaveRoom: (_room: string) => {
      console.warn('useSocket.leaveRoom is no longer supported.')
    },
  }
}
