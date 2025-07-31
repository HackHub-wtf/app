// Video call service for team collaboration
// Currently using localStorage for demo purposes
// In production, this would integrate with Supabase and a WebRTC service

export interface CallParticipant {
  id: string
  name: string
  avatar?: string
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isHost: boolean
  isScreenSharing: boolean
  joinedAt: string
}

export interface TeamCall {
  id: string
  teamId: string
  hostId: string
  isActive: boolean
  startedAt: string
  endedAt?: string
  participants: CallParticipant[]
}

export interface CallEvent {
  type: 'call_started' | 'call_ended' | 'participant_joined' | 'participant_left' | 'participant_updated'
  teamId: string
  callId?: string
  participant?: CallParticipant
  participantId?: string
  timestamp: string
}

class VideoCallService {
  async startCall(teamId: string, hostId: string, hostName: string, hostAvatar?: string): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      const hostParticipant: CallParticipant = {
        id: hostId,
        name: hostName,
        avatar: hostAvatar,
        isVideoEnabled: true,
        isAudioEnabled: true,
        isHost: true,
        isScreenSharing: false,
        joinedAt: new Date().toISOString(),
      }

      // For now, we'll use localStorage to simulate a call database
      // In a real app, you'd store this in Supabase
      const callId = `call_${teamId}_${Date.now()}`
      const call: TeamCall = {
        id: callId,
        teamId,
        hostId,
        isActive: true,
        startedAt: new Date().toISOString(),
        participants: [hostParticipant],
      }

      localStorage.setItem(`team_call_${teamId}`, JSON.stringify(call))

      return { success: true, callId }
    } catch (error) {
      console.error('Error starting call:', error)
      return { success: false, error: 'Failed to start call' }
    }
  }

  async joinCall(teamId: string, participantId: string, participantName: string, participantAvatar?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const callData = localStorage.getItem(`team_call_${teamId}`)
      if (!callData) {
        return { success: false, error: 'No active call found' }
      }

      const call: TeamCall = JSON.parse(callData)
      
      // Check if participant is already in the call
      if (call.participants.some(p => p.id === participantId)) {
        return { success: true }
      }

      const newParticipant: CallParticipant = {
        id: participantId,
        name: participantName,
        avatar: participantAvatar,
        isVideoEnabled: true,
        isAudioEnabled: true,
        isHost: false,
        isScreenSharing: false,
        joinedAt: new Date().toISOString(),
      }

      call.participants.push(newParticipant)
      localStorage.setItem(`team_call_${teamId}`, JSON.stringify(call))

      return { success: true }
    } catch (error) {
      console.error('Error joining call:', error)
      return { success: false, error: 'Failed to join call' }
    }
  }

  async leaveCall(teamId: string, participantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const callData = localStorage.getItem(`team_call_${teamId}`)
      if (!callData) {
        return { success: true }
      }

      const call: TeamCall = JSON.parse(callData)
      call.participants = call.participants.filter(p => p.id !== participantId)

      if (call.participants.length === 0 || call.hostId === participantId) {
        // End call if host leaves or no participants left
        localStorage.removeItem(`team_call_${teamId}`)
      } else {
        localStorage.setItem(`team_call_${teamId}`, JSON.stringify(call))
      }

      return { success: true }
    } catch (error) {
      console.error('Error leaving call:', error)
      return { success: false, error: 'Failed to leave call' }
    }
  }

  async endCall(teamId: string, hostId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const callData = localStorage.getItem(`team_call_${teamId}`)
      if (!callData) {
        return { success: true }
      }

      const call: TeamCall = JSON.parse(callData)
      
      // Only host can end the call
      if (call.hostId !== hostId) {
        return { success: false, error: 'Only the host can end the call' }
      }

      call.isActive = false
      call.endedAt = new Date().toISOString()
      
      localStorage.removeItem(`team_call_${teamId}`)

      return { success: true }
    } catch (error) {
      console.error('Error ending call:', error)
      return { success: false, error: 'Failed to end call' }
    }
  }

  async updateParticipant(teamId: string, participantId: string, updates: Partial<Pick<CallParticipant, 'isVideoEnabled' | 'isAudioEnabled' | 'isScreenSharing'>>): Promise<{ success: boolean; error?: string }> {
    try {
      const callData = localStorage.getItem(`team_call_${teamId}`)
      if (!callData) {
        return { success: false, error: 'No active call found' }
      }

      const call: TeamCall = JSON.parse(callData)
      const participantIndex = call.participants.findIndex(p => p.id === participantId)
      
      if (participantIndex === -1) {
        return { success: false, error: 'Participant not found' }
      }

      call.participants[participantIndex] = {
        ...call.participants[participantIndex],
        ...updates,
      }

      localStorage.setItem(`team_call_${teamId}`, JSON.stringify(call))

      return { success: true }
    } catch (error) {
      console.error('Error updating participant:', error)
      return { success: false, error: 'Failed to update participant' }
    }
  }

  getActiveCall(teamId: string): TeamCall | null {
    try {
      const callData = localStorage.getItem(`team_call_${teamId}`)
      if (!callData) {
        return null
      }

      const call: TeamCall = JSON.parse(callData)
      return call.isActive ? call : null
    } catch (error) {
      console.error('Error getting active call:', error)
      return null
    }
  }

  getCallParticipants(teamId: string): CallParticipant[] {
    const call = this.getActiveCall(teamId)
    return call?.participants || []
  }

  isCallActive(teamId: string): boolean {
    const call = this.getActiveCall(teamId)
    return call?.isActive || false
  }
}

export const videoCallService = new VideoCallService()
