import {
  Stack,
  Card,
  Group,
  Text,
  TextInput,
  Button,
  Avatar,
  Badge,
  ScrollArea,
  ActionIcon,
  Menu,
  FileButton,
  Loader,
  Alert,
} from '@mantine/core'
import {
  IconSend,
  IconPaperclip,
  IconDownload,
  IconDots,
  IconTrash,
  IconEdit,
  IconPhoto,
  IconFile,
} from '@tabler/icons-react'
import { useState, useEffect, useRef } from 'react'
import { useRealtime } from '../hooks/useRealtime'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'

interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: Date
  type: 'text' | 'file' | 'image'
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

interface TeamChatProps {
  teamId: string
  teamName: string
  isOpen?: boolean
}

export function TeamChat({ teamId, teamName, isOpen = true }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const realtime = useRealtime()
  const { user } = useAuthStore()

  useEffect(() => {
    const loadChatHistory = () => {
      // Mock chat history - in real app, fetch from API
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          content: 'Hey team! Welcome to our project chat 🚀',
          senderId: '1',
          senderName: 'John Doe',
          timestamp: new Date(Date.now() - 3600000),
          type: 'text',
        },
        {
          id: '2',
          content: 'Excited to work with everyone! Let\'s build something amazing.',
          senderId: '2',
          senderName: 'Jane Smith',
          timestamp: new Date(Date.now() - 1800000),
          type: 'text',
        },
        {
          id: '3',
          content: 'I\'ve uploaded our initial wireframes',
          senderId: '3',
          senderName: 'Bob Johnson',
          timestamp: new Date(Date.now() - 900000),
          type: 'file',
          fileName: 'wireframes.pdf',
          fileSize: 2048576,
          fileUrl: '#',
        },
      ]
      setMessages(mockMessages)
      scrollToBottom()
    }

    if (realtime.isConnected && teamId) {
      // Subscribe to team chat using Supabase realtime
      const channel = realtime.subscribeToTeamChat(teamId, (payload) => {
        if (payload.type === 'team_message') {
          const message = payload.data as ChatMessage
          setMessages(prev => [...prev, message])
          scrollToBottom()
        } else if (payload.type === 'message_deleted') {
          const messageId = payload.messageId as string
          setMessages(prev => prev.filter(msg => msg.id !== messageId))
        }
      })
      
      setIsConnected(true)
      loadChatHistory()

      return () => {
        if (channel) {
          realtime.unsubscribeFromChannel(channel)
        }
        setIsConnected(false)
      }
    }
  }, [realtime.isConnected, teamId, realtime])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !user) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      timestamp: new Date(),
      type: 'text',
    }

    // Broadcast message using Supabase realtime
    realtime.broadcastEvent(`team_chat_${teamId}`, 'team_message', {
      type: 'team_message',
      data: message,
    })

    // Add to local state immediately for better UX
    setMessages(prev => [...prev, message])
    setNewMessage('')
    scrollToBottom()
  }

  const handleFileUpload = (file: File | null) => {
    if (!file || !user) return

    setIsLoading(true)

    // Mock file upload - in real app, upload to storage service
    setTimeout(() => {
      const message: ChatMessage = {
        id: Date.now().toString(),
        content: `Shared a file: ${file.name}`,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        timestamp: new Date(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileName: file.name,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file),
      }

      realtime.broadcastEvent(`team_chat_${teamId}`, 'team_message', {
        type: 'team_message',
        data: message,
      })

      setMessages(prev => [...prev, message])
      setIsLoading(false)
      scrollToBottom()

      notifications.show({
        title: 'File Shared',
        message: `${file.name} has been shared with the team`,
        color: 'green',
      })
    }, 1000)
  }

  const deleteMessage = (messageId: string) => {
    realtime.broadcastEvent(`team_chat_${teamId}`, 'message_deleted', {
      type: 'message_deleted',
      messageId,
    })
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (!isOpen) return null

  return (
    <Card withBorder radius="md" h={500}>
      <Stack h="100%" gap="sm">
        {/* Header */}
        <Group justify="space-between" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group>
            <Text fw={600}>{teamName} Chat</Text>
            <Badge variant="light" color={isConnected ? 'green' : 'red'} size="sm">
              {isConnected ? 'Connected' : 'Offline'}
            </Badge>
          </Group>
        </Group>

        {/* Messages */}
        <ScrollArea flex={1} type="hover">
          <Stack gap="xs" p="xs">
            {messages.map((message) => (
              <Group key={message.id} align="flex-start" gap="sm">
                <Avatar src={message.senderAvatar} size="sm" radius="xl">
                  {message.senderName.charAt(0)}
                </Avatar>
                <Stack gap={2} flex={1}>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {message.senderName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatTime(message.timestamp)}
                      </Text>
                    </Group>
                    {message.senderId === user?.id && (
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon size="sm" variant="subtle" color="gray">
                            <IconDots size={14} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit size={14} />}>
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => deleteMessage(message.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                  
                  {message.type === 'text' && (
                    <Text size="sm">{message.content}</Text>
                  )}
                  
                  {(message.type === 'file' || message.type === 'image') && (
                    <Card withBorder p="sm" w="fit-content">
                      <Group gap="sm">
                        {message.type === 'image' ? (
                          <IconPhoto size={16} />
                        ) : (
                          <IconFile size={16} />
                        )}
                        <Stack gap={2}>
                          <Text size="sm" fw={500}>
                            {message.fileName}
                          </Text>
                          {message.fileSize && (
                            <Text size="xs" c="dimmed">
                              {formatFileSize(message.fileSize)}
                            </Text>
                          )}
                        </Stack>
                        <ActionIcon size="sm" variant="light">
                          <IconDownload size={14} />
                        </ActionIcon>
                      </Group>
                    </Card>
                  )}
                </Stack>
              </Group>
            ))}
            {isLoading && (
              <Group justify="center">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Uploading file...</Text>
              </Group>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        </ScrollArea>

        {/* Message Input */}
        <Group gap="xs" align="flex-end">
          <FileButton onChange={handleFileUpload} accept="*">
            {(props) => (
              <ActionIcon {...props} variant="light" size="md">
                <IconPaperclip size={16} />
              </ActionIcon>
            )}
          </FileButton>
          
          <TextInput
            flex={1}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={!isConnected}
          />
          
          <Button
            size="sm"
            leftSection={<IconSend size={14} />}
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
          >
            Send
          </Button>
        </Group>

        {!isConnected && (
          <Alert color="yellow" variant="light">
            Chat is offline. Messages will be sent when connection is restored.
          </Alert>
        )}
      </Stack>
    </Card>
  )
}
