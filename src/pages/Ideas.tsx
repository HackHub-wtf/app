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
  Textarea,
  Modal,
  TextInput,
  Select,
  Tooltip,
} from '@mantine/core'
import {
  IconPlus,
  IconBulb,
  IconHeart,
  IconMessageCircle,
  IconEdit,
  IconEye,
  IconHeartFilled,
} from '@tabler/icons-react'
import { useState, useEffect, useMemo } from 'react'
import { useForm } from '@mantine/form'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { useRealtime } from '../contexts/RealtimeContext'
import { notifications } from '@mantine/notifications'

interface NewIdeaForm {
  title: string
  description: string
  category: string
  tags: string
}

export function Ideas() {
  const { id: hackathonId } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { ideas, fetchIdeas, voteIdea, createIdea } = useHackathonStore()
  const { isConnected, subscribeToIdeaVotes } = useRealtime()
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    if (hackathonId) {
      fetchIdeas(hackathonId, user?.id)
    }
  }, [fetchIdeas, hackathonId, user?.id])

  useEffect(() => {
    if (isConnected && hackathonId) {
      // Subscribe to real-time idea votes for this hackathon
      ideas.forEach(idea => {
        subscribeToIdeaVotes(idea.id)
      })
      
      console.log('Real-time connected for ideas in hackathon:', hackathonId)
    }
  }, [isConnected, subscribeToIdeaVotes, ideas, hackathonId])

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

  const form = useForm<NewIdeaForm>({
    initialValues: {
      title: '',
      description: '',
      category: '',
      tags: '',
    },
    validate: {
      title: (value) => (value.length < 5 ? 'Title must be at least 5 characters' : null),
      description: (value) => (value.length < 20 ? 'Description must be at least 20 characters' : null),
      category: (value) => (!value ? 'Category is required' : null),
    },
  })

  const filteredAndSortedIdeas = useMemo(() => {
    // Sort ideas by votes (most popular first)
    return ideas.sort((a, b) => b.votes - a.votes)
  }, [ideas])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray'
      case 'submitted': return 'blue'
      case 'in-progress': return 'orange'
      case 'completed': return 'green'
      default: return 'gray'
    }
  }

    const handleSubmit = async (values: NewIdeaForm) => {
    if (!user || !hackathonId) return

    try {
      await createIdea({
        title: values.title,
        description: values.description,
        hackathon_id: hackathonId,
        team_id: undefined, // Ideas can be created without a team initially
        created_by: user.id,
        category: values.category,
        tags: values.tags.split(',').map(tag => tag.trim()),
        status: 'draft',
        attachments: []
      })
      
      setOpened(false)
      form.reset()
      
      notifications.show({
        title: 'Success!',
        message: 'Your idea has been submitted',
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to submit idea:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to submit idea',
        color: 'red'
      })
    }
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={1}>Ideas Board</Title>
          <Text c="dimmed" size="lg" mt="xs">
            Share your innovative ideas and vote on others
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="gradient"
          gradient={{ from: 'yellow', to: 'orange' }}
          onClick={() => setOpened(true)}
        >
          Submit Idea
        </Button>
      </Group>

      {ideas.length > 0 ? (
        <Grid>
          {filteredAndSortedIdeas.map((idea) => (
            <Grid.Col key={idea.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card withBorder radius="md" h="100%">
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Text fw={600} size="lg" lineClamp={2}>
                      {idea.title}
                    </Text>
                    <Badge color={getStatusColor(idea.status)} variant="light" size="sm">
                      {idea.status}
                    </Badge>
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={3}>
                    {idea.description}
                  </Text>

                  <Group gap="xs">
                    <Badge variant="outline" size="sm">
                      {idea.category}
                    </Badge>
                  </Group>

                  <Group gap="xs">
                    {idea.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" size="xs">
                        {tag}
                      </Badge>
                    ))}
                  </Group>

                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Avatar size="sm" radius="xl">
                        {idea.profiles.name.charAt(0)}
                      </Avatar>
                      <Text size="xs" c="dimmed">
                        {idea.profiles.name}
                      </Text>
                    </Group>

                    {idea.team_id && (
                      <Badge variant="light" color="blue" size="xs">
                        Team Project
                      </Badge>
                    )}
                  </Group>

                  <Group justify="space-between" mt="auto">
                    <Group gap="sm">
                      <Tooltip label={idea.user_has_voted ? "Remove vote" : "Vote for this idea"}>
                        <ActionIcon
                          variant={idea.user_has_voted ? 'filled' : 'light'}
                          color={idea.user_has_voted ? 'red' : 'gray'}
                          size="sm"
                          onClick={() => handleVoteIdea(idea.id)}
                        >
                          {idea.user_has_voted ? <IconHeartFilled size={14} /> : <IconHeart size={14} />}
                        </ActionIcon>
                      </Tooltip>
                      <Text size="sm" fw={500}>
                        {idea.votes}
                      </Text>

                      <ActionIcon variant="light" size="sm">
                        <IconMessageCircle size={14} />
                      </ActionIcon>
                      <Text size="sm" c="dimmed">
                        {idea.comments.length}
                      </Text>
                    </Group>

                    <Group gap="xs">
                      <ActionIcon variant="light" size="sm">
                        <IconEye size={14} />
                      </ActionIcon>
                      {idea.profiles.name === user?.name && (
                        <ActionIcon variant="light" size="sm" color="blue">
                          <IconEdit size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} variant="light" color="yellow">
              <IconBulb style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Text ta="center" size="lg" fw={500}>
              No ideas yet
            </Text>
            <Text ta="center" c="dimmed">
              Be the first to share your innovative idea!
            </Text>
            <Button
              variant="gradient"
              gradient={{ from: 'yellow', to: 'orange' }}
              leftSection={<IconPlus size={16} />}
              onClick={() => setOpened(true)}
            >
              Submit First Idea
            </Button>
          </Stack>
        </Center>
      )}

      {/* New Idea Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Submit New Idea"
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Idea Title"
              placeholder="Enter a catchy title for your idea"
              required
              {...form.getInputProps('title')}
            />

            <Textarea
              label="Description"
              placeholder="Describe your idea in detail"
              required
              minRows={4}
              {...form.getInputProps('description')}
            />

            <Select
              label="Category"
              placeholder="Select a category"
              required
              data={[
                { value: 'AI/ML', label: 'AI & Machine Learning' },
                { value: 'Web Development', label: 'Web Development' },
                { value: 'Mobile', label: 'Mobile Apps' },
                { value: 'IoT', label: 'Internet of Things' },
                { value: 'Blockchain', label: 'Blockchain' },
                { value: 'Health', label: 'Healthcare' },
                { value: 'Education', label: 'Education' },
                { value: 'Sustainability', label: 'Sustainability' },
                { value: 'FinTech', label: 'FinTech' },
                { value: 'Gaming', label: 'Gaming' },
                { value: 'Other', label: 'Other' },
              ]}
              {...form.getInputProps('category')}
            />

            <TextInput
              label="Tags"
              placeholder="Enter tags separated by commas (e.g., React, AI, Mobile)"
              description="Add relevant tags to help others discover your idea"
              {...form.getInputProps('tags')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" leftSection={<IconBulb size={16} />}>
                Submit Idea
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
