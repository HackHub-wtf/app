import {
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Title,
  ThemeIcon,
  SimpleGrid,
  Paper,
  rem,
  Container,
  Alert,
  Skeleton,
  Button,
  Anchor
} from '@mantine/core'
import {
  IconTrophy,
  IconUsers,
  IconBulb,
  IconCalendar,
  IconAlertCircle,
  IconCheck,
  IconHeart,
  IconX,
  IconBell
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { NotificationService } from '../services/notificationService'
import { TeamService } from '../services/teamService'
import type { Team } from '../services/teamService'
import { IdeaService } from '../services/ideaService'
import type { Idea } from '../services/ideaService'
import { Link } from 'react-router-dom'
import { PermissionService } from '../utils/permissions'
import { OrganizationService } from '../services/organizationService'
import type { Notification as ApiNotification } from '../services/notificationService'

interface DashboardStats {
  totalHackathons: number
  activeHackathons: number
  totalTeams: number
  totalIdeas: number
  myTeams: number
  myIdeas: number
  unreadNotifications: number
}

export function Dashboard() {
  const { user } = useAuthStore()
  const { hackathons, fetchHackathons } = useHackathonStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalHackathons: 0,
    activeHackathons: 0,
    totalTeams: 0,
    totalIdeas: 0,
    myTeams: 0,
    myIdeas: 0,
    unreadNotifications: 0
  })
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [allIdeas, setAllIdeas] = useState<Idea[]>([])
  const [scopedHackathons, setScopedHackathons] = useState<typeof hackathons>([])
  const [loading, setLoading] = useState(true)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const initializeDashboard = async () => {
    setLoading(true)
    try {
      await fetchHackathons()
      const allHackathons = useHackathonStore.getState().hackathons

      // Scope to user's orgs — same rule as the Hackathons page:
      // admin sees all; everyone else only sees hackathons from their orgs.
      let freshHackathons = allHackathons
      if (user && user.role !== 'admin') {
        try {
          const myOrgs = await OrganizationService.getMyOrganizations()
          const myOrgIds = new Set(myOrgs.map(o => o.id))
          freshHackathons = allHackathons.filter(
            h => h.organizationId && myOrgIds.has(h.organizationId)
          )
        } catch {
          freshHackathons = []
        }
      }

      setScopedHackathons(freshHackathons)

      if (user) {
        await Promise.all([
          loadNotifications(),
          loadComprehensiveStats(freshHackathons)
        ])
      } else {
        calculateBasicStats(freshHackathons)
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeDashboard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchHackathons])

  const loadNotifications = async () => {
    if (!user) return

    setLoadingNotifications(true)
    try {
      const [page, unreadCount] = await Promise.all([
        NotificationService.getNotifications(),
        NotificationService.getUnreadCount()
      ])

      setNotifications(page.content.slice(0, 5))
      setStats(prev => ({ ...prev, unreadNotifications: unreadCount }))
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const loadComprehensiveStats = async (freshHackathons: typeof hackathons) => {
    if (!user) return

    try {
      const activeHackathons = freshHackathons.filter(h => h.status === 'running' || h.status === 'open')

      let teams: Team[] = []
      let ideas: Idea[] = []

      for (const hackathon of activeHackathons) {
        try {
          const [hackathonTeams, hackathonIdeasPage] = await Promise.all([
            TeamService.getTeams(hackathon.id),
            IdeaService.getIdeas(hackathon.id)
          ])

          teams = [...teams, ...hackathonTeams]
          ideas = [...ideas, ...hackathonIdeasPage.content]
        } catch (error) {
          console.error(`Error fetching data for hackathon ${hackathon.id}:`, error)
        }
      }

      setAllIdeas(ideas)

      const myIdeas = ideas.filter(idea => idea.createdBy === user.id)

      setStats(prev => ({
        ...prev,
        totalHackathons: freshHackathons.length,
        activeHackathons: activeHackathons.length,
        totalTeams: teams.length,
        totalIdeas: ideas.length,
        myTeams: 0,
        myIdeas: myIdeas.length
      }))

    } catch (error) {
      console.error('Error loading comprehensive stats:', error)
    }
  }

  const calculateBasicStats = (freshHackathons: typeof hackathons) => {
    const activeHackathons = freshHackathons.filter(h => h.status === 'running' || h.status === 'open')

    setStats(prev => ({
      ...prev,
      totalHackathons: freshHackathons.length,
      activeHackathons: activeHackathons.length,
      totalTeams: 0,
      totalIdeas: 0,
      myTeams: 0,
      myIdeas: 0
    }))
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setStats(prev => ({ ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - 1) }))
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    if (!user) return

    try {
      await NotificationService.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setStats(prev => ({ ...prev, unreadNotifications: 0 }))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const activeHackathons = scopedHackathons.filter(h => h.status === 'running' || h.status === 'open')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running': return 'green'
      case 'open': return 'blue'
      case 'upcoming': return 'yellow'
      case 'completed': return 'gray'
      default: return 'gray'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <IconCheck size={16} />
      case 'warning': return <IconAlertCircle size={16} />
      case 'error': return <IconX size={16} />
      default: return <IconBell size={16} />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'green'
      case 'warning': return 'yellow'
      case 'error': return 'red'
      default: return 'blue'
    }
  }

  const statCards = [
    {
      title: 'Active Hackathons',
      value: stats.activeHackathons,
      icon: IconTrophy,
      color: 'green',
      description: 'Currently running'
    },
    {
      title: 'Total Hackathons',
      value: stats.totalHackathons,
      icon: IconCalendar,
      color: 'blue',
      description: 'All time'
    },
    {
      title: user ? 'My Teams' : 'Total Teams',
      value: user ? stats.myTeams : stats.totalTeams,
      icon: IconUsers,
      color: 'purple',
      description: user ? "Teams I'm in" : 'Across all hackathons'
    },
    {
      title: user ? 'My Ideas' : 'Total Ideas',
      value: user ? stats.myIdeas : stats.totalIdeas,
      icon: IconBulb,
      color: 'orange',
      description: user ? "Ideas I've submitted" : 'Across all hackathons'
    }
  ]

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} mb="xs">
                Welcome back{user ? `, ${user.name}` : ''}!
              </Title>
              <Text c="dimmed" size="lg">
                {user
                  ? "Here's what's happening in your hackathon community"
                  : 'Discover amazing hackathons and join the community'}
              </Text>
              {user && (
                <Group gap="xs" mt="xs">
                  <Badge
                    color={PermissionService.getRoleColor(user.role)}
                    variant="light"
                  >
                    {PermissionService.getRoleDisplayName(user.role)}
                  </Badge>
                  {user.role === 'admin' && (
                    <Badge color="purple" variant="light">
                      All Access
                    </Badge>
                  )}
                  {user.role === 'manager' && PermissionService.canCreateHackathons(user) && (
                    <Badge color="blue" variant="light">
                      Event Organizer
                    </Badge>
                  )}
                </Group>
              )}
            </div>
          </Group>
        </div>

        {/* Notifications */}
        {user && notifications.length > 0 && (
          <Card withBorder>
            <Card.Section p="md" withBorder>
              <Group justify="space-between">
                <Group>
                  <IconBell size={19} />
                  <Title order={4}>Recent Notifications</Title>
                  {stats.unreadNotifications > 0 && (
                    <Badge color="red" variant="filled" size="sm">
                      {stats.unreadNotifications}
                    </Badge>
                  )}
                </Group>
                {stats.unreadNotifications > 0 && (
                  <Button variant="subtle" size="xs" onClick={markAllNotificationsAsRead}>
                    Mark all as read
                  </Button>
                )}
              </Group>
            </Card.Section>
            <Card.Section p="md">
              <Stack gap="sm">
                {loadingNotifications ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={50} />
                  ))
                ) : (
                  notifications.map((notification) => (
                    <Alert
                      key={notification.id}
                      title={notification.title}
                      color={getNotificationColor(notification.type)}
                      icon={getNotificationIcon(notification.type)}
                      withCloseButton
                      onClose={() => dismissNotification(notification.id)}
                      variant={notification.read ? 'light' : 'filled'}
                    >
                      <Text size="sm">{notification.message}</Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        {new Date(notification.createdAt).toLocaleString()}
                      </Text>
                    </Alert>
                  ))
                )}
              </Stack>
            </Card.Section>
          </Card>
        )}

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="lg">
          {statCards.map((stat) => (
            <Paper key={stat.title} p="lg" radius="md" withBorder>
              <Group>
                <ThemeIcon size={50} variant="light" color={stat.color}>
                  <stat.icon style={{ width: rem(28), height: rem(28) }} />
                </ThemeIcon>
                <div style={{ flex: 1 }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {stat.title}
                  </Text>
                  {loading ? (
                    <Skeleton height={32} width={60} />
                  ) : (
                    <Text fw={700} size="xl">
                      {stat.value}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed">
                    {stat.description}
                  </Text>
                </div>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        <Grid>
          {/* Active Hackathons */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder h="100%">
              <Card.Section p="md" withBorder>
                <Group justify="space-between">
                  <Title order={4}>Active Hackathons</Title>
                  <Anchor component={Link} to="/hackathons" size="sm">
                    View all
                  </Anchor>
                </Group>
              </Card.Section>
              <Card.Section p="md">
                <Stack gap="md">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} height={80} />
                    ))
                  ) : activeHackathons.length > 0 ? (
                    activeHackathons.slice(0, 3).map((hackathon) => (
                      <Paper key={hackathon.id} p="md" withBorder>
                        <Group justify="space-between" mb="sm">
                          <div style={{ flex: 1 }}>
                            <Group>
                              <Title order={5}>{hackathon.title}</Title>
                              <Badge
                                color={getStatusColor(hackathon.status)}
                                variant="light"
                              >
                                {hackathon.status}
                              </Badge>
                            </Group>
                            <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
                              {hackathon.description}
                            </Text>
                          </div>
                        </Group>
                        <Group>
                          <Group gap="xs">
                            <IconUsers size={16} />
                            <Text size="sm">
                              {hackathon.currentParticipants} participants
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <IconCalendar size={16} />
                            <Text size="sm">
                              Ends {new Date(hackathon.endDate).toLocaleDateString()}
                            </Text>
                          </Group>
                          <Button
                            component={Link}
                            to={`/hackathons/${hackathon.id}`}
                            variant="light"
                            size="xs"
                          >
                            View Details
                          </Button>
                        </Group>
                      </Paper>
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" py="xl">
                      No active hackathons at the moment
                    </Text>
                  )}
                </Stack>
              </Card.Section>
            </Card>
          </Grid.Col>

          {/* Quick Stats & Actions */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack>
              {user && (
                <Card withBorder>
                  <Card.Section p="md" withBorder>
                    <Title order={4}>Quick Actions</Title>
                  </Card.Section>
                  <Card.Section p="md">
                    <Stack gap="sm">
                      <Button
                        component={Link}
                        to="/hackathons/create"
                        fullWidth
                        variant="light"
                        leftSection={<IconTrophy size={16} />}
                      >
                        Create Hackathon
                      </Button>
                      <Button
                        component={Link}
                        to="/teams"
                        fullWidth
                        variant="light"
                        leftSection={<IconUsers size={16} />}
                      >
                        Browse Teams
                      </Button>
                      <Button
                        component={Link}
                        to="/ideas"
                        fullWidth
                        variant="light"
                        leftSection={<IconBulb size={16} />}
                      >
                        Explore Ideas
                      </Button>
                      <Button
                        component={Link}
                        to="/projects"
                        fullWidth
                        variant="light"
                        leftSection={<IconTrophy size={16} />}
                      >
                        View Projects
                      </Button>
                    </Stack>
                  </Card.Section>
                </Card>
              )}

              {/* Top Ideas */}
              <Card withBorder>
                <Card.Section p="md" withBorder>
                  <Title order={4}>Top Ideas</Title>
                </Card.Section>
                <Card.Section p="md">
                  <Stack gap="sm">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={40} />
                      ))
                    ) : allIdeas.length > 0 ? (
                      allIdeas
                        .sort((a, b) => b.votes - a.votes)
                        .slice(0, 3)
                        .map((idea) => (
                          <Group key={idea.id} justify="space-between">
                            <div style={{ flex: 1 }}>
                              <Text size="sm" fw={500} lineClamp={1}>
                                {idea.title}
                              </Text>
                              <Group gap="xs">
                                <IconHeart size={13} />
                                <Text size="xs" c="dimmed">
                                  {idea.votes} votes
                                </Text>
                              </Group>
                            </div>
                          </Group>
                        ))
                    ) : (
                      <Text c="dimmed" ta="center" py="md" size="sm">
                        No ideas yet
                      </Text>
                    )}
                  </Stack>
                </Card.Section>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}
