import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Avatar,
  Badge,
  ActionIcon,
  Button,
  ScrollArea,
  Divider,
  Center,
  Indicator,
} from '@mantine/core'
import {
  IconBell,
  IconTrash,
  IconUsers,
  IconBulb,
  IconTrophy,
  IconMessage,
  IconSettings,
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useRealtime } from '../hooks/useSocket'
import { useAuthStore } from '../store/authStore'

interface Notification {
  id: string
  title: string
  message: string
  type: 'team_invite' | 'idea_vote' | 'hackathon_update' | 'message' | 'achievement' | 'general'
  isRead: boolean
  createdAt: Date
  actionUrl?: string
  metadata?: {
    teamId?: string
    ideaId?: string
    hackathonId?: string
    fromUserId?: string
    fromUserName?: string
  }
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { subscribeToNotifications, broadcastEvent } = useRealtime()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      // Load initial notifications
      loadNotifications()

      // Subscribe to real-time notifications
      subscribeToNotifications()
    }
  }, [user, subscribeToNotifications])

  const loadNotifications = () => {
    // Mock notifications - in real app, fetch from API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Team Invitation',
        message: 'John Doe invited you to join "AI Innovators" team',
        type: 'team_invite',
        isRead: false,
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        metadata: {
          teamId: '1',
          fromUserId: '1',
          fromUserName: 'John Doe',
        },
      },
      {
        id: '2',
        title: 'Idea Liked',
        message: 'Your idea "Smart City Traffic Management" received 5 new votes!',
        type: 'idea_vote',
        isRead: false,
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        metadata: {
          ideaId: '1',
        },
      },
      {
        id: '3',
        title: 'Hackathon Starting Soon',
        message: 'Winter AI Challenge 2024 starts in 2 hours. Good luck!',
        type: 'hackathon_update',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        metadata: {
          hackathonId: '1',
        },
      },
      {
        id: '4',
        title: 'New Team Message',
        message: 'Jane Smith sent a message in AI Innovators chat',
        type: 'message',
        isRead: true,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        metadata: {
          teamId: '1',
          fromUserId: '2',
          fromUserName: 'Jane Smith',
        },
      },
      {
        id: '5',
        title: 'Achievement Unlocked!',
        message: 'You earned the "Idea Generator" badge for submitting 5 ideas',
        type: 'achievement',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
    ]
    setNotifications(mockNotifications)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_invite':
        return <IconUsers size={16} />
      case 'idea_vote':
        return <IconBulb size={16} />
      case 'hackathon_update':
        return <IconTrophy size={16} />
      case 'message':
        return <IconMessage size={16} />
      case 'achievement':
        return <IconTrophy size={16} />
      default:
        return <IconBell size={16} />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'team_invite':
        return 'blue'
      case 'idea_vote':
        return 'yellow'
      case 'hackathon_update':
        return 'violet'
      case 'message':
        return 'green'
      case 'achievement':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ))
    
    // Broadcast to server
    broadcastEvent('notifications', 'mark_notification_read', { notificationId })
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    broadcastEvent('notifications', 'mark_all_notifications_read', {})
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    broadcastEvent('notifications', 'delete_notification', { notificationId })
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!isOpen) return null

  return (
    <Card 
      withBorder 
      shadow="lg" 
      radius="md" 
      w={400} 
      h={500}
      style={{ 
        position: 'fixed', 
        top: 80, 
        right: 20, 
        zIndex: 1000,
      }}
    >
      <Stack h="100%" gap="sm">
        {/* Header */}
        <Group justify="space-between" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group>
            <Title order={4}>Notifications</Title>
            {unreadCount > 0 && (
              <Badge size="sm" variant="filled" color="red">
                {unreadCount}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            {unreadCount > 0 && (
              <Button size="xs" variant="subtle" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            <ActionIcon variant="subtle" size="sm" onClick={onClose}>
              <IconSettings size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Notifications List */}
        <ScrollArea flex={1} type="hover">
          {notifications.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <IconBell size={48} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" ta="center">
                  No notifications yet
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="xs">
              {notifications.map((notification) => (
                <div key={notification.id}>
                  <Card 
                    p="sm" 
                    radius="sm"
                    style={{ 
                      backgroundColor: notification.isRead 
                        ? 'transparent' 
                        : 'var(--mantine-color-blue-0)',
                      cursor: 'pointer',
                    }}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <Group align="flex-start" gap="sm">
                      <Indicator disabled={notification.isRead} color="blue" size={8}>
                        <Avatar 
                          size="sm" 
                          radius="xl" 
                          color={getNotificationColor(notification.type)}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </Indicator>
                      
                      <Stack gap={2} flex={1}>
                        <Group justify="space-between" align="flex-start">
                          <Text 
                            size="sm" 
                            fw={notification.isRead ? 400 : 600}
                            lineClamp={1}
                          >
                            {notification.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {formatTime(notification.createdAt)}
                          </Text>
                        </Group>
                        
                        <Text 
                          size="xs" 
                          c="dimmed" 
                          lineClamp={2}
                        >
                          {notification.message}
                        </Text>
                      </Stack>

                      <ActionIcon 
                        size="xs" 
                        variant="subtle" 
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Group>
                  </Card>
                  <Divider size="xs" />
                </div>
              ))}
            </Stack>
          )}
        </ScrollArea>

        {/* Footer */}
        <Divider />
        <Group justify="center">
          <Button variant="subtle" size="sm" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
