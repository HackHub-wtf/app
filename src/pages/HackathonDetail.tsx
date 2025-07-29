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
} from '@tabler/icons-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
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

  // In a real app, this would fetch from API based on ID
  const hackathon = hackathons.find(h => h.id === id) || mockHackathon

  const isManager = user?.role === 'manager'
  const isCreator = hackathon.created_by === user?.id
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

  const handleRegister = () => {
    notifications.show({
      title: 'Registration Successful!',
      message: 'You have been registered for this hackathon. Check your email for further details.',
      color: 'green',
    })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    notifications.show({
      title: 'Link Copied!',
      message: 'Hackathon link has been copied to clipboard',
      color: 'blue',
    })
  }

  const progressPercentage = Math.min((hackathon.current_participants / hackathon.allowed_participants) * 100, 100)

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Header Section */}
        <Card withBorder radius="lg" p={0} style={{ overflow: 'hidden' }}>
          <Image
            src={hackathon.banner_url}
            alt={hackathon.title}
            height={300}
            fallbackSrc="https://via.placeholder.com/800x300?text=Hackathon+Banner"
          />
          
          <Stack gap="md" p="lg">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Group gap="sm" mb="xs">
                  <Badge color={getStatusColor(hackathon.status)} size="lg" variant="light">
                    {getStatusLabel(hackathon.status)}
                  </Badge>
                  {(hackathon.tags || []).slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </Group>
                
                <Title order={1} mb="xs">
                  {hackathon.title}
                </Title>
                
                <Text size="lg" c="dimmed" mb="md">
                  {hackathon.description}
                </Text>

                <Group gap="lg">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm">
                      {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <IconUsers size={16} />
                    <Text size="sm">
                      {hackathon.current_participants} / {hackathon.allowed_participants} participants
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <IconTarget size={16} />
                    <Text size="sm">
                      Max team size: {hackathon.max_team_size}
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
              {hackathon.status === 'open' && (
                <Button
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  leftSection={<IconUsers size={18} />}
                  onClick={handleRegister}
                >
                  Register Now
                </Button>
              )}
              <Button variant="light" leftSection={<IconUsers size={16} />}>
                View Teams
              </Button>
              <Button variant="light" leftSection={<IconTarget size={16} />}>
                Browse Ideas
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
                  <Text>{hackathon.description}</Text>
                  
                  <Divider my="md" />
                  
                  <Title order={4} mb="sm">Technologies & Categories</Title>
                  <Group gap="xs">
                    {(hackathon.tags || []).map((tag) => (
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
                          <Text size="sm" fw={500}>3 days</Text>
                        </Group>
                      </Paper>
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Participants</Text>
                          <Text size="sm" fw={500}>{hackathon.current_participants}</Text>
                        </Group>
                      </Paper>
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Teams Formed</Text>
                          <Text size="sm" fw={500}>32</Text>
                        </Group>
                      </Paper>
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Ideas Submitted</Text>
                          <Text size="sm" fw={500}>18</Text>
                        </Group>
                      </Paper>
                    </Stack>
                  </Card>

                  <Card withBorder radius="md" p="lg">
                    <Title order={4} mb="md">Organizer</Title>
                    <Group gap="sm">
                      <Avatar size="md" radius="xl">
                        {hackathon.created_by.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text fw={500}>{hackathon.created_by}</Text>
                        <Text size="sm" c="dimmed">Event Organizer</Text>
                      </div>
                    </Group>
                  </Card>
                </Stack>
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
                {(hackathon.prizes || []).map((prize, index) => (
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
                <Text>{hackathon.rules}</Text>
              </div>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}
