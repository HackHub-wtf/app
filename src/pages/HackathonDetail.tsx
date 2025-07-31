import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Grid,
  Progress,
  Avatar,
  Tabs,
  Timeline,
  ActionIcon,
  Image,
  Paper,
  Divider,
  ThemeIcon,
  rem,
  Container,
  Alert,
} from '@mantine/core'
import {
  IconCalendar,
  IconUsers,
  IconTarget,
  IconTrophy,
  IconEdit,
  IconShare,
  IconBookmark,
  IconInfoCircle,
  IconChecks,
  IconClock,
  IconFlag,
  IconHeart,
} from '@tabler/icons-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { useRealtime } from '../contexts/RealtimeContext'
import { TeamService, type TeamWithMembers } from '../services/teamService'
import { IdeaService, type IdeaWithDetails } from '../services/ideaService'
import { notifications } from '@mantine/notifications'

const mockHackathon = {
  id: '1',
  title: 'Winter AI Challenge 2024',
  description: 'Build innovative AI solutions for real-world problems. Focus on machine learning, natural language processing, and computer vision. This hackathon aims to push the boundaries of what\'s possible with artificial intelligence.',
  start_date: '2024-02-15T09:00:00',
  end_date: '2024-02-17T18:00:00',
  status: 'open' as const,
  max_team_size: 4,
  current_participants: 127,
  allowed_participants: 200,
  registration_key: 'AI2024',
  created_by: 'admin@hackathon.com',
  banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=800&q=80',
  tags: ['AI', 'Machine Learning', 'Innovation', 'Computer Vision'],
  prizes: ['$10,000 Grand Prize', '$5,000 Second Place', '$2,500 Third Place', '$1,000 Best Innovation'],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  rules: `
# Hackathon Rules & Guidelines

## Eligibility
- Open to all developers, designers, and innovators
- Teams can have 1-4 members
- All skill levels welcome

## Submission Requirements
- Working prototype or demo
- Source code repository (GitHub preferred)
- 3-minute pitch video
- Documentation explaining your solution

## Judging Criteria
- Innovation and creativity (30%)
- Technical implementation (25%)
- Impact and potential (25%)
- Presentation quality (20%)

## Timeline
- Registration: Until Feb 14, 11:59 PM
- Hacking Period: Feb 15-17
- Submissions Due: Feb 17, 6:00 PM
- Judging & Awards: Feb 17, 7:00-9:00 PM

## Code of Conduct
- Respect all participants
- No harassment or discrimination
- Original work only (external APIs/libraries allowed)
- Have fun and learn!
  `,
  timeline: [
    {
      title: 'Registration Opens',
      description: 'Start forming teams and registering',
      date: new Date('2024-01-15'),
      completed: true,
    },
    {
      title: 'Team Formation Deadline',
      description: 'Finalize your team composition',
      date: new Date('2024-02-10'),
      completed: true,
    },
    {
      title: 'Hackathon Kickoff',
      description: 'Opening ceremony and hacking begins',
      date: new Date('2024-02-15T09:00:00'),
      completed: false,
    },
    {
      title: 'Submission Deadline',
      description: 'All projects must be submitted',
      date: new Date('2024-02-17T18:00:00'),
      completed: false,
    },
    {
      title: 'Judging & Awards',
      description: 'Final presentations and winner announcement',
      date: new Date('2024-02-17T19:00:00'),
      completed: false,
    },
  ],
}

