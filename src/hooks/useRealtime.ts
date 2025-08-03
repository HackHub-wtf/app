import { useContext } from 'react'
import { RealtimeContext } from '../contexts/RealtimeContext.types'

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}