import {
  Stack,
  Card,
  Group,
  Text,
  TextInput,
  Button,
  Avatar,
  ScrollArea,
  Loader,
  Alert,
  Paper,
} from '@mantine/core'
import {
  IconSend,
  IconUsers,
} from '@tabler/icons-react'
import { useState, useEffect, useRef } from 'react'
import { useRealtime } from '../hooks/useRealtime'
import { useAuthStore } from '../store/authStore'
import { ChatService, type ChatMessageWithProfile } from '../services/chatService'
import { notifications } from '@mantine/notifications'

export function TeamChatNew({ teamId }: { teamId: string }) {
  const [messages, setMessages] = useState<ChatMessageWithProfile[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isConnected, subscribeToTeamChat, unsubscribeFromChannel } = useRealtime()
  const { user } = useAuthStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true)
        console.log('Loading chat history for team:', teamId)
        const chatMessages = await ChatService.getTeamMessages(teamId)
        console.log('Loaded messages:', chatMessages)
        setMessages(chatMessages)
        setTimeout(() => scrollToBottom(), 100)
      } catch (error) {
        console.error('Error loading chat messages:', error)
        notifications.show({
          title: 'Error',
          message: 'Failed to load chat messages',
          color: 'red'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (teamId) {
      loadChatHistory()
      
      // Subscribe to real-time chat updates for this specific team
      console.log('Subscribing to chat updates for team:', teamId)
      const channel = subscribeToTeamChat(teamId, (payload) => {
        console.log('Chat update received:', payload)
        if (payload.event === 'INSERT') {
          console.log('New message inserted, reloading chat history')
          // Reload messages to get the new message with profile data
          loadChatHistory()
        }
      })

      if (channel) {
        console.log('Successfully subscribed to team chat channel')
      } else {
        console.warn('Failed to subscribe to team chat channel')
      }

      return () => {
        if (channel) {
          console.log('Unsubscribing from team chat channel')
          unsubscribeFromChannel(channel)
        }
      }
    }
  }, [teamId, subscribeToTeamChat, unsubscribeFromChannel])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || isSending) return

    try {
      setIsSending(true)
      console.log('Sending message:', { teamId, userId: user.id, message: newMessage.trim() })
      await ChatService.sendMessage(teamId, user.id, newMessage.trim())
      console.log('Message sent successfully')
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red'
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  if (isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader size="md" />
        <Text c="dimmed">Loading chat...</Text>
      </Stack>
    )
  }

  return (
    <Stack h={400} gap="sm">
      {!isConnected && (
        <Alert color="yellow" variant="light">
          Connecting to chat...
        </Alert>
      )}
      
      <ScrollArea flex={1} offsetScrollbars>
        <Stack gap="sm" p="sm">
          {messages.length === 0 ? (
            <Paper p="md" withBorder radius="md">
              <Stack align="center" gap="sm">
                <IconUsers size={32} color="gray" />
                <Text c="dimmed" ta="center">
                  No messages yet. Start the conversation!
                </Text>
              </Stack>
            </Paper>
          ) : (
            messages.map((message) => (
              <Card key={message.id} p="sm" withBorder radius="md">
                <Group gap="sm" align="flex-start">
                  <Avatar size="sm" radius="xl">
                    {message.profiles?.name?.charAt(0) || '?'}
                  </Avatar>
                  <Stack gap={4} flex={1}>
                    <Group gap="xs" align="baseline">
                      <Text size="sm" fw={500}>
                        {message.profiles?.name || 'Unknown User'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatTimestamp(message.created_at)}
                      </Text>
                    </Group>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Text>
                  </Stack>
                </Group>
              </Card>
            ))
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </ScrollArea>

      <Group gap="sm">
        <TextInput
          flex={1}
          placeholder="Type your message..."
          value={newMessage}
          onChange={(event) => setNewMessage(event.currentTarget.value)}
          onKeyDown={handleKeyPress}
          disabled={isSending}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
          loading={isSending}
          leftSection={<IconSend size={16} />}
        >
          Send
        </Button>
      </Group>
    </Stack>
  )
}