export function HackathonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hackathons } = useHackathonStore()
  const { isConnected, subscribeToTeamUpdates } = useRealtime()
  
  // Enhanced state management
  const [hackathon, setHackathon] = useState(mockHackathon)
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [ideas, setIdeas] = useState<IdeaWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  // Load hackathon data
  useEffect(() => {
    const loadHackathonData = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        // Try to get from store first, then API
        const foundHackathon = hackathons.find(h => h.id === id)
        if (foundHackathon) {
          setHackathon(foundHackathon as typeof mockHackathon)
        } else {
          // In real implementation: const hackathonData = await HackathonService.getHackathon(id)
          // setHackathon(hackathonData)
        }

        // Load related data
        const [teamsData, ideasData] = await Promise.all([
          TeamService.getTeams(id),
          user ? IdeaService.getIdeas(id, user.id) : Promise.resolve([])
        ])
        
        setTeams(teamsData)
        setIdeas(ideasData)
        
        // Check if user is already registered
        if (user) {
          // In real implementation: check registration status
          setIsRegistered(false)
        }
      } catch (error) {
        console.error('Error loading hackathon data:', error)
        notifications.show({
          title: 'Error',
          message: 'Failed to load hackathon details',
          color: 'red',
        })
      } finally {
        setLoading(false)
      }
    }

    loadHackathonData()
  }, [id, hackathons, user])

  // Set up real-time subscriptions
  useEffect(() => {
    if (isConnected && id) {
      subscribeToTeamUpdates(id)
      console.log('Real-time connected for hackathon:', id)
    }
  }, [isConnected, id, subscribeToTeamUpdates])

  // In a real app, this would fetch from API based on ID
  const currentHackathon = hackathons.find(h => h.id === id) || hackathon

  const isManager = user?.role === 'manager'
  const isCreator = currentHackathon.created_by === user?.id
  const canEdit = isManager && isCreator

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'blue'
      case 'running': return 'green'
      case 'completed': return 'gray'
      case 'draft': return 'yellow'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Registration Open'
      case 'running': return 'In Progress'
      case 'completed': return 'Completed'
      case 'draft': return 'Coming Soon'
      default: return status
    }
  }

  const handleRegister = async () => {
    if (!user || !id) return
    
    setRegistering(true)
    try {
      // In real implementation: await HackathonService.registerForHackathon(id, user.id)
      setIsRegistered(true)
      notifications.show({
        title: 'Registration Successful!',
        message: 'You have been registered for this hackathon. Check your email for further details.',
        color: 'green',
      })
    } catch (err) {
      console.error('Registration error:', err)
      notifications.show({
        title: 'Registration Failed',
        message: 'There was an error registering for this hackathon. Please try again.',
        color: 'red',
      })
    } finally {
      setRegistering(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    notifications.show({
      title: 'Link Copied!',
      message: 'Hackathon link has been copied to clipboard',
      color: 'blue',
    })
  }

  const progressPercentage = Math.min((currentHackathon.current_participants / currentHackathon.allowed_participants) * 100, 100)

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Header Section */}
        <Card withBorder radius="lg" p={0} style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ height: 300, backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text>Loading...</Text>
            </div>
          ) : (
            <Image
              src={currentHackathon.banner_url}
              alt={currentHackathon.title}
              height={300}
              fallbackSrc="https://via.placeholder.com/800x300?text=Hackathon+Banner"
            />
          )}
          
          <Stack gap="md" p="lg">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Group gap="sm" mb="xs">
                  <Badge color={getStatusColor(currentHackathon.status)} size="lg" variant="light">
                    {getStatusLabel(currentHackathon.status)}
                  </Badge>
                  {(currentHackathon.tags || []).slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                  {/* Real-time connection indicator */}
                  {user && (
                    <Group gap="xs" ml="auto">
                      <div 
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isConnected ? '#51cf66' : '#fa5252',
                        }}
                      />
                      <Text size="xs" c="dimmed">
                        {isConnected ? 'Live' : 'Offline'}
                      </Text>
                    </Group>
                  )}
                </Group>
                
                <Title order={1} mb="xs">
                  {currentHackathon.title}
                </Title>
                
                <Text size="lg" c="dimmed" mb="md">
                  {currentHackathon.description}
                </Text>

                <Group gap="lg">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm">
                      {new Date(currentHackathon.start_date).toLocaleDateString()} - {new Date(currentHackathon.end_date).toLocaleDateString()}
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <IconUsers size={16} />
                    <Text size="sm">
                      {currentHackathon.current_participants} / {currentHackathon.allowed_participants} participants
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <IconTarget size={16} />
                    <Text size="sm">
                      Max team size: {currentHackathon.max_team_size}
                    </Text>
                  </Group>
                </Group>
              </div>

              <Group gap="sm">
                <ActionIcon variant="light" size="md" onClick={handleShare}>
                  <IconShare size={16} />
                </ActionIcon>
                <ActionIcon variant="light" size="md">
                  <IconBookmark size={16} />
                </ActionIcon>
                {canEdit && (
                  <ActionIcon
                    variant="light"
                    size="lg"
                    color="blue"
                    onClick={() => navigate(`/hackathons/${id}/edit`)}
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                )}
              </Group>
            </Group>

            {/* Registration Progress */}
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Registration Progress</Text>
                <Text size="sm" c="dimmed">
                  {Math.round(progressPercentage)}% filled
                </Text>
              </Group>
              <Progress value={progressPercentage} size="lg" radius="xl" />
            </div>

            {/* Action Buttons */}
            <Group>
              {currentHackathon.status === 'open' && !isRegistered && (
                <Button
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  leftSection={<IconUsers size={18} />}
                  onClick={handleRegister}
                  loading={registering}
                  disabled={!user}
                >
                  {user ? 'Register Now' : 'Login to Register'}
                </Button>
              )}
              {isRegistered && (
                <Button
                  size="lg"
                  variant="light"
                  color="green"
                  leftSection={<IconChecks size={18} />}
                  disabled
                >
                  Registered ✓
                </Button>
              )}
              <Button 
                variant="light" 
                leftSection={<IconUsers size={16} />}
                onClick={() => navigate(`/teams?hackathon=${id}`)}
              >
                View Teams ({teams.length})
              </Button>
              <Button 
                variant="light" 
                leftSection={<IconTarget size={16} />}
                onClick={() => navigate(`/ideas?hackathon=${id}`)}
              >
                Browse Ideas ({ideas.length})
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="timeline" leftSection={<IconClock size={16} />}>
              Timeline
            </Tabs.Tab>
            <Tabs.Tab value="teams-ideas" leftSection={<IconUsers size={16} />}>
              Teams & Ideas
            </Tabs.Tab>
            <Tabs.Tab value="prizes" leftSection={<IconTrophy size={16} />}>
              Prizes
            </Tabs.Tab>
            <Tabs.Tab value="rules" leftSection={<IconChecks size={16} />}>
              Rules
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Card withBorder radius="md" p="lg">
                  <Title order={3} mb="md">About This Hackathon</Title>
                  <Text>{currentHackathon.description}</Text>
                  
                  <Divider my="md" />
                  
                  <Title order={4} mb="sm">Technologies & Categories</Title>
                  <Group gap="xs">
                    {(currentHackathon.tags || []).map((tag) => (
                      <Badge key={tag} variant="light" size="md">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap="md">
                  <Card withBorder radius="md" p="lg">
                    <Title order={4} mb="md">Quick Stats</Title>
                    <Stack gap="md">
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Duration</Text>
                          <Text size="sm" fw={500}>
                            {Math.ceil((new Date(currentHackathon.end_date).getTime() - new Date(currentHackathon.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                          </Text>
                        </Group>
                      </Paper>
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Participants</Text>
                          <Text size="sm" fw={500}>{currentHackathon.current_participants}</Text>
                        </Group>
                      </Paper>
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Teams Formed</Text>
                          <Text size="sm" fw={500}>{loading ? '...' : teams.length}</Text>
                        </Group>
                      </Paper>
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Ideas Submitted</Text>
                          <Text size="sm" fw={500}>{loading ? '...' : ideas.length}</Text>
                        </Group>
                      </Paper>
                    </Stack>
                  </Card>

                  <Card withBorder radius="md" p="lg">
                    <Title order={4} mb="md">Organizer</Title>
                    <Group gap="sm">
                      <Avatar size="md" radius="xl">
                        {currentHackathon.created_by.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text fw={500}>{currentHackathon.created_by}</Text>
                        <Text size="sm" c="dimmed">Event Organizer</Text>
                      </div>
                    </Group>
                  </Card>
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="teams-ideas" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" p="lg">
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Teams ({teams.length})</Title>
                    <Button 
                      variant="light" 
                      size="sm"
                      onClick={() => navigate(`/teams?hackathon=${id}`)}
                    >
                      View All
                    </Button>
                  </Group>
                  {loading ? (
                    <Stack gap="sm">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Paper key={i} p="md" withBorder>
                          <Group>
                            <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 8 }} />
                            <div>
                              <div style={{ width: 120, height: 16, backgroundColor: '#f0f0f0', marginBottom: 4 }} />
                              <div style={{ width: 80, height: 12, backgroundColor: '#f0f0f0' }} />
                            </div>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  ) : teams.length > 0 ? (
                    <Stack gap="sm">
                      {teams.slice(0, 5).map((team) => (
                        <Paper key={team.id} p="md" withBorder>
                          <Group justify="space-between">
                            <div>
                              <Text fw={500}>{team.name}</Text>
                              <Text size="sm" c="dimmed">
                                {team.team_members?.length || 0} / {currentHackathon.max_team_size} members
                              </Text>
                            </div>
                            <Badge variant="light" color="blue">
                              Open
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Text c="dimmed" ta="center" py="md">
                      No teams formed yet
                    </Text>
                  )}
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" p="lg">
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Ideas ({ideas.length})</Title>
                    <Button 
                      variant="light" 
                      size="sm"
                      onClick={() => navigate(`/ideas?hackathon=${id}`)}
                    >
                      View All
                    </Button>
                  </Group>
                  {loading ? (
                    <Stack gap="sm">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Paper key={i} p="md" withBorder>
                          <div style={{ width: '100%', height: 16, backgroundColor: '#f0f0f0', marginBottom: 8 }} />
                          <div style={{ width: '80%', height: 12, backgroundColor: '#f0f0f0' }} />
                        </Paper>
                      ))}
                    </Stack>
                  ) : ideas.length > 0 ? (
                    <Stack gap="sm">
                      {ideas.slice(0, 5).map((idea) => (
                        <Paper key={idea.id} p="md" withBorder>
                          <Group justify="space-between" mb="xs">
                            <Text fw={500} lineClamp={1}>{idea.title}</Text>
                            <Group gap="xs">
                              <IconHeart size={14} />
                              <Text size="sm">{idea.votes}</Text>
                            </Group>
                          </Group>
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {idea.description}
                          </Text>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Text c="dimmed" ta="center" py="md">
                      No ideas submitted yet
                    </Text>
                  )}
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="timeline" pt="lg">
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="lg">Event Timeline</Title>
              <Timeline active={2} bulletSize={24} lineWidth={2}>
                {mockHackathon.timeline.map((event, index) => (
                  <Timeline.Item
                    key={index}
                    bullet={<IconFlag size={12} />}
                    title={event.title}
                  >
                    <Text c="dimmed" size="sm">
                      {event.description}
                    </Text>
                    <Text size="xs" mt={4}>
                      {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="prizes" pt="lg">
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="lg">Prizes & Rewards</Title>
              <Grid>
                {(currentHackathon.prizes || []).map((prize, index) => (
                  <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
                    <Paper p="lg" withBorder radius="md" ta="center">
                      <ThemeIcon
                        size={50}
                        variant="light"
                        color={index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}
                        mb="md"
                        mx="auto"
                      >
                        <IconTrophy style={{ width: rem(24), height: rem(24) }} />
                      </ThemeIcon>
                      <Text fw={600} size="lg">
                        {index === 0 ? '1st Place' : index === 1 ? '2nd Place' : index === 2 ? '3rd Place' : 'Special Award'}
                      </Text>
                      <Text size="xl" fw={700} c="blue" mt="xs">
                        {prize}
                      </Text>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="rules" pt="lg">
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="lg">Rules & Guidelines</Title>
              <Alert
                icon={<IconInfoCircle size={16} />}
                title="Important Notice"
                color="blue"
                mb="lg"
              >
                Please read all rules carefully before participating. Violations may result in disqualification.
              </Alert>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                <Text>{currentHackathon.rules}</Text>
              </div>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}
