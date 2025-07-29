import {
  Stack,
  Title,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Grid,
  Avatar,
  Progress,
  ActionIcon,
  TextInput,
  Select,
  ThemeIcon,
  rem,
  Center,
  Image,
} from '@mantine/core'
import {
  IconPlus,
  IconSearch,
  IconCalendar,
  IconUsers,
  IconTarget,
  IconTrophy,
  IconEdit,
  IconEye,
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'

export function Hackathons() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hackathons, fetchHackathons } = useHackathonStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const isManager = user?.role === 'manager' || user?.role === 'admin'

  useEffect(() => {
    fetchHackathons()
  }, [fetchHackathons])

  const filteredHackathons = hackathons.filter((hackathon) => {
    const matchesSearch = hackathon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hackathon.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || hackathon.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  const getProgress = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100)
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={1}>Hackathons</Title>
          <Text c="dimmed" size="lg" mt="xs">
            Discover and participate in amazing coding challenges
          </Text>
        </div>
        {isManager && (
          <Button
            leftSection={<IconPlus size={16} />}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            onClick={() => navigate('/hackathons/create')}
          >
            Create Hackathon
          </Button>
        )}
      </Group>

      {/* Filters */}
      <Group>
        <TextInput
          placeholder="Search hackathons..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filter by status"
          data={[
            { value: 'open', label: 'Registration Open' },
            { value: 'running', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'draft', label: 'Coming Soon' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          w={200}
        />
      </Group>

      {/* Hackathons Grid */}
      {filteredHackathons.length > 0 ? (
        <Grid>
          {filteredHackathons.map((hackathon) => (
            <Grid.Col key={hackathon.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card withBorder radius="lg" h="100%" style={{ cursor: 'pointer' }}>
                <Card.Section>
                  <Image
                    src={hackathon.banner_url || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop'}
                    alt={hackathon.title}
                    height={160}
                    fallbackSrc="https://via.placeholder.com/400x200?text=Hackathon"
                  />
                </Card.Section>

                <Stack gap="sm" p="md">
                  <Group justify="space-between" align="flex-start">
                    <Text fw={600} size="lg" lineClamp={1}>
                      {hackathon.title}
                    </Text>
                    <Badge color={getStatusColor(hackathon.status)} variant="light" size="sm">
                      {getStatusLabel(hackathon.status)}
                    </Badge>
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {hackathon.description}
                  </Text>

                  <Group gap="xs">
                    {hackathon.tags?.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" size="xs">
                        {tag}
                      </Badge>
                    ))}
                  </Group>

                  <Group gap="xs" c="dimmed" fz="sm">
                    <IconCalendar size={14} />
                    <Text size="xs">
                      {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                    </Text>
                  </Group>

                  <Group gap="xs" c="dimmed" fz="sm">
                    <IconUsers size={14} />
                    <Text size="xs">
                      {hackathon.current_participants} / {hackathon.allowed_participants} participants
                    </Text>
                  </Group>

                  <Progress
                    value={getProgress(hackathon.current_participants, hackathon.allowed_participants)}
                    size="sm"
                    radius="xl"
                  />

                  {hackathon.prizes && hackathon.prizes.length > 0 && (
                    <Group gap="xs">
                      <IconTarget size={14} color="gold" />
                      <Text size="xs" fw={500}>
                        Prizes: {hackathon.prizes.join(', ')}
                      </Text>
                    </Group>
                  )}

                  <Group justify="space-between" mt="auto">
                    <Group gap="xs">
                      <Avatar size="sm" radius="xl">
                        {hackathon.created_by?.charAt(0).toUpperCase() || 'H'}
                      </Avatar>
                      <Text size="xs" c="dimmed">
                        {hackathon.created_by || 'Admin'}
                      </Text>
                    </Group>

                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/hackathons/${hackathon.id}`)
                        }}
                      >
                        <IconEye size={14} />
                      </ActionIcon>
                      {isManager && hackathon.created_by === user?.id && (
                        <ActionIcon
                          variant="light"
                          size="sm"
                          color="blue"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/hackathons/${hackathon.id}/edit`)
                          }}
                        >
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
            <ThemeIcon size={80} variant="light" color="blue">
              <IconTrophy style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Text ta="center" size="lg" fw={500}>
              No hackathons found
            </Text>
            <Text ta="center" c="dimmed">
              {searchQuery || statusFilter
                ? 'Try adjusting your search criteria'
                : 'Be the first to create a hackathon!'}
            </Text>
            {isManager && !searchQuery && !statusFilter && (
              <Button
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                leftSection={<IconPlus size={16} />}
                onClick={() => navigate('/hackathons/create')}
              >
                Create First Hackathon
              </Button>
            )}
          </Stack>
        </Center>
      )}
    </Stack>
  )
}
