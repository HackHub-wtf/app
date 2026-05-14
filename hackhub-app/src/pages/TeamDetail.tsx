import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Avatar,
  Tabs,
  Skeleton,
  Alert,
  Center,
  ThemeIcon,
  rem,
  ActionIcon,

  Textarea,

  SimpleGrid,
  Divider,
} from '@mantine/core'
import {
  IconUsers,
  IconChevronLeft,
  IconAlertCircle,

  IconPresentation,
  IconBrandGithub,
  IconVideo,
  IconLink,
  IconCheck,
  IconEdit,
  IconX,
  IconUserPlus,
  IconUserMinus,
  IconMessage,
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../store/authStore'
import { TeamService } from '../services/teamService'
import { JudgingService } from '../services/judgingService'
import type { AttachmentType } from '../services/judgingService'

const attachmentIcon = (type: AttachmentType) => {
  switch (type) {
    case 'github': case 'bitbucket': return <IconBrandGithub size={14} />
    case 'youtube': case 'video': return <IconVideo size={14} />
    default: return <IconLink size={14} />
  }
}

export function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [editingDesc, setEditingDesc] = useState(false)
  const [pendingDesc, setPendingDesc] = useState('')

  const { data: rawTeam, isLoading, error } = useQuery({
    queryKey: ['team', id],
    queryFn: () => TeamService.getTeam(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['team-members', id],
    queryFn: () => TeamService.getTeamMembers(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  })

  const team = rawTeam ? { ...rawTeam, members } : undefined

  const { data: submission } = useQuery({
    queryKey: ['team-submission', team?.hackathonId, id],
    queryFn: () =>
      team ? JudgingService.getMySubmission(team.hackathonId) : null,
    enabled: !!team,
    staleTime: 60 * 1000,
  })

  const isLeader = team?.members.some(
    (m) => m.userId === user?.id && m.role === 'leader'
  )
  const isMember = team?.members.some((m) => m.userId === user?.id)

  const joinMutation = useMutation({
    mutationFn: () => TeamService.joinTeam(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      notifications.show({ title: 'Joined!', message: `You are now on ${team?.name}.`, color: 'green' })
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Could not join', message: err.message, color: 'red' }),
  })

  const leaveMutation = useMutation({
    mutationFn: () => TeamService.leaveTeam(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      notifications.show({ title: 'Left team', message: 'You have left the team.', color: 'orange' })
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Could not leave', message: err.message, color: 'red' }),
  })

  const updateMutation = useMutation({
    mutationFn: (description: string) => TeamService.updateTeam(id!, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      setEditingDesc(false)
      notifications.show({ title: 'Saved', message: 'Team description updated.', color: 'green' })
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Error', message: err.message, color: 'red' }),
  })

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Skeleton height={80} />
          <Skeleton height={200} />
        </Stack>
      </Container>
    )
  }

  if (error || !team) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error instanceof Error ? error.message : 'Team not found.'}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Back */}
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconChevronLeft size={16} />}
            onClick={() => navigate(`/hackathons/${team.hackathonId}`)}
            size="sm"
          >
            Back to hackathon
          </Button>
        </Group>

        {/* Header card */}
        <Card withBorder radius="md" p="lg">
          <Group justify="space-between" align="flex-start">
            <Group gap="md">
              <ThemeIcon size={56} variant="light" color="blue" radius="xl">
                <IconUsers style={{ width: rem(28), height: rem(28) }} />
              </ThemeIcon>
              <div>
                <Title order={2}>{team.name}</Title>
                <Group gap="xs" mt={4}>
                  {team.skills.map((s) => (
                    <Badge key={s} size="xs" variant="outline">{s}</Badge>
                  ))}
                  <Badge color={team.isOpen ? 'green' : 'gray'} variant="light" size="xs">
                    {team.isOpen ? 'Open to join' : 'Closed'}
                  </Badge>
                </Group>
              </div>
            </Group>

            <Group gap="sm">
              {!isMember && team.isOpen && (
                <Button
                  leftSection={<IconUserPlus size={16} />}
                  loading={joinMutation.isPending}
                  onClick={() => joinMutation.mutate()}
                >
                  Join team
                </Button>
              )}
              {isMember && isLeader && (
                <Button
                  variant="filled"
                  color="blue"
                  leftSection={<IconEdit size={16} />}
                >
                  Manage Team
                </Button>
              )}
              {isMember && !isLeader && (
                <>
                  <Button
                    variant="light"
                    leftSection={<IconUsers size={16} />}
                  >
                    View My Team
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconUserMinus size={16} />}
                    loading={leaveMutation.isPending}
                    onClick={() => leaveMutation.mutate()}
                  >
                    Leave
                  </Button>
                </>
              )}
              {isMember && (
                <Button
                  variant="light"
                  leftSection={<IconMessage size={16} />}
                  component={Link}
                  to={`/hackathons/${team.hackathonId}/teams`}
                >
                  Team chat
                </Button>
              )}
            </Group>
          </Group>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconUsers size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="project" leftSection={<IconPresentation size={16} />}>
              Project
            </Tabs.Tab>
          </Tabs.List>

          {/* Overview tab */}
          <Tabs.Panel value="overview" pt="md">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {/* Description */}
              <Card withBorder radius="md">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600}>About</Text>
                    {isLeader && !editingDesc && (
                      <ActionIcon size="sm" variant="subtle" onClick={() => {
                        setPendingDesc(team.description)
                        setEditingDesc(true)
                      }}>
                        <IconEdit size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                  {editingDesc ? (
                    <Stack gap="xs">
                      <Textarea
                        value={pendingDesc}
                        onChange={(e) => setPendingDesc(e.target.value)}
                        minRows={4}
                        autosize
                      />
                      <Group gap="xs" justify="flex-end">
                        <ActionIcon variant="light" color="gray" size="sm" onClick={() => setEditingDesc(false)}>
                          <IconX size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="green"
                          size="sm"
                          loading={updateMutation.isPending}
                          onClick={() => updateMutation.mutate(pendingDesc)}
                        >
                          <IconCheck size={14} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  ) : (
                    <Text size="sm" c={team.description ? undefined : 'dimmed'}>
                      {team.description || 'No description yet.'}
                    </Text>
                  )}
                </Stack>
              </Card>

              {/* Members */}
              <Card withBorder radius="md">
                <Stack gap="sm">
                  <Text fw={600}>Members ({team.members.length})</Text>
                  {team.members.length === 0 ? (
                    <Text size="sm" c="dimmed">No members yet.</Text>
                  ) : (
                    team.members.map((m) => (
                      <Group key={m.id} gap="sm">
                        <Avatar size="sm" color="blue">
                          {m.userId.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text size="sm">{m.userId.slice(0, 8)}…</Text>
                        </div>
                        <Badge
                          size="xs"
                          color={m.role === 'leader' ? 'orange' : 'gray'}
                          variant="light"
                        >
                          {m.role}
                        </Badge>
                      </Group>
                    ))
                  )}
                </Stack>
              </Card>
            </SimpleGrid>
          </Tabs.Panel>

          {/* Project tab */}
          <Tabs.Panel value="project" pt="md">
            {submission ? (
              <Card withBorder radius="md">
                <Stack gap="md">
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text fw={600} c="green">Project submitted</Text>
                  </Group>
                  <div>
                    <Text fw={600} size="lg">{submission.title}</Text>
                    {submission.description && (
                      <Text size="sm" c="dimmed" mt={4}>{submission.description}</Text>
                    )}
                  </div>
                  {submission.attachments.length > 0 && (
                    <>
                      <Divider label="Attachments" labelPosition="left" />
                      <Stack gap="xs">
                        {submission.attachments.map((a, i) => (
                          <Group key={i} gap="xs">
                            {attachmentIcon(a.type)}
                            <Text
                              size="sm"
                              component="a"
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: 'underline' }}
                            >
                              {a.filename ?? a.url}
                            </Text>
                            <Badge size="xs" variant="outline">{a.type}</Badge>
                          </Group>
                        ))}
                      </Stack>
                    </>
                  )}
                  {isMember && (
                    <Button
                      variant="light"
                      size="sm"
                      leftSection={<IconPresentation size={14} />}
                      onClick={() => navigate(`/hackathons/${team.hackathonId}?tab=submit`)}
                    >
                      Update submission
                    </Button>
                  )}
                </Stack>
              </Card>
            ) : (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size={64} variant="light" color="gray" radius="xl">
                    <IconPresentation style={{ width: rem(32), height: rem(32) }} />
                  </ThemeIcon>
                  <Text fw={500}>No project submitted yet</Text>
                  {isMember && (
                    <Button
                      leftSection={<IconPresentation size={16} />}
                      onClick={() => navigate(`/hackathons/${team.hackathonId}?tab=submit`)}
                    >
                      Submit project
                    </Button>
                  )}
                </Stack>
              </Center>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}
