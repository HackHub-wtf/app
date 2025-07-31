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
  TypographyStylesProvider,
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
import { type IdeaWithDetails } from '../services/ideaService'
import { notifications } from '@mantine/notifications'

export function Ideas() {
  const { id: hackathonId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { ideas, hackathons, teams, fetchIdeas, fetchHackathons, fetchTeams, voteIdea } = useHackathonStore()
  const [detailsOpened, setDetailsOpened] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<IdeaWithDetails | null>(null)

  useEffect(() => {
    // Always fetch hackathons for selection
    fetchHackathons()
  }, [fetchHackathons])

  useEffect(() => {
    if (hackathonId) {
      fetchIdeas(hackathonId, user?.id)
      fetchTeams(hackathonId) // Fetch teams to show team names
    }
  }, [fetchIdeas, fetchTeams, hackathonId, user?.id])

  const filteredAndSortedIdeas = useMemo(() => {
    return ideas
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
  }, [ideas])

  const getTeamName = (teamId: string | null) => {
    if (!teamId || !teams) return null
    const team = teams.find(t => t.id === teamId)
    return team?.name || 'Unknown Team'
  }

  const handleViewDetails = (idea: IdeaWithDetails) => {
    setSelectedIdea(idea)
    setDetailsOpened(true)
  }

  // If no hackathon is selected, show hackathon selection
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
      await voteIdea(ideaId, user.id)
      
      notifications.show({
        title: 'Vote updated!',
        message: 'Your vote has been recorded',
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to vote on idea:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to vote on idea',
        color: 'red'
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
                  
                  <TypographyStylesProvider>
                    <div 
                      style={{ fontSize: '14px', color: 'var(--mantine-color-dimmed)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', flex: 1 }}
                      dangerouslySetInnerHTML={{ __html: idea.description }}
                    />
                  </TypographyStylesProvider>
                  
                  <Badge variant="outline" size="sm">
                    {idea.category}
                  </Badge>
                  
                  {idea.tags && idea.tags.length > 0 && (
                    <Group gap="xs">
                      {idea.tags.slice(0, 3).map((tag) => (
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
                        {idea.created_by?.slice(0, 2).toUpperCase() || 'U'}
                      </Avatar>
                      <div>
                        {idea.team_id && getTeamName(idea.team_id) ? (
                          <Badge variant="light" color="green" size="xs">
                            Team: {getTeamName(idea.team_id)}
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
                        {idea.user_has_voted ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
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

            <TypographyStylesProvider>
              <div 
                style={{ fontSize: '14px' }}
                dangerouslySetInnerHTML={{ __html: selectedIdea.description }}
              />
            </TypographyStylesProvider>

            <Group>
              <Badge variant="outline" size="sm">
                {selectedIdea.category}
              </Badge>
              {selectedIdea.team_id && getTeamName(selectedIdea.team_id) && (
                <Badge variant="light" color="green" size="sm">
                  Team: {getTeamName(selectedIdea.team_id)}
                </Badge>
              )}
            </Group>

            {selectedIdea.tags && selectedIdea.tags.length > 0 && (
              <Group gap="xs">
                <Text size="sm" fw={500}>Tags:</Text>
                {selectedIdea.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="xs">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}

            <Group justify="space-between">
              <Group gap="xs">
                <Avatar size="sm" radius="xl">
                  {selectedIdea.created_by?.slice(0, 2).toUpperCase() || 'U'}
                </Avatar>
                <Text size="sm">Created by: {selectedIdea.profiles?.name || selectedIdea.created_by}</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {new Date(selectedIdea.created_at).toLocaleDateString()}
              </Text>
            </Group>

            <Group justify="space-between" pt="md">
              <Group gap="xs">
                <ActionIcon 
                  variant="light" 
                  color="red"
                  onClick={() => handleVoteIdea(selectedIdea.id)}
                >
                  {selectedIdea.user_has_voted ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
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
