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
  Container,
  Skeleton,
  Alert,
  Paper,
  Modal,
  Tooltip,
  Switch,
  MultiSelect
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
  IconAlertCircle,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconBulb,
  IconCheck,
  IconShare
} from '@tabler/icons-react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { TeamService } from '../services/teamService'
import { IdeaService } from '../services/ideaService'
import { useDisclosure } from '@mantine/hooks'

interface HackathonStats {
  [hackathonId: string]: {
    teamCount: number
    ideaCount: number
    isUserParticipating: boolean
    userTeamId?: string
  }
}

type SortField = 'title' | 'start_date' | 'participants' | 'created_at'
type SortDirection = 'asc' | 'desc'

export function Hackathons() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hackathons, fetchHackathons, loading, joinHackathon } = useHackathonStore()
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showMyHackathons, setShowMyHackathons] = useState(false)
  
  // Modal states
  const [joinModalOpened, { open: openJoinModal, close: closeJoinModal }] = useDisclosure(false)
  const [selectedHackathon, setSelectedHackathon] = useState<typeof hackathons[0] | null>(null)
  const [registrationKey, setRegistrationKey] = useState('')
  const [joiningHackathon, setJoiningHackathon] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  
  // Data states
  const [hackathonStats, setHackathonStats] = useState<HackathonStats>({})

  const isManager = user?.role === 'manager' || user?.role === 'admin'

  useEffect(() => {
    fetchHackathons()
  }, [fetchHackathons])

  const loadHackathonStats = async () => {
    if (!user) return
    
    try {
      const stats: HackathonStats = {}
      
      await Promise.all(
        hackathons.map(async (hackathon) => {
          try {
            const [teams, ideas] = await Promise.all([
              TeamService.getTeams(hackathon.id),
              IdeaService.getIdeas(hackathon.id, user.id)
            ])
            
            // Check if user is participating in any team
            const userTeam = teams.find(team => 
              team.team_members?.some(member => member.profiles?.id === user.id)
            )
            
            stats[hackathon.id] = {
              teamCount: teams.length,
              ideaCount: ideas.length,
              isUserParticipating: !!userTeam,
              userTeamId: userTeam?.id
            }
          } catch (error) {
            console.error(`Error loading stats for hackathon ${hackathon.id}:`, error)
            stats[hackathon.id] = {
              teamCount: 0,
              ideaCount: 0,
              isUserParticipating: false
            }
          }
        })
      )
      
      setHackathonStats(stats)
    } catch (error) {
      console.error('Error loading hackathon stats:', error)
    }
  }

  useEffect(() => {
    if (hackathons.length > 0 && user) {
      loadHackathonStats()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hackathons, user])

  // Get all unique tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    hackathons.forEach(hackathon => {
      hackathon.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [hackathons])

  // Filtered and sorted hackathons
  const filteredHackathons = useMemo(() => {
    const filtered = hackathons.filter((hackathon) => {
      const matchesSearch = hackathon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hackathon.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = !statusFilter || hackathon.status === statusFilter
      const matchesTags = tagFilter.length === 0 || 
                         tagFilter.some(tag => hackathon.tags?.includes(tag))
      const matchesMyHackathons = !showMyHackathons || 
                                 hackathon.created_by === user?.id ||
                                 hackathonStats[hackathon.id]?.isUserParticipating
      
      return matchesSearch && matchesStatus && matchesTags && matchesMyHackathons
    })

    // Sort hackathons
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'start_date':
          aValue = new Date(a.start_date).getTime()
          bValue = new Date(b.start_date).getTime()
          break
        case 'participants':
          aValue = a.current_participants
          bValue = b.current_participants
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [hackathons, searchQuery, statusFilter, tagFilter, showMyHackathons, sortField, sortDirection, user, hackathonStats])

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

  const handleJoinHackathon = async () => {
    if (!registrationKey.trim() || !selectedHackathon) return
    
    setJoiningHackathon(true)
    setJoinError(null)
    
    try {
      await joinHackathon(registrationKey.trim())
      closeJoinModal()
      setRegistrationKey('')
      setSelectedHackathon(null)
      
      // Refresh hackathon stats
      if (user) {
        loadHackathonStats()
      }
    } catch (error) {
      setJoinError((error as Error).message || 'Failed to join hackathon')
    } finally {
      setJoiningHackathon(false)
    }
  }

  const openJoinModalForHackathon = (hackathon: typeof hackathons[0]) => {
    setSelectedHackathon(hackathon)
    setJoinError(null)
    setRegistrationKey('')
    openJoinModal()
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const canJoinHackathon = (hackathon: typeof hackathons[0]) => {
    if (!user) return false
    if (hackathon.status !== 'open') return false
    if (hackathon.current_participants >= hackathon.allowed_participants) return false
    if (hackathonStats[hackathon.id]?.isUserParticipating) return false
    return true
  }

  const isHackathonFull = (hackathon: typeof hackathons[0]) => {
    return hackathon.current_participants >= hackathon.allowed_participants
  }

  const getDaysUntilStart = (startDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const diffTime = start.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysUntilEnd = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Container size="xl" py="xl">
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

        {/* Advanced Filters */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group>
              <IconFilter size={16} />
              <Text fw={500}>Filters & Search</Text>
            </Group>
            
            <Group wrap="wrap">
              <TextInput
                placeholder="Search hackathons..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                style={{ flex: 1, minWidth: 300 }}
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
              
              {allTags.length > 0 && (
                <MultiSelect
                  placeholder="Filter by tags"
                  data={allTags}
                  value={tagFilter}
                  onChange={setTagFilter}
                  clearable
                  w={250}
                />
              )}
              
              {user && (
                <Switch
                  label="My Hackathons"
                  checked={showMyHackathons}
                  onChange={(event) => setShowMyHackathons(event.currentTarget.checked)}
                />
              )}
            </Group>
            
            <Group>
              <Text size="sm" c="dimmed">Sort by:</Text>
              <Button.Group>
                <Button
                  variant={sortField === 'created_at' ? 'filled' : 'light'}
                  size="xs"
                  onClick={() => toggleSort('created_at')}
                  rightSection={sortField === 'created_at' && (
                    sortDirection === 'asc' ? <IconSortAscending size={13} /> : <IconSortDescending size={13} />
                  )}
                >
                  Date
                </Button>
                <Button
                  variant={sortField === 'title' ? 'filled' : 'light'}
                  size="xs"
                  onClick={() => toggleSort('title')}
                  rightSection={sortField === 'title' && (
                    sortDirection === 'asc' ? <IconSortAscending size={13} /> : <IconSortDescending size={13} />
                  )}
                >
                  Name
                </Button>
                <Button
                  variant={sortField === 'participants' ? 'filled' : 'light'}
                  size="xs"
                  onClick={() => toggleSort('participants')}
                  rightSection={sortField === 'participants' && (
                    sortDirection === 'asc' ? <IconSortAscending size={13} /> : <IconSortDescending size={13} />
                  )}
                >
                  Participants
                </Button>
              </Button.Group>
            </Group>
          </Stack>
        </Paper>

        {/* Results Summary */}
        <Group justify="space-between">
          <Text c="dimmed">
            {loading ? 'Loading...' : `Found ${filteredHackathons.length} hackathon${filteredHackathons.length !== 1 ? 's' : ''}`}
          </Text>
        </Group>

        {/* Hackathons Grid */}
        {loading ? (
          <Grid>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid.Col key={i} span={{ base: 12, md: 6, lg: 4 }}>
                <Card withBorder radius="lg" h="100%">
                  <Card.Section>
                    <Skeleton height={160} />
                  </Card.Section>
                  <Stack gap="sm" p="md">
                    <Skeleton height={24} />
                    <Skeleton height={40} />
                    <Skeleton height={16} />
                    <Skeleton height={16} />
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        ) : filteredHackathons.length > 0 ? (
          <Grid>
            {filteredHackathons.map((hackathon) => (
              <Grid.Col key={hackathon.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Card 
                  withBorder 
                  radius="lg" 
                  h="100%" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/hackathons/${hackathon.id}`)}
                >
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

                    {/* Tags */}
                    <Group gap="xs">
                      {hackathon.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" size="xs">
                          {tag}
                        </Badge>
                      ))}
                      {hackathon.tags && hackathon.tags.length > 3 && (
                        <Badge variant="outline" size="xs" color="gray">
                          +{hackathon.tags.length - 3}
                        </Badge>
                      )}
                    </Group>

                    {/* Date Information */}
                    <Group gap="xs" c="dimmed" fz="sm">
                      <IconCalendar size={14} />
                      <Text size="xs">
                        {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                      </Text>
                      {hackathon.status === 'open' && getDaysUntilStart(hackathon.start_date) > 0 && (
                        <Badge size="xs" color="blue" variant="light">
                          Starts in {getDaysUntilStart(hackathon.start_date)} days
                        </Badge>
                      )}
                      {hackathon.status === 'running' && getDaysUntilEnd(hackathon.end_date) > 0 && (
                        <Badge size="xs" color="green" variant="light">
                          {getDaysUntilEnd(hackathon.end_date)} days left
                        </Badge>
                      )}
                    </Group>

                    {/* Participation Info */}
                    <Group gap="xs" c="dimmed" fz="sm">
                      <IconUsers size={14} />
                      <Text size="xs">
                        {hackathon.current_participants} / {hackathon.allowed_participants} participants
                      </Text>
                      {isHackathonFull(hackathon) && (
                        <Badge size="xs" color="red" variant="light">
                          Full
                        </Badge>
                      )}
                    </Group>

                    <Progress
                      value={getProgress(hackathon.current_participants, hackathon.allowed_participants)}
                      size="sm"
                      radius="xl"
                      color={isHackathonFull(hackathon) ? 'red' : 'blue'}
                    />

                    {/* Additional Stats */}
                    {hackathonStats[hackathon.id] && (
                      <Group gap="sm" fz="xs">
                        <Group gap="xs">
                          <IconUsers size={12} />
                          <Text size="xs" c="dimmed">
                            {hackathonStats[hackathon.id].teamCount} teams
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <IconBulb size={12} />
                          <Text size="xs" c="dimmed">
                            {hackathonStats[hackathon.id].ideaCount} ideas
                          </Text>
                        </Group>
                        {hackathonStats[hackathon.id].isUserParticipating && (
                          <Badge size="xs" color="green" variant="light">
                            <Group gap="xs">
                              <IconCheck size={10} />
                              <Text size="xs">Joined</Text>
                            </Group>
                          </Badge>
                        )}
                      </Group>
                    )}

                    {/* Prizes */}
                    {hackathon.prizes && hackathon.prizes.length > 0 && (
                      <Group gap="xs">
                        <IconTarget size={14} color="gold" />
                        <Text size="xs" fw={500} lineClamp={1}>
                          Prizes: {hackathon.prizes.join(', ')}
                        </Text>
                      </Group>
                    )}

                    {/* Footer */}
                    <Group justify="space-between" mt="auto">
                      <Group gap="xs">
                        <Avatar size="sm" radius="xl">
                          {hackathon.created_by?.charAt(0).toUpperCase() || 'H'}
                        </Avatar>
                        <Text size="xs" c="dimmed">
                          Created by Admin
                        </Text>
                      </Group>

                      <Group gap="xs">
                        {user && canJoinHackathon(hackathon) && (
                          <Tooltip label="Join Hackathon">
                            <ActionIcon
                              variant="filled"
                              size="sm"
                              color="green"
                              onClick={(e) => {
                                e.stopPropagation()
                                openJoinModalForHackathon(hackathon)
                              }}
                            >
                              <IconPlus size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        
                        <Tooltip label="View Details">
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
                        </Tooltip>
                        
                        {isManager && hackathon.created_by === user?.id && (
                          <Tooltip label="Edit Hackathon">
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
                          </Tooltip>
                        )}
                        
                        <Tooltip label="Share">
                          <ActionIcon
                            variant="light"
                            size="sm"
                            color="gray"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(`${window.location.origin}/hackathons/${hackathon.id}`)
                            }}
                          >
                            <IconShare size={14} />
                          </ActionIcon>
                        </Tooltip>
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
                {searchQuery || statusFilter || tagFilter.length > 0 || showMyHackathons
                  ? 'Try adjusting your search criteria'
                  : 'Be the first to create a hackathon!'}
              </Text>
              {isManager && !searchQuery && !statusFilter && tagFilter.length === 0 && !showMyHackathons && (
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

        {/* Join Hackathon Modal */}
        <Modal opened={joinModalOpened} onClose={closeJoinModal} title="Join Hackathon">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Enter the registration key for "{selectedHackathon?.title}" to join this hackathon.
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
