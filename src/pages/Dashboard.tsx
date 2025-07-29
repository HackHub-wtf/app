import {
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Title,
  Avatar,
  ThemeIcon,
  SimpleGrid,
  Paper,
  rem,
} from '@mantine/core'
import {
  IconTrophy,
  IconUsers,
  IconBulb,
  IconTarget,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { NotificationService } from '../services/notificationService'

interface DashboardStats {
  totalHackathons: number
  activeHackathons: number
  totalTeams: number
  totalIdeas: number
  myTeams: number
  myIdeas: number
}

export function Dashboard() {
  const { user } = useAuthStore()
  const { hackathons, teams, fetchHackathons } = useHackathonStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalHackathons: 0,
    activeHackathons: 0,
    totalTeams: 0,
    totalIdeas: 0,
    myTeams: 0,
    myIdeas: 0,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      // Fetch hackathons
      await fetchHackathons()

      // Fetch user notifications
      try {
        const userNotifications = await NotificationService.getUserNotifications(user.id)
        setNotifications(userNotifications.slice(0, 5)) // Get latest 5
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    }

    loadDashboardData()
  }, [user, fetchHackathons])

  useEffect(() => {
    // Calculate stats from loaded data
    const activeHackathons = hackathons.filter(h => h.status === 'running' || h.status === 'open')
    const myTeams = teams.filter(t => 
      t.team_members.some(member => member.user_id === user?.id)
    )

    setStats({
      totalHackathons: hackathons.length,
      activeHackathons: activeHackathons.length,
      totalTeams: teams.length,
      totalIdeas: 0, // We'll update this when we have ideas
      myTeams: myTeams.length,
      myIdeas: 0, // We'll update this when we have ideas
    })
  }, [hackathons, teams, user])

  const isManager = user?.role === 'manager' || user?.role === 'admin'

  const statCards = [
    {
      title: 'Active Hackathons',
      value: stats.activeHackathons,
      icon: IconTrophy,
      color: 'blue',
    },
    {
      title: 'Total Teams',
      value: stats.totalTeams,
      icon: IconUsers,
      color: 'green',
    },
    {
      title: 'My Teams',
      value: stats.myTeams,
      icon: IconBulb,
      color: 'yellow',
    },
    {
      title: isManager ? 'Total Hackathons' : 'My Ideas',
      value: isManager ? stats.totalHackathons : stats.myIdeas,
      icon: IconTarget,
      color: 'purple',
    },
  ]

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="md">Welcome back, {user?.name}!</Title>
        <Text c="dimmed">Here's what's happening in your hackathon community</Text>
      </div>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
        {statCards.map((stat) => (
          <Paper key={stat.title} p="md" radius="md" withBorder>
            <Group>
              <ThemeIcon size={40} variant="light" color={stat.color}>
                <stat.icon style={{ width: rem(24), height: rem(24) }} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {stat.title}
                </Text>
                <Text fw={700} size="xl">
                  {stat.value}
                </Text>
              </div>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      <Grid>
        {/* Recent Activity */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder h="100%">
            <Card.Section p="md" withBorder>
              <Title order={4}>Recent Activity</Title>
            </Card.Section>
            <Card.Section p="md">
              <Stack gap="sm">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <Group key={notification.id} wrap="nowrap">
                      <Avatar size="sm" radius="xl">
                        {notification.type === 'success' ? '✅' : 
                         notification.type === 'warning' ? '⚠️' : 
                         notification.type === 'error' ? '❌' : 'ℹ️'}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                          {notification.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {notification.message}
                        </Text>
                      </div>
                      <Text size="xs" c="dimmed">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </Text>
                    </Group>
                  ))
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No recent activity
                  </Text>
                )}
              </Stack>
            </Card.Section>
          </Card>
        </Grid.Col>

        {/* Active Hackathons */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder h="100%">
            <Card.Section p="md" withBorder>
              <Title order={4}>Active Hackathons</Title>
            </Card.Section>
            <Card.Section p="md">
              <Stack gap="sm">
                {hackathons.filter(h => h.status === 'running' || h.status === 'open').length > 0 ? (
                  hackathons
                    .filter(h => h.status === 'running' || h.status === 'open')
                    .slice(0, 3)
                    .map((hackathon) => (
                      <Group key={hackathon.id} justify="space-between">
                        <div>
                          <Text size="sm" fw={500}>
                            {hackathon.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {hackathon.current_participants} participants
                          </Text>
                        </div>
                        <Badge 
                          color={hackathon.status === 'running' ? 'green' : 'blue'} 
                          variant="light"
                        >
                          {hackathon.status}
                        </Badge>
                      </Group>
                    ))
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No active hackathons
                  </Text>
                )}
              </Stack>
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
