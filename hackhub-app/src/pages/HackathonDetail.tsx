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
  SegmentedControl,
  Slider,
  Textarea,
  Select,
  Box,
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
  IconAlertCircle,
  IconCheck,
  IconStar,
  IconGavel,
  IconPresentation,
  IconBrandGithub,
  IconVideo,
  IconLink,
  IconTrash,
  IconPlus,
  IconWorld,
  IconUserCheck,
} from '@tabler/icons-react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { useDisclosure } from '@mantine/hooks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TeamService } from '../services/teamService'
import type { TeamWithMembers } from '../services/teamService'
import { IdeaService } from '../services/ideaService'
import type { Idea } from '../services/ideaService'
import { JudgingService } from '../services/judgingService'
import type { Attachment, AttachmentType } from '../services/judgingService'
import { HackathonService } from '../services/hackathonService'
import type { JudgingMode, HackathonVisibility, HackathonJoinPolicy } from '../services/hackathonService'
import { OrganizationService } from '../services/organizationService'
import { notifications } from '@mantine/notifications'
import { VotingCriteriaManager } from '../components/VotingCriteriaManager'
import { Leaderboard } from './Leaderboard'

export default function HackathonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') ?? 'overview'
  const { user } = useAuthStore()
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  const queryClient = useQueryClient()
  const { currentHackathon, fetchHackathon, joinHackathon, setCurrentHackathon } = useHackathonStore()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [isParticipant, setIsParticipant] = useState(false)
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalIdeas: 0,
    totalParticipants: 0,
  })

  // Judging config state
  const [pendingJudgingMode, setPendingJudgingMode] = useState<JudgingMode | null>(null)
  const [pendingPanelWeight, setPendingPanelWeight] = useState<number | null>(null)
  const [pendingVisibility, setPendingVisibility] = useState<HackathonVisibility | null>(null)
  const [pendingJoinPolicy, setPendingJoinPolicy] = useState<HackathonJoinPolicy | null>(null)

  // Final submission state
  const [submissionTitle, setSubmissionTitle] = useState('')
  const [submissionDesc, setSubmissionDesc] = useState('')
  const [submissionIdeaId, setSubmissionIdeaId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newAttachType, setNewAttachType] = useState<AttachmentType>('url')
  const [newAttachUrl, setNewAttachUrl] = useState('')

  const [joinModalOpened, { open: openJoinModal, close: closeJoinModal }] = useDisclosure(false)
  const [registrationKey, setRegistrationKey] = useState('')
  const [joiningHackathon, setJoiningHackathon] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const loadHackathonData = useCallback(async () => {
    if (!id) return

    setLoading(true)
    try {
      await fetchHackathon(id)

      const [teamsData, ideasPage] = await Promise.all([
        TeamService.getTeams(id),
        IdeaService.getIdeas(id),
      ])

      // Enrich teams with member data — single-team endpoint doesn't include members
      const teamsWithMembers: TeamWithMembers[] = await Promise.all(
        teamsData.map(async (t) => {
          const members = await TeamService.getTeamMembers(t.id).catch(() => [])
          return { ...t, members }
        })
      )
      setTeams(teamsWithMembers)
      setIdeas(ideasPage.content)

      setStats({
        totalTeams: teamsData.length,
        totalIdeas: ideasPage.totalElements,
        totalParticipants: 0,
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
    // Participation check is server-enforced — stub as false for now
    setIsParticipant(false)
  }, [])

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

  // Organization query
  const { data: hackathonOrg } = useQuery({
    queryKey: ['organization', currentHackathon?.organizationId],
    queryFn: () => OrganizationService.getOrganization(currentHackathon!.organizationId!),
    enabled: !!currentHackathon?.organizationId,
    staleTime: 5 * 60 * 1000,
  })

  // Judges query — fetch for all authenticated users so we can determine if current user is an assigned judge
  const { data: judges } = useQuery({
    queryKey: ['hackathon-judges', id],
    queryFn: () => JudgingService.getJudges(id!),
    enabled: !!id && !!user,
    staleTime: 60 * 1000,
  })

  const isAssignedJudge = !isManager && (judges ?? []).some((j) => j.userId === user?.id)
  const canSeeJudgeTab = isManager || isAssignedJudge

  // My final submission
  const { data: mySubmission, refetch: refetchSubmission } = useQuery({
    queryKey: ['my-submission', id],
    queryFn: () => JudgingService.getMySubmission(id!),
    enabled: !!id && !!user,
    staleTime: 60 * 1000,
  })

  const updateJudgingConfigMutation = useMutation({
    mutationFn: (config: Parameters<typeof HackathonService.updateJudgingConfig>[1]) =>
      HackathonService.updateJudgingConfig(id!, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', id] })
      loadHackathonData()
      notifications.show({ title: 'Config saved', message: 'Judging configuration updated.', color: 'green' })
      setPendingJudgingMode(null)
      setPendingPanelWeight(null)
      setPendingVisibility(null)
      setPendingJoinPolicy(null)
    },
    onError: (err: Error) => notifications.show({ title: 'Error', message: err.message, color: 'red' }),
  })

  const removeJudgeMutation = useMutation({
    mutationFn: (userId: string) => JudgingService.removeJudge(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathon-judges', id] })
      notifications.show({ title: 'Judge removed', message: 'Judge removed from this hackathon.', color: 'green' })
    },
    onError: (err: Error) => notifications.show({ title: 'Error', message: err.message, color: 'red' }),
  })

  const submitFinalMutation = useMutation({
    mutationFn: () =>
      JudgingService.submitFinal(id!, {
        title: submissionTitle,
        description: submissionDesc || undefined,
        attachments,
        ideaId: submissionIdeaId || undefined,
      }),
    onSuccess: () => {
      refetchSubmission()
      notifications.show({ title: 'Submitted!', message: 'Final submission saved.', color: 'green' })
    },
    onError: (err: Error) => notifications.show({ title: 'Error', message: err.message, color: 'red' }),
  })

  const addAttachment = () => {
    if (!newAttachUrl.trim()) return
    setAttachments((prev) => [...prev, { type: newAttachType, url: newAttachUrl.trim() }])
    setNewAttachUrl('')
  }

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const attachmentIcon = (type: AttachmentType) => {
    switch (type) {
      case 'github': case 'bitbucket': return <IconBrandGithub size={14} />
      case 'youtube': case 'video': return <IconVideo size={14} />
      default: return <IconLink size={14} />
    }
  }

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
    if (currentHackathon.currentParticipants >= currentHackathon.allowedParticipants) return false
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
          {currentHackathon.bannerUrl ? (
            <Image
              src={currentHackathon.bannerUrl}
              alt={currentHackathon.title}
              height={300}
              fallbackSrc={undefined}
            />
          ) : (
            <Box
              h={300}
              style={{
                background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-violet-6))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Title order={2} c="white" ta="center" px="md">
                {currentHackathon.title}
              </Title>
            </Box>
          )}
          
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

                {hackathonOrg && (
                  <Group gap="xs" mb="xs">
                    <IconUsers size={14} color="var(--mantine-color-dimmed)" />
                    <Text
                      size="sm"
                      c="blue"
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => navigate(`/organizations/${hackathonOrg.id}`)}
                    >
                      {hackathonOrg.name}
                    </Text>
                  </Group>
                )}

                <Text size="lg" c="dimmed" mb="md">
                  {currentHackathon.description}
                </Text>

                <Group gap="lg">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm">
                      {new Date(currentHackathon.startDate).toLocaleDateString()} - {new Date(currentHackathon.endDate).toLocaleDateString()}
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <IconUsers size={16} />
                    <Text size="sm">
                      {currentHackathon.currentParticipants} / {currentHackathon.allowedParticipants} participants
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <IconTarget size={16} />
                    <Text size="sm">
                      Max team size: {currentHackathon.maxTeamSize}
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
                {isManager && currentHackathon.createdBy === user?.id && (
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
                  {Math.round(getProgress(currentHackathon.currentParticipants, currentHackathon.allowedParticipants))}% filled
                </Text>
              </Group>
              <Progress 
                value={getProgress(currentHackathon.currentParticipants, currentHackathon.allowedParticipants)} 
                size="lg" 
                radius="xl" 
                color={currentHackathon.currentParticipants >= currentHackathon.allowedParticipants ? 'red' : 'blue'}
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
              {isManager && (
                <Button
                  size="lg"
                  variant="light"
                  color="indigo"
                  leftSection={<IconStar size={18} />}
                  onClick={() => navigate(`/hackathons/${id}/judge`)}
                >
                  Judge this Hackathon
                </Button>
              )}
              <Button
                variant="light"
                leftSection={<IconUsers size={16} />}
                onClick={() => navigate(hackathonOrg ? `/organizations/${hackathonOrg.id}/hackathons/${id}/teams` : `/hackathons/${id}/teams`)}
              >
                View Teams ({stats.totalTeams})
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue={initialTab} variant="outline">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="teams" leftSection={<IconUsers size={16} />}>
              Teams ({stats.totalTeams})
            </Tabs.Tab>
            <Tabs.Tab value="participants" leftSection={<IconUsers size={16} />}>
              Participants ({stats.totalParticipants})
            </Tabs.Tab>
            <Tabs.Tab value="prizes" leftSection={<IconTrophy size={16} />}>
              Prizes
            </Tabs.Tab>
            <Tabs.Tab value="leaderboard" leftSection={<IconTrophy size={16} />}>
              Leaderboard
            </Tabs.Tab>
            <Tabs.Tab value="submit" leftSection={<IconPresentation size={16} />}>
              Submit
            </Tabs.Tab>
            {canSeeJudgeTab && (
              <Tabs.Tab value="judge" leftSection={<IconStar size={16} />}>
                Judge
              </Tabs.Tab>
            )}
            {isManager && (
              <Tabs.Tab value="judging-config" leftSection={<IconGavel size={16} />}>
                Config
              </Tabs.Tab>
            )}
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
                            {Math.ceil((new Date(currentHackathon.endDate).getTime() - new Date(currentHackathon.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </Text>
                        </Group>
                      </Paper>
                      <Paper p="sm" withBorder radius="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Participants</Text>
                          <Text size="sm" fw={500}>{currentHackathon.currentParticipants}</Text>
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

                  {currentHackathon.status === 'open' && getDaysUntilStart(currentHackathon.startDate) > 0 && (
                    <Alert icon={<IconClock size={16} />} color="blue">
                      <Text size="sm" fw={500}>Starts in {getDaysUntilStart(currentHackathon.startDate)} days</Text>
                    </Alert>
                  )}

                  {currentHackathon.status === 'running' && getDaysRemaining(currentHackathon.endDate) > 0 && (
                    <Alert icon={<IconFlag size={16} />} color="green">
                      <Text size="sm" fw={500}>{getDaysRemaining(currentHackathon.endDate)} days remaining</Text>
                    </Alert>
                  )}
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="teams" pt="lg">
            {teams.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <ThemeIcon size={48} variant="light" color="blue" radius="xl">
                    <IconUsers size={24} />
                  </ThemeIcon>
                  <Text fw={500}>No teams yet</Text>
                  <Text size="sm" c="dimmed">Be the first to form a team for this hackathon.</Text>
                  <Button variant="light" onClick={() => navigate(hackathonOrg ? `/organizations/${hackathonOrg.id}/hackathons/${id}/teams` : `/hackathons/${id}/teams`)}>
                    Create a Team
                  </Button>
                </Stack>
              </Center>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {teams.map((team) => (
                  <Card key={team.id} withBorder radius="md" p="md">
                    <Group justify="space-between" mb="xs">
                      <Text fw={600}>{team.name}</Text>
                      <Badge size="sm" variant="light">
                        {team.members.length}/{currentHackathon.maxTeamSize}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                      {team.description}
                    </Text>
                    <Group gap="xs" mb="sm">
                      {team.members.slice(0, 3).map((member) => (
                        <Avatar key={member.id} size="sm" radius="xl">
                          {member.userId.substring(0, 1).toUpperCase()}
                        </Avatar>
                      ))}
                      {team.members.length > 3 && (
                        <Text size="xs" c="dimmed">+{team.members.length - 3}</Text>
                      )}
                    </Group>
                    <Button variant="light" size="xs" fullWidth onClick={() => navigate(`/teams/${team.id}`)}>
                      View Team
                    </Button>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="participants" pt="lg">
            <Text c="dimmed" ta="center" py="xl">
              Participant list is not available in this version.
            </Text>
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

          <Tabs.Panel value="leaderboard" pt="lg">
            <Leaderboard hackathonId={id} />
          </Tabs.Panel>

          {canSeeJudgeTab && (
            <Tabs.Panel value="judge" pt="lg">
              <Stack gap="lg">
                <VotingCriteriaManager hackathonId={id!} isManager={isManager} />

                {/* Judges list */}
                <Card withBorder radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={600}>Panel Judges</Text>
                      <Badge variant="light">{(judges ?? []).length} judges</Badge>
                    </Group>
                    {(judges ?? []).length === 0 ? (
                      <Text size="sm" c="dimmed">No judges assigned yet.</Text>
                    ) : (
                      <Stack gap="xs">
                        {(judges ?? []).map((j) => (
                          <Group key={j.id} justify="space-between">
                            <Group gap="sm">
                              <Avatar size="sm" color="indigo">{j.name?.charAt(0) ?? '?'}</Avatar>
                              <div>
                                <Text size="sm" fw={500}>{j.name ?? j.userId}</Text>
                                <Text size="xs" c="dimmed">{j.email}</Text>
                              </div>
                            </Group>
                            {isManager && (
                              <ActionIcon variant="subtle" color="red" size="sm"
                                onClick={() => removeJudgeMutation.mutate(j.userId)}>
                                <IconTrash size={14} />
                              </ActionIcon>
                            )}
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Card>

                <Group>
                  <Button leftSection={<IconStar size={16} />} color="indigo"
                    onClick={() => navigate(`/hackathons/${id}/judge`)}>
                    Open Full Judging Panel
                  </Button>
                  <Button variant="light" leftSection={<IconTrophy size={16} />}
                    onClick={() => navigate(`/hackathons/${id}/leaderboard`)}>
                    View Leaderboard
                  </Button>
                </Group>
              </Stack>
            </Tabs.Panel>
          )}

          {/* Final Submission Tab */}
          <Tabs.Panel value="submit" pt="lg">
            {(() => {
              const userTeam = teams.find((t) =>
                t.members.some((m) => m.userId === user?.id)
              )
              if (!userTeam) {
                return (
                  <Center py="xl">
                    <Stack align="center" gap="md" maw={440}>
                      <ThemeIcon size={64} variant="light" color="gray" radius="xl">
                        <IconPresentation style={{ width: rem(32), height: rem(32) }} />
                      </ThemeIcon>
                      <Text fw={600} size="lg">No team yet</Text>
                      <Text c="dimmed" ta="center" size="sm">
                        You need to join or create a team before you can submit a final project.
                      </Text>
                      <Group>
                        <Button
                          variant="light"
                          leftSection={<IconUsers size={16} />}
                          onClick={() => navigate(hackathonOrg
                            ? `/organizations/${hackathonOrg.id}/hackathons/${id}/teams`
                            : `/hackathons/${id}/teams`)}
                        >
                          Browse Teams
                        </Button>
                        <Button
                          leftSection={<IconPlus size={16} />}
                          onClick={() => navigate(hackathonOrg
                            ? `/organizations/${hackathonOrg.id}/hackathons/${id}/teams`
                            : `/hackathons/${id}/teams`)}
                        >
                          Create Team
                        </Button>
                      </Group>
                    </Stack>
                  </Center>
                )
              }
              return null
            })()}
            <Stack gap="md" maw={600} style={{ display: teams.find((t) => t.members.some((m) => m.userId === user?.id)) ? undefined : 'none' }}>
              {mySubmission ? (
                <Card withBorder radius="md">
                  <Stack gap="sm">
                    <Group gap="xs">
                      <IconCheck size={16} color="green" />
                      <Text fw={600} c="green">Submission received</Text>
                    </Group>
                    <Text fw={500}>{mySubmission.title}</Text>
                    {mySubmission.description && <Text size="sm" c="dimmed">{mySubmission.description}</Text>}
                    {mySubmission.attachments.length > 0 && (
                      <Stack gap="xs">
                        <Text size="xs" fw={500} c="dimmed">ATTACHMENTS</Text>
                        {mySubmission.attachments.map((a, i) => (
                          <Group key={i} gap="xs">
                            {attachmentIcon(a.type)}
                            <Text size="sm" component="a" href={a.url} target="_blank" rel="noopener noreferrer"
                              style={{ textDecoration: 'underline' }}>
                              {a.filename ?? a.url}
                            </Text>
                            <Badge size="xs" variant="outline">{a.type}</Badge>
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Card>
              ) : (
                <Text size="sm" c="dimmed">No submission yet.</Text>
              )}

              <Card withBorder radius="md">
                <Stack gap="md">
                  <Text fw={600}>{mySubmission ? 'Update Submission' : 'Submit Final Project'}</Text>
                  <TextInput label="Title" placeholder="Project title" required
                    value={submissionTitle} onChange={(e) => setSubmissionTitle(e.target.value)} />
                  <Textarea label="Description" placeholder="Brief description"
                    value={submissionDesc} onChange={(e) => setSubmissionDesc(e.target.value)} />
                  <Select
                    label="Link to Idea (optional)"
                    placeholder="Select an idea"
                    clearable
                    data={ideas.map((i) => ({ value: i.id, label: i.title }))}
                    value={submissionIdeaId}
                    onChange={setSubmissionIdeaId}
                  />

                  {/* Attachments */}
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Attachments</Text>
                    {attachments.map((a, i) => (
                      <Group key={i} gap="xs">
                        {attachmentIcon(a.type)}
                        <Text size="sm" style={{ flex: 1 }} truncate>{a.url}</Text>
                        <Badge size="xs" variant="outline">{a.type}</Badge>
                        <ActionIcon size="xs" color="red" variant="subtle" onClick={() => removeAttachment(i)}>
                          <IconTrash size={12} />
                        </ActionIcon>
                      </Group>
                    ))}
                    <Group gap="xs" align="flex-end">
                      <Select
                        size="xs"
                        w={120}
                        label="Type"
                        value={newAttachType}
                        onChange={(v) => setNewAttachType((v as AttachmentType) ?? 'url')}
                        data={[
                          { value: 'github', label: 'GitHub' },
                          { value: 'bitbucket', label: 'Bitbucket' },
                          { value: 'youtube', label: 'YouTube' },
                          { value: 'video', label: 'Video' },
                          { value: 'pptx', label: 'PPTX' },
                          { value: 'url', label: 'URL' },
                        ]}
                      />
                      <TextInput
                        size="xs"
                        label="URL"
                        placeholder="https://..."
                        style={{ flex: 1 }}
                        value={newAttachUrl}
                        onChange={(e) => setNewAttachUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addAttachment()}
                      />
                      <Button size="xs" variant="light" leftSection={<IconPlus size={12} />}
                        onClick={addAttachment} disabled={!newAttachUrl.trim()} style={{ alignSelf: 'flex-end' }}>
                        Add
                      </Button>
                    </Group>
                  </Stack>

                  <Group justify="flex-end">
                    <Button
                      leftSection={<IconPresentation size={16} />}
                      loading={submitFinalMutation.isPending}
                      disabled={!submissionTitle.trim()}
                      onClick={() => submitFinalMutation.mutate()}
                    >
                      {mySubmission ? 'Update Submission' : 'Submit Project'}
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* Judging Config Tab (manager only) */}
          {isManager && (
            <Tabs.Panel value="judging-config" pt="lg">
              <Stack gap="md" maw={520}>
                {/* Visibility */}
                <Card withBorder radius="md">
                  <Stack gap="sm">
                    <Group gap="xs">
                      <IconWorld size={16} />
                      <Text fw={600}>Visibility</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      <b>Public</b> — hackathon appears to anyone.{' '}
                      <b>Private</b> — only org members can see it.
                    </Text>
                    <SegmentedControl
                      value={pendingVisibility ?? (currentHackathon as { visibility?: string }).visibility ?? 'private'}
                      onChange={(v) => setPendingVisibility(v as HackathonVisibility)}
                      data={[{ label: 'Private', value: 'private' }, { label: 'Public', value: 'public' }]}
                    />
                  </Stack>
                </Card>

                {/* Join Policy */}
                <Card withBorder radius="md">
                  <Stack gap="sm">
                    <Group gap="xs">
                      <IconUserCheck size={16} />
                      <Text fw={600}>Join Policy</Text>
                    </Group>
                    <SegmentedControl
                      value={pendingJoinPolicy ?? (currentHackathon as { joinPolicy?: string }).joinPolicy ?? 'self_register'}
                      onChange={(v) => setPendingJoinPolicy(v as HackathonJoinPolicy)}
                      data={[
                        { label: 'Self-register', value: 'self_register' },
                        { label: 'Invite only', value: 'invite_only' },
                      ]}
                    />
                  </Stack>
                </Card>

                {/* Judging mode */}
                <Card withBorder radius="md">
                  <Stack gap="sm">
                    <Group gap="xs">
                      <IconGavel size={16} />
                      <Text fw={600}>Judging Mode</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      <b>Panel</b> — only assigned judges score.{' '}
                      <b>Community</b> — all members vote.{' '}
                      <b>Blended</b> — weighted mix of both.
                    </Text>
                    <SegmentedControl
                      value={pendingJudgingMode ?? (currentHackathon as { judgingMode?: string }).judgingMode ?? 'community'}
                      onChange={(v) => setPendingJudgingMode(v as JudgingMode)}
                      data={[
                        { label: 'Community', value: 'community' },
                        { label: 'Panel', value: 'panel' },
                        { label: 'Blended', value: 'blended' },
                      ]}
                    />

                    {(pendingJudgingMode ?? (currentHackathon as { judgingMode?: string }).judgingMode) === 'blended' && (
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm">Panel weight</Text>
                          <Text size="sm" fw={600}>
                            {pendingPanelWeight ?? (currentHackathon as { panelWeight?: number }).panelWeight ?? 70}%
                          </Text>
                        </Group>
                        <Slider
                          value={pendingPanelWeight ?? (currentHackathon as { panelWeight?: number }).panelWeight ?? 70}
                          onChange={setPendingPanelWeight}
                          min={10} max={90} step={5}
                          marks={[{ value: 30, label: '30%' }, { value: 50, label: '50%' }, { value: 70, label: '70%' }]}
                        />
                        <Text size="xs" c="dimmed">
                          Community votes account for the remaining{' '}
                          {100 - (pendingPanelWeight ?? (currentHackathon as { panelWeight?: number }).panelWeight ?? 70)}%.
                        </Text>
                      </Stack>
                    )}

                    <Group justify="flex-end">
                      <Button
                        leftSection={<IconCheck size={16} />}
                        loading={updateJudgingConfigMutation.isPending}
                        onClick={() =>
                          updateJudgingConfigMutation.mutate({
                            visibility: pendingVisibility ?? undefined,
                            joinPolicy: pendingJoinPolicy ?? undefined,
                            judgingMode: pendingJudgingMode ?? undefined,
                            panelWeight: pendingPanelWeight ?? undefined,
                          })
                        }
                      >
                        Save Config
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </Stack>
            </Tabs.Panel>
          )}
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