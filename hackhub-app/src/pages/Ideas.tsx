import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Card,
  Grid,
  Badge,
  ActionIcon,
  ThemeIcon,
  rem,
  Center,
  Avatar,
  Modal,
} from '@mantine/core'
import {
  IconBulb,
  IconHeart,
  IconHeartFilled,
  IconEye,
} from '@tabler/icons-react'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import type { Idea } from '../services/ideaService'
import { notifications } from '@mantine/notifications'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import type { ProjectAttachment } from '../components/ProjectAttachments'
import { ProjectAttachments } from '../components/ProjectAttachments'

// Parse project attachments stored in the idea
const parseProjectData = (idea: Idea) => {
  return {
    repositoryUrl: idea.repositoryUrl ?? '',
    demoUrl: idea.demoUrl ?? '',
    projectAttachments: (idea.projectAttachments ?? []).map((a, i) => ({
      id: `att-${i}`,
      type: a.type as 'screenshot' | 'repository' | 'demo',
      url: a.url,
      title: a.name,
      description: a.description,
      display_order: i,
    } satisfies ProjectAttachment)),
  }
}

export function Ideas() {
  const { id: hackathonId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { ideas, hackathons, teams, fetchIdeas, fetchHackathons, fetchTeams, voteIdea } = useHackathonStore()
  const [detailsOpened, setDetailsOpened] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)

  useEffect(() => {
    fetchHackathons()
  }, [fetchHackathons])

  useEffect(() => {
    if (hackathonId) {
      fetchIdeas(hackathonId)
      fetchTeams(hackathonId)
    }
  }, [fetchIdeas, fetchTeams, hackathonId])

  const filteredAndSortedIdeas = useMemo(() => {
    return ideas.sort((a, b) => (b.votes || 0) - (a.votes || 0))
  }, [ideas])

  const getTeamName = (teamId: string | null) => {
    if (!teamId || !teams) return null
    const team = teams.find(t => t.id === teamId)
    return team?.name ?? 'Unknown Team'
  }

  const handleViewDetails = (idea: Idea) => {
    setSelectedIdea(idea)
    setDetailsOpened(true)
  }

  if (!hackathonId) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Ideas</Title>
            <Text c="dimmed">Select a hackathon to view and manage ideas</Text>
          </div>
        </Group>

        <Grid>
          {hackathons.map((hackathon) => (
            <Grid.Col key={hackathon.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={4}>{hackathon.title}</Title>
                    <Badge color={hackathon.status === 'running' ? 'green' : 'blue'}>
                      {hackathon.status}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed" lineClamp={3}>
                    {hackathon.description}
                  </Text>
                  <Button
                    onClick={() => navigate(`/hackathons/${hackathon.id}/ideas`)}
                    leftSection={<IconBulb size={16} />}
                    variant="light"
                  >
                    View Ideas
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {hackathons.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size={80} variant="light" color="blue">
                <IconBulb style={{ width: rem(40), height: rem(40) }} />
              </ThemeIcon>
              <Title order={3}>No Hackathons Available</Title>
              <Text c="dimmed" ta="center">
                There are no hackathons available yet. Check back later or contact an administrator.
              </Text>
            </Stack>
          </Center>
        )}
      </Stack>
    )
  }

  const handleVoteIdea = async (ideaId: string) => {
    if (!user) return

    try {
      await voteIdea(ideaId)
      notifications.show({
        title: 'Vote updated!',
        message: 'Your vote has been recorded',
        color: 'green',
      })
    } catch (error) {
      console.error('Failed to vote on idea:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to vote on idea',
        color: 'red',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray'
      case 'submitted': return 'blue'
      case 'in-progress': return 'yellow'
      case 'completed': return 'green'
      default: return 'gray'
    }
  }

  const currentHackathon = hackathons.find(h => h.id === hackathonId)

  return (
    <Stack gap="lg">
      <Group justify="flex-start">
        <div>
          <Title order={2}>Ideas</Title>
          <Text c="dimmed">
            {currentHackathon ? `Ideas for ${currentHackathon.title}` : 'Hackathon Ideas'}
          </Text>
        </div>
      </Group>

      {ideas.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} variant="light" color="blue">
              <IconBulb style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Title order={3}>No Ideas Yet</Title>
            <Text c="dimmed" ta="center">
              Teams will automatically submit their ideas when they are created.
            </Text>
          </Stack>
        </Center>
      ) : (
        <Grid>
          {filteredAndSortedIdeas.map((idea) => (
            <Grid.Col key={idea.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Stack gap="md" h="100%">
                  <Group justify="space-between">
                    <Title order={4} lineClamp={2}>
                      {idea.title}
                    </Title>
                    <Badge color={getStatusColor(idea.status)} variant="light" size="sm">
                      {idea.status}
                    </Badge>
                  </Group>

                  <div style={{
                    flex: 1,
                    maxHeight: '120px',
                    overflow: 'auto',
                    border: '1px solid var(--mantine-color-gray-2)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '14px',
                    color: 'var(--mantine-color-dimmed)',
                  }}>
                    <MarkdownRenderer>
                      {idea.description}
                    </MarkdownRenderer>
                  </div>

                  <Badge variant="outline" size="sm">
                    {idea.category}
                  </Badge>

                  {idea.tags && idea.tags.length > 0 && (
                    <Group gap="xs">
                      {idea.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" size="xs">
                          {tag}
                        </Badge>
                      ))}
                      {idea.tags.length > 3 && (
                        <Text size="xs" c="dimmed">+{idea.tags.length - 3} more</Text>
                      )}
                    </Group>
                  )}

                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Avatar size="sm" radius="xl">
                        {idea.createdBy?.slice(0, 2).toUpperCase() || 'U'}
                      </Avatar>
                      <div>
                        {idea.teamId && getTeamName(idea.teamId) ? (
                          <Badge variant="light" color="green" size="xs">
                            Team: {getTeamName(idea.teamId)}
                          </Badge>
                        ) : (
                          <Badge variant="light" color="blue" size="xs">
                            Individual
                          </Badge>
                        )}
                      </div>
                    </Group>

                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleViewDetails(idea)}
                        title="View Details"
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleVoteIdea(idea.id)}
                      >
                        {idea.userHasVoted ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                      </ActionIcon>
                      <Text size="sm" fw={500}>
                        {idea.votes || 0}
                      </Text>
                    </Group>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* Idea Details Modal */}
      <Modal
        opened={detailsOpened}
        onClose={() => setDetailsOpened(false)}
        title={selectedIdea ? `Idea Details: ${selectedIdea.title}` : 'Idea Details'}
        size="lg"
      >
        {selectedIdea && (
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>{selectedIdea.title}</Title>
              <Badge color={getStatusColor(selectedIdea.status)} variant="light" size="sm">
                {selectedIdea.status}
              </Badge>
            </Group>

            <MarkdownRenderer enableScroll={true} maxHeight="40vh">
              {selectedIdea.description}
            </MarkdownRenderer>

            <ProjectAttachments
              attachments={parseProjectData(selectedIdea).projectAttachments}
              onAttachmentsChange={() => undefined}
              repositoryUrl={parseProjectData(selectedIdea).repositoryUrl}
              onRepositoryUrlChange={() => undefined}
              demoUrl={parseProjectData(selectedIdea).demoUrl}
              onDemoUrlChange={() => undefined}
              readonly={true}
            />

            <Group>
              <Badge variant="outline" size="sm">
                {selectedIdea.category}
              </Badge>
              {selectedIdea.teamId && getTeamName(selectedIdea.teamId) && (
                <Badge variant="light" color="green" size="sm">
                  Team: {getTeamName(selectedIdea.teamId)}
                </Badge>
              )}
            </Group>

            {selectedIdea.tags && selectedIdea.tags.length > 0 && (
              <Group gap="xs">
                <Text size="sm" fw={500}>Tags:</Text>
                {selectedIdea.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" size="xs">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}

            <Group justify="space-between">
              <Group gap="xs">
                <Avatar size="sm" radius="xl">
                  {selectedIdea.createdBy?.slice(0, 2).toUpperCase() || 'U'}
                </Avatar>
                <Text size="sm">Created by: {selectedIdea.createdBy}</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {new Date(selectedIdea.createdAt).toLocaleDateString()}
              </Text>
            </Group>

            <Group justify="space-between" pt="md">
              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => handleVoteIdea(selectedIdea.id)}
                >
                  {selectedIdea.userHasVoted ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                </ActionIcon>
                <Text size="sm" fw={500}>
                  {selectedIdea.votes || 0} votes
                </Text>
              </Group>
              <Button variant="light" onClick={() => setDetailsOpened(false)}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
