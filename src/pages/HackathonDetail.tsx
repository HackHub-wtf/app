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
  ActionIcon,
  Image,
  Paper,
  Divider,
  ThemeIcon,
  rem,
  Container,
  Alert,
  Modal,
  TextInput,
  Center,
  Skeleton,
  SimpleGrid,
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
  IconClock,
  IconFlag,
  IconHeart,
  IconEye,
  IconBulb,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { useDisclosure } from '@mantine/hooks'
import { HackathonService } from '../services/hackathonService'
import { TeamService, type TeamWithMembers } from '../services/teamService'
import { IdeaService, type IdeaWithDetails } from '../services/ideaService'
import { notifications } from '@mantine/notifications'

export default function HackathonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isManager = user?.role === 'manager'
  const { currentHackathon, fetchHackathon, joinHackathon, setCurrentHackathon } = useHackathonStore()
  
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [ideas, setIdeas] = useState<IdeaWithDetails[]>([])
  const [participants, setParticipants] = useState<{
    user_id: string
    role: string
    joined_at: string
    teams: {
      hackathon_id: string
      name: string
    }[]
    profiles: {
      id: string
      name: string
      email: string
      avatar_url?: string
    }[]
  }[]>([])
  const [isParticipant, setIsParticipant] = useState(false)
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalIdeas: 0,
    totalParticipants: 0,
  })
  
  const [joinModalOpened, { open: openJoinModal, close: closeJoinModal }] = useDisclosure(false)
  const [registrationKey, setRegistrationKey] = useState('')
  const [joiningHackathon, setJoiningHackathon] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const loadHackathonData = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    try {
      // Fetch hackathon details
      await fetchHackathon(id)
      
      // Fetch related data in parallel
      const [teamsData, ideasData, participantsData] = await Promise.all([
        TeamService.getTeams(id),
        IdeaService.getIdeas(id),
        HackathonService.getHackathonParticipants(id),
      ])
      
      setTeams(teamsData)
      setIdeas(ideasData)
      setParticipants(participantsData)
      
      setStats({
        totalTeams: teamsData.length,
        totalIdeas: ideasData.length,
        totalParticipants: participantsData.length,
      })
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
  }, [id, fetchHackathon])

  const checkParticipantStatus = useCallback(async () => {
    if (!currentHackathon || !user) return
    
    try {
      const isUserParticipant = await HackathonService.isUserParticipant(currentHackathon.id, user.id)
      setIsParticipant(isUserParticipant)
    } catch (error) {
      console.error('Error checking participant status:', error)
    }
  }, [currentHackathon, user])

  useEffect(() => {
    if (id) {
      loadHackathonData()
    }
    return () => {
      setCurrentHackathon(null)
    }
  }, [id, loadHackathonData, setCurrentHackathon])

  useEffect(() => {
    if (currentHackathon && user) {
      checkParticipantStatus()
    }
  }, [currentHackathon, user, checkParticipantStatus])

  const handleJoinHackathon = async () => {
    if (!registrationKey.trim() || !user || !currentHackathon) return
    
    setJoiningHackathon(true)
    setJoinError(null)
    
    try {
      await joinHackathon(registrationKey.trim())
      closeJoinModal()
      setRegistrationKey('')
      
      // Refresh data
      await loadHackathonData()
      
      notifications.show({
        title: 'Success',
        message: 'Welcome to the hackathon!',
        color: 'green',
      })
    } catch (error) {
      setJoinError((error as Error).message || 'Failed to join hackathon')
    } finally {
      setJoiningHackathon(false)
    }
  }

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

  const getDaysRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysUntilStart = (startDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const diffTime = start.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const canJoinHackathon = () => {
    if (!user || !currentHackathon) return false
    if (currentHackathon.status !== 'open') return false
    if (currentHackathon.current_participants >= currentHackathon.allowed_participants) return false
    if (isParticipant) return false
    return true
  }

  const getProgress = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    notifications.show({
      title: 'Link Copied!',
      message: 'Hackathon link has been copied to clipboard',
      color: 'blue',
    })
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Skeleton height={40} width={300} />
            <Skeleton height={36} width={120} />
          </Group>
          <Skeleton height={200} />
          <SimpleGrid cols={3}>
            <Skeleton height={120} />
            <Skeleton height={120} />
            <Skeleton height={120} />
          </SimpleGrid>
          <Skeleton height={400} />
        </Stack>
      </Container>
    )
  }

  if (!currentHackathon) {
    return (
      <Container size="xl" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <ThemeIcon size={80} variant="light" color="red">
              <IconAlertCircle style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Text ta="center" size="lg" fw={500}>
              Hackathon not found
            </Text>
            <Text ta="center" c="dimmed">
              The hackathon you're looking for doesn't exist or has been removed.
            </Text>
            <Button onClick={() => navigate('/hackathons')}>
              Back to Hackathons
            </Button>
          </Stack>
        </Center>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header Section */}
        <Card withBorder radius="lg" p={0} style={{ overflow: 'hidden' }}>
          <Image
            src={currentHackathon.banner_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=800&q=80'}
            alt={currentHackathon.title}
            height={300}
            fallbackSrc="https://via.placeholder.com/800x300?text=Hackathon+Banner"
          />
          
          <Stack gap="md" p="lg">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Group gap="sm" mb="xs">
                  <Badge color={getStatusColor(currentHackathon.status)} size="lg" variant="light">
                    {getStatusLabel(currentHackathon.status)}
                  </Badge>
                  {currentHackathon.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
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
                {isManager && currentHackathon.created_by === user?.id && (
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
                  {Math.round(getProgress(currentHackathon.current_participants, currentHackathon.allowed_participants))}% filled
                </Text>
              </Group>
              <Progress 
                value={getProgress(currentHackathon.current_participants, currentHackathon.allowed_participants)} 
                size="lg" 
                radius="xl" 
                color={currentHackathon.current_participants >= currentHackathon.allowed_participants ? 'red' : 'blue'}
              />
            </div>

            {/* Action Buttons */}
            <Group>
              {canJoinHackathon() && (
                <Button
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  leftSection={<IconUsers size={18} />}
                  onClick={openJoinModal}
                >
                  Join Hackathon
                </Button>
              )}
              {isParticipant && (
                <Button
                  size="lg"
                  variant="light"
                  color="green"
                  leftSection={<IconCheck size={18} />}
                  disabled
                >
                  Joined ✓
                </Button>
              )}
              <Button 
                variant="light" 
                leftSection={<IconUsers size={16} />}
                onClick={() => navigate(`/teams?hackathon=${id}`)}
              >
                View Teams ({stats.totalTeams})
              </Button>
              <Button 
                variant="light" 
                leftSection={<IconBulb size={16} />}
                onClick={() => navigate(`/ideas?hackathon=${id}`)}
              >
                Browse Ideas ({stats.totalIdeas})
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
            <Tabs.Tab value="teams" leftSection={<IconUsers size={16} />}>
              Teams ({stats.totalTeams})
            </Tabs.Tab>
            <Tabs.Tab value="ideas" leftSection={<IconBulb size={16} />}>
              Ideas ({stats.totalIdeas})
            </Tabs.Tab>
            <Tabs.Tab value="participants" leftSection={<IconUsers size={16} />}>
              Participants ({stats.totalParticipants})
            </Tabs.Tab>
            <Tabs.Tab value="prizes" leftSection={<IconTrophy size={16} />}>
              Prizes
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
                    {currentHackathon.tags?.map((tag) => (
                      <Badge key={tag} variant="light" size="md">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                  
                  {currentHackathon.rules && (
                    <>
                      <Divider my="md" />
                      <Title order={4} mb="sm">Rules & Guidelines</Title>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {currentHackathon.rules}
                      </Text>
                    </>
                  )}
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
                          <Text size="sm" c="dimmed">Teams</Text>
                          <Text size="sm" fw={500}>{stats.totalTeams}</Text>
                        </Group>
                      </Paper>
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Ideas</Text>
                          <Text size="sm" fw={500}>{stats.totalIdeas}</Text>
                        </Group>
                      </Paper>
                    </Stack>
                  </Card>

                  {currentHackathon.status === 'open' && getDaysUntilStart(currentHackathon.start_date) > 0 && (
                    <Alert icon={<IconClock size={16} />} color="blue">
                      <Text size="sm" fw={500}>Starts in {getDaysUntilStart(currentHackathon.start_date)} days</Text>
                    </Alert>
                  )}

                  {currentHackathon.status === 'running' && getDaysRemaining(currentHackathon.end_date) > 0 && (
                    <Alert icon={<IconFlag size={16} />} color="green">
                      <Text size="sm" fw={500}>{getDaysRemaining(currentHackathon.end_date)} days remaining</Text>
                    </Alert>
                  )}
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="teams" pt="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {teams.map((team) => (
                <Card key={team.id} withBorder radius="md" p="md">
                  <Group justify="space-between" mb="xs">
                    <Text fw={600}>{team.name}</Text>
                    <Badge size="sm" variant="light">
                      {team.team_members.length}/{currentHackathon.max_team_size}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                    {team.description}
                  </Text>
                  <Group gap="xs" mb="sm">
                    {team.team_members.slice(0, 3).map((member) => (
                      <Avatar key={member.user_id} size="sm" radius="xl">
                        {member.profiles?.name?.charAt(0) || 'M'}
                      </Avatar>
                    ))}
                    {team.team_members.length > 3 && (
                      <Text size="xs" c="dimmed">+{team.team_members.length - 3}</Text>
                    )}
                  </Group>
                  <Button variant="light" size="xs" fullWidth onClick={() => navigate(`/teams/${team.id}`)}>
                    View Team
                  </Button>
                </Card>
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="ideas" pt="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {ideas.map((idea) => (
                <Card key={idea.id} withBorder radius="md" p="md">
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} lineClamp={1}>{idea.title}</Text>
                    <Badge size="sm" variant="light" color={idea.status === 'completed' ? 'green' : 'blue'}>
                      {idea.status}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed" lineClamp={3} mb="sm">
                    {idea.description}
                  </Text>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconHeart size={14} />
                      <Text size="xs">{idea.votes}</Text>
                    </Group>
                    <Button variant="light" size="xs" onClick={() => navigate(`/ideas/${idea.id}`)}>
                      <IconEye size={12} />
                    </Button>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="participants" pt="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
              {participants.map((participant) => (
                <Card key={participant.user_id} withBorder radius="md" p="md">
                  <Group>
                    <Avatar size="md" radius="xl" src={participant.profiles[0]?.avatar_url}>
                      {participant.profiles[0]?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <div>
                      <Text fw={500}>{participant.profiles[0]?.name || 'Anonymous'}</Text>
                      <Text size="xs" c="dimmed">
                        Team: {participant.teams[0]?.name || 'Unknown'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Joined {new Date(participant.joined_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="prizes" pt="lg">
            <SimpleGrid cols={{ base: 1, md: 2 }}>
              {currentHackathon.prizes?.map((prize, index) => (
                <Card key={index} withBorder radius="md" p="lg">
                  <Group gap="sm" mb="sm">
                    <ThemeIcon size="lg" variant="light" color="yellow">
                      <IconTrophy size={24} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>Prize #{index + 1}</Text>
                      <Text size="sm" c="dimmed">Rank {index + 1}</Text>
                    </div>
                  </Group>
                  <Text fw={500} size="lg" c="yellow">
                    {prize}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>

        {/* Join Hackathon Modal */}
        <Modal opened={joinModalOpened} onClose={closeJoinModal} title="Join Hackathon">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Enter the registration key for "{currentHackathon.title}" to join this hackathon.
            </Text>
            
            {joinError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                {joinError}
              </Alert>
            )}
            
            <TextInput
              label="Registration Key"
              placeholder="Enter hackathon registration key"
              value={registrationKey}
              onChange={(e) => setRegistrationKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinHackathon()}
              disabled={joiningHackathon}
            />
            
            <Group justify="flex-end">
              <Button variant="light" onClick={closeJoinModal} disabled={joiningHackathon}>
                Cancel
              </Button>
              <Button 
                onClick={handleJoinHackathon} 
                loading={joiningHackathon}
                disabled={!registrationKey.trim()}
              >
                Join Hackathon
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}