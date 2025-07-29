import {
  Stack,
  Group,
  Button,
  Card,
  Text,
  Avatar,
  Badge,
  ActionIcon,
  Grid,
  Center,
  Alert,
  Modal,
  Switch,
  Slider,
} from '@mantine/core'
import {
  IconVideo,
  IconVideoOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhone,
  IconPhoneOff,
  IconScreenShare,
  IconSettings,
  IconUsers,
  IconMessage,
  IconMaximize,
} from '@tabler/icons-react'
import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'

interface TeamVideoCallProps {
  teamId: string
  teamName: string
}

interface CallParticipant {
  id: string
  name: string
  avatar?: string
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isHost: boolean
  isScreenSharing: boolean
}

export function TeamVideoCall({ teamId, teamName }: TeamVideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [participants, setParticipants] = useState<CallParticipant[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [volume, setVolume] = useState(80)
  const [videoQuality, setVideoQuality] = useState(720)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const { socket, emit, joinRoom, leaveRoom } = useSocket()
  const { user } = useAuthStore()

  useEffect(() => {
    if (socket && teamId) {
      // Listen for call events
      socket.on('call_started', ({ participants: callParticipants }: { participants: CallParticipant[] }) => {
        setParticipants(callParticipants)
        setIsCallActive(true)
        setIsConnecting(false)
      })

      socket.on('participant_joined', (participant: CallParticipant) => {
        setParticipants(prev => [...prev, participant])
        notifications.show({
          title: 'Participant Joined',
          message: `${participant.name} joined the call`,
          color: 'green',
        })
      })

      socket.on('participant_left', (participantId: string) => {
        setParticipants(prev => {
          const leftParticipant = prev.find(p => p.id === participantId)
          if (leftParticipant) {
            notifications.show({
              title: 'Participant Left',
              message: `${leftParticipant.name} left the call`,
              color: 'yellow',
            })
          }
          return prev.filter(p => p.id !== participantId)
        })
      })

      socket.on('participant_updated', (updatedParticipant: CallParticipant) => {
        setParticipants(prev => prev.map(p => 
          p.id === updatedParticipant.id ? updatedParticipant : p
        ))
      })

      socket.on('call_ended', () => {
        setIsCallActive(false)
        setParticipants([])
        notifications.show({
          title: 'Call Ended',
          message: 'The team call has ended',
          color: 'blue',
        })
      })

      return () => {
        socket.off('call_started')
        socket.off('participant_joined')
        socket.off('participant_left')
        socket.off('participant_updated')
        socket.off('call_ended')
      }
    }
  }, [socket, teamId])

  const startCall = async () => {
    if (!user) return
    
    setIsConnecting(true)
    
    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      })
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Join video call room
      joinRoom(`call_${teamId}`)
      
      // Emit start call event
      emit('start_team_call', {
        teamId,
        participant: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          isVideoEnabled,
          isAudioEnabled,
          isHost: true,
          isScreenSharing: false,
        },
      })
      
    } catch (error) {
      console.error('Error starting call:', error)
      setIsConnecting(false)
      notifications.show({
        title: 'Call Failed',
        message: 'Could not start the call. Please check your camera and microphone permissions.',
        color: 'red',
      })
    }
  }

  const joinCall = async () => {
    if (!user) return
    
    setIsConnecting(true)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      })
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      joinRoom(`call_${teamId}`)
      
      emit('join_team_call', {
        teamId,
        participant: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          isVideoEnabled,
          isAudioEnabled,
          isHost: false,
          isScreenSharing: false,
        },
      })
      
    } catch (error) {
      console.error('Error joining call:', error)
      setIsConnecting(false)
      notifications.show({
        title: 'Join Failed',
        message: 'Could not join the call. Please check your camera and microphone permissions.',
        color: 'red',
      })
    }
  }

  const endCall = () => {
    // Stop local stream
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }

    leaveRoom(`call_${teamId}`)
    emit('end_team_call', { teamId })
    
    setIsCallActive(false)
    setParticipants([])
    setIsConnecting(false)
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
      }
    }
    
    emit('update_participant', {
      teamId,
      participantId: user?.id,
      isVideoEnabled: !isVideoEnabled,
    })
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
      }
    }
    
    emit('update_participant', {
      teamId,
      participantId: user?.id,
      isAudioEnabled: !isAudioEnabled,
    })
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })
        
        // Replace video track with screen share
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        
        setIsScreenSharing(true)
        emit('update_participant', {
          teamId,
          participantId: user?.id,
          isScreenSharing: true,
        })
      } else {
        // Switch back to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled,
          audio: isAudioEnabled,
        })
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream
        }
        
        setIsScreenSharing(false)
        emit('update_participant', {
          teamId,
          participantId: user?.id,
          isScreenSharing: false,
        })
      }
    } catch (error) {
      console.error('Error toggling screen share:', error)
      notifications.show({
        title: 'Screen Share Error',
        message: 'Could not start screen sharing',
        color: 'red',
      })
    }
  }

  if (!isCallActive) {
    return (
      <Card withBorder p="lg" radius="md">
        <Stack align="center" gap="md">
          <IconVideo size={48} color="var(--mantine-color-blue-6)" />
          <div style={{ textAlign: 'center' }}>
            <Text fw={600} size="lg">Team Video Call</Text>
            <Text c="dimmed" size="sm">
              Start a video call with your {teamName} team members
            </Text>
          </div>
          
          <Group>
            <Button
              leftSection={<IconVideo size={16} />}
              onClick={startCall}
              loading={isConnecting}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
            >
              {isConnecting ? 'Connecting...' : 'Start Call'}
            </Button>
            
            {participants.length > 0 && (
              <Button
                leftSection={<IconPhone size={16} />}
                onClick={joinCall}
                loading={isConnecting}
                variant="outline"
              >
                Join Ongoing Call
              </Button>
            )}
          </Group>
          
          {participants.length > 0 && (
            <Alert color="blue" variant="light">
              <Group>
                <IconUsers size={16} />
                <Text size="sm">
                  {participants.length} team member(s) are currently in a call
                </Text>
              </Group>
            </Alert>
          )}
        </Stack>
      </Card>
    )
  }

  return (
    <Card withBorder radius="md" h={600}>
      <Stack h="100%" gap="sm">
        {/* Header */}
        <Group justify="space-between" p="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group>
            <Text fw={600}>{teamName} Call</Text>
            <Badge variant="light" color="green">
              {participants.length + 1} participants
            </Badge>
          </Group>
          
          <Group gap="xs">
            <ActionIcon 
              variant="light" 
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <IconSettings size={14} />
            </ActionIcon>
            <ActionIcon variant="light" size="sm">
              <IconMaximize size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Video Grid */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Grid h="100%">
            {/* Local Video */}
            <Grid.Col span={participants.length > 0 ? 6 : 12}>
              <Card withBorder h="100%" style={{ position: 'relative' }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  You {isScreenSharing && '(sharing screen)'}
                </div>
                
                {!isVideoEnabled && (
                  <Center style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'var(--mantine-color-dark-6)',
                  }}>
                    <Avatar size="xl" radius="xl">
                      {user?.name?.charAt(0)}
                    </Avatar>
                  </Center>
                )}
              </Card>
            </Grid.Col>
            
            {/* Remote Participants */}
            {participants.map((participant) => (
              <Grid.Col key={participant.id} span={participants.length === 1 ? 6 : 4}>
                <Card withBorder h="100%" style={{ position: 'relative' }}>
                  {participant.isVideoEnabled ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--mantine-color-gray-1)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text c="dimmed">Video stream</Text>
                    </div>
                  ) : (
                    <Center h="100%">
                      <Avatar size="xl" radius="xl" src={participant.avatar}>
                        {participant.name.charAt(0)}
                      </Avatar>
                    </Center>
                  )}
                  
                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    {participant.name}
                    {participant.isHost && ' (Host)'}
                    {participant.isScreenSharing && ' (sharing screen)'}
                  </div>
                  
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}>
                    <Group gap={4}>
                      {!participant.isAudioEnabled && (
                        <Badge size="xs" color="red">
                          <IconMicrophoneOff size={10} />
                        </Badge>
                      )}
                      {!participant.isVideoEnabled && (
                        <Badge size="xs" color="red">
                          <IconVideoOff size={10} />
                        </Badge>
                      )}
                    </Group>
                  </div>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* Controls */}
        <Group justify="center" p="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <ActionIcon
            size="lg"
            variant={isAudioEnabled ? 'filled' : 'light'}
            color={isAudioEnabled ? 'blue' : 'red'}
            onClick={toggleAudio}
          >
            {isAudioEnabled ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
          </ActionIcon>
          
          <ActionIcon
            size="lg"
            variant={isVideoEnabled ? 'filled' : 'light'}
            color={isVideoEnabled ? 'blue' : 'red'}
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
          </ActionIcon>
          
          <ActionIcon
            size="lg"
            variant={isScreenSharing ? 'filled' : 'light'}
            color={isScreenSharing ? 'green' : 'gray'}
            onClick={toggleScreenShare}
          >
            <IconScreenShare size={20} />
          </ActionIcon>
          
          <ActionIcon
            size="lg"
            variant="light"
            color="blue"
          >
            <IconMessage size={20} />
          </ActionIcon>
          
          <Button
            leftSection={<IconPhoneOff size={16} />}
            color="red"
            onClick={endCall}
          >
            End Call
          </Button>
        </Group>
      </Stack>

      {/* Settings Modal */}
      <Modal
        opened={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Call Settings"
        size="sm"
      >
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">Audio</Text>
            <Group justify="space-between">
              <Text size="sm">Microphone</Text>
              <Switch
                checked={isAudioEnabled}
                onChange={(event) => {
                  setIsAudioEnabled(event.currentTarget.checked)
                  toggleAudio()
                }}
              />
            </Group>
            <Text size="xs" c="dimmed" mt="xs">Volume: {volume}%</Text>
            <Slider
              value={volume}
              onChange={setVolume}
              min={0}
              max={100}
              size="sm"
              mt="xs"
            />
          </div>
          
          <div>
            <Text size="sm" fw={500} mb="xs">Video</Text>
            <Group justify="space-between">
              <Text size="sm">Camera</Text>
              <Switch
                checked={isVideoEnabled}
                onChange={(event) => {
                  setIsVideoEnabled(event.currentTarget.checked)
                  toggleVideo()
                }}
              />
            </Group>
            <Text size="xs" c="dimmed" mt="xs">Quality: {videoQuality}p</Text>
            <Slider
              value={videoQuality}
              onChange={setVideoQuality}
              min={480}
              max={1080}
              step={240}
              marks={[
                { value: 480, label: '480p' },
                { value: 720, label: '720p' },
                { value: 1080, label: '1080p' },
              ]}
              size="sm"
              mt="xs"
            />
          </div>
        </Stack>
      </Modal>
    </Card>
  )
}
