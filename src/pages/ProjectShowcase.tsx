import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Grid,
  ActionIcon,
  Avatar,
  ThemeIcon,
  Select,
  TextInput,
  SimpleGrid,
  Modal,
  Center,
} from '@mantine/core'
import {
  IconTrophy,
  IconHeart,
  IconHeartFilled,
  IconBrandGithub,
  IconWorldWww,
  IconSearch,
  IconUsers,
  IconExternalLink,
} from '@tabler/icons-react'
import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { useRealtime } from '../contexts/RealtimeContext'
import { notifications } from '@mantine/notifications'

interface Project {
  id: string
  title: string
  description: string
  team_name: string
  team_members: Array<{
    id: string
    name: string
    avatar?: string
    role?: string
  }>
  hackathon_id: string
  hackathon_name: string
  category: string
  technologies: string[]
  github_url?: string
  demo_url?: string
  video_url?: string
  images: string[]
  votes: number
  user_vote?: boolean
  prize_position?: number
  status: 'submitted' | 'judging' | 'completed'
  created_at: string
  submission_date: string
}

interface ProjectFilters {
  search: string
  category: string
  technology: string
  prizeOnly: boolean
}

export function ProjectShowcase() {
  const { user } = useAuthStore()
  const { isConnected } = useRealtime()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [modalOpened, setModalOpened] = useState(false)
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    category: '',
    technology: '',
    prizeOnly: false,
  })

  // Mock data - in real implementation, this would come from your service
  const mockProjects: Project[] = [
    {
      id: '1',
      title: 'AI-Powered Code Review Assistant',
      description: 'An intelligent tool that analyzes code quality, suggests improvements, and detects potential bugs using machine learning.',
      team_name: 'Code Wizards',
      team_members: [
        { id: '1', name: 'Alice Johnson', avatar: '', role: 'Full Stack Developer' },
        { id: '2', name: 'Bob Chen', avatar: '', role: 'AI Engineer' },
        { id: '3', name: 'Carol Davis', avatar: '', role: 'UI/UX Designer' },
      ],
      hackathon_id: '1',
      hackathon_name: 'AI Innovation Challenge 2025',
      category: 'AI/ML',
      technologies: ['Python', 'TensorFlow', 'React', 'Node.js'],
      github_url: 'https://github.com/example/ai-code-review',
      demo_url: 'https://demo.ai-code-review.com',
      images: ['/api/placeholder/800/400'],
      votes: 247,
      user_vote: false,
      prize_position: 1,
      status: 'completed',
      created_at: '2025-07-15T10:00:00Z',
      submission_date: '2025-07-20T23:59:00Z',
    },
    {
      id: '2',
      title: 'EcoTrack - Carbon Footprint Calculator',
      description: 'A comprehensive platform for tracking and reducing personal and corporate carbon footprints with gamification.',
      team_name: 'Green Innovators',
      team_members: [
        { id: '4', name: 'David Wilson', avatar: '', role: 'Environmental Scientist' },
        { id: '5', name: 'Eva Martinez', avatar: '', role: 'Frontend Developer' },
      ],
      hackathon_id: '2',
      hackathon_name: 'Climate Tech Hackathon',
      category: 'Sustainability',
      technologies: ['Vue.js', 'Python', 'PostgreSQL', 'Chart.js'],
      github_url: 'https://github.com/example/eco-track',
      demo_url: 'https://ecotrack-demo.com',
      images: ['/api/placeholder/800/400'],
      votes: 189,
      user_vote: true,
      prize_position: 2,
      status: 'completed',
      created_at: '2025-07-10T10:00:00Z',
      submission_date: '2025-07-18T23:59:00Z',
    },
    {
      id: '3',
      title: 'BlockChain Supply Chain Tracker',
      description: 'Transparent supply chain management using blockchain technology to ensure product authenticity and ethical sourcing.',
      team_name: 'Chain Masters',
      team_members: [
        { id: '6', name: 'Frank Zhang', avatar: '', role: 'Blockchain Developer' },
        { id: '7', name: 'Grace Kim', avatar: '', role: 'Backend Developer' },
        { id: '8', name: 'Henry Brown', avatar: '', role: 'Product Manager' },
      ],
      hackathon_id: '3',
      hackathon_name: 'Blockchain Innovation Week',
      category: 'Blockchain',
      technologies: ['Solidity', 'Ethereum', 'React', 'Web3.js'],
      github_url: 'https://github.com/example/supply-chain-tracker',
      demo_url: 'https://supply-chain-demo.com',
      images: ['/api/placeholder/800/400'],
      votes: 156,
      user_vote: false,
      status: 'completed',
      created_at: '2025-07-05T10:00:00Z',
      submission_date: '2025-07-12T23:59:00Z',
    },
  ]

  useEffect(() => {
    // Simulate API call
    const loadProjects = async () => {
      setLoading(true)
      try {
        // In real implementation: const projects = await ProjectService.getProjects()
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
        setProjects(mockProjects)
      } catch (error) {
        console.error('Error loading projects:', error)
        notifications.show({
          title: 'Error',
          message: 'Failed to load projects',
          color: 'red',
        })
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, []) // mockProjects is static, so safe to omit

  const handleVote = async (projectId: string) => {
    if (!user) {
      notifications.show({
        title: 'Login Required',
        message: 'Please log in to vote for projects',
        color: 'orange',
      })
      return
    }

    try {
      // In real implementation: await ProjectService.voteProject(projectId)
      setProjects(prev => prev.map(project => {
        if (project.id === projectId) {
          const newVoteState = !project.user_vote
          return {
            ...project,
            user_vote: newVoteState,
            votes: newVoteState ? project.votes + 1 : project.votes - 1,
          }
        }
        return project
      }))

      notifications.show({
        title: 'Vote Recorded',
        message: 'Thank you for your vote!',
        color: 'green',
      })
    } catch (error) {
      console.error('Error voting:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to record vote',
        color: 'red',
      })
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                           project.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                           project.team_name.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesCategory = !filters.category || project.category === filters.category
      const matchesTechnology = !filters.technology || project.technologies.includes(filters.technology)
      const matchesPrize = !filters.prizeOnly || project.prize_position
      
      return matchesSearch && matchesCategory && matchesTechnology && matchesPrize
    })
  }, [projects, filters])

  const categories = ['AI/ML', 'Blockchain', 'IoT', 'FinTech', 'HealthTech', 'EdTech', 'Sustainability', 'Gaming']
  const technologies = ['React', 'Vue.js', 'Python', 'Node.js', 'TensorFlow', 'Blockchain', 'IoT', 'Docker']

  const getPrizeIcon = (position?: number) => {
    if (!position) return null
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32'] // Gold, Silver, Bronze
    return (
      <ThemeIcon size="sm" variant="filled" style={{ backgroundColor: colors[position - 1] }}>
        <IconTrophy size={12} />
      </ThemeIcon>
    )
  }

  const openProjectModal = (project: Project) => {
    setSelectedProject(project)
    setModalOpened(true)
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} mb="xs">
                Project Showcase
              </Title>
              <Text c="dimmed" size="lg">
                Discover amazing projects built during hackathons
              </Text>
            </div>
            {/* Real-time connection indicator */}
            {user && (
              <Group gap="xs">
                <div 
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isConnected ? '#51cf66' : '#fa5252',
                    marginTop: 8
                  }}
                />
                <Text size="xs" c="dimmed">
                  {isConnected ? 'Live' : 'Offline'}
                </Text>
              </Group>
            )}
          </Group>
        </div>

        {/* Filters */}
        <Card withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                placeholder="Search projects..."
                leftSection={<IconSearch size={16} />}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                placeholder="Category"
                data={categories}
                value={filters.category}
                onChange={(value) => setFilters(prev => ({ ...prev, category: value || '' }))}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                placeholder="Technology"
                data={technologies}
                value={filters.technology}
                onChange={(value) => setFilters(prev => ({ ...prev, technology: value || '' }))}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Button
                variant={filters.prizeOnly ? 'filled' : 'light'}
                onClick={() => setFilters(prev => ({ ...prev, prizeOnly: !prev.prizeOnly }))}
                leftSection={<IconTrophy size={16} />}
                fullWidth
              >
                Winners Only
              </Button>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Projects Grid */}
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} withBorder h={400} p="lg">
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text c="dimmed">Loading...</Text>
                </div>
              </Card>
            ))
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Card key={project.id} withBorder p="lg" style={{ cursor: 'pointer' }} onClick={() => openProjectModal(project)}>
                <Stack gap="md">
                  {/* Project Header */}
                  <Group justify="space-between">
                    <Group>
                      <Title order={4} lineClamp={1}>{project.title}</Title>
                      {getPrizeIcon(project.prize_position)}
                    </Group>
                    <ActionIcon
                      variant={project.user_vote ? 'filled' : 'light'}
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVote(project.id)
                      }}
                    >
                      {project.user_vote ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                    </ActionIcon>
                  </Group>

                  {/* Image Placeholder */}
                  <div style={{ height: 160, backgroundColor: '#f8f9fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text c="dimmed" size="sm">Project Screenshot</Text>
                  </div>

                  {/* Description */}
                  <Text size="sm" c="dimmed" lineClamp={3}>
                    {project.description}
                  </Text>

                  {/* Team & Hackathon */}
                  <div>
                    <Group gap="xs" mb="xs">
                      <IconUsers size={14} />
                      <Text size="sm" fw={500}>{project.team_name}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">{project.hackathon_name}</Text>
                  </div>

                  {/* Technologies */}
                  <Group gap="xs">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <Badge key={tech} size="xs" variant="light">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge size="xs" variant="outline">
                        +{project.technologies.length - 3}
                      </Badge>
                    )}
                  </Group>

                  {/* Footer */}
                  <Group justify="space-between" mt="auto">
                    <Group gap="xs">
                      <IconHeart size={14} />
                      <Text size="sm">{project.votes}</Text>
                    </Group>
                    <Group gap="xs">
                      {project.github_url && (
                        <ActionIcon variant="light" size="sm" onClick={(e) => e.stopPropagation()}>
                          <IconBrandGithub size={14} />
                        </ActionIcon>
                      )}
                      {project.demo_url && (
                        <ActionIcon variant="light" size="sm" onClick={(e) => e.stopPropagation()}>
                          <IconWorldWww size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                </Stack>
              </Card>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              <Center py="xl">
                <Stack align="center">
                  <ThemeIcon size={60} variant="light" color="gray">
                    <IconTrophy size={30} />
                  </ThemeIcon>
                  <Text c="dimmed">No projects found matching your filters</Text>
                </Stack>
              </Center>
            </div>
          )}
        </SimpleGrid>
      </Stack>

      {/* Project Detail Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={selectedProject?.title}
        size="xl"
      >
        {selectedProject && (
          <Stack gap="md">
            {/* Project Image */}
            <div style={{ height: 300, backgroundColor: '#f8f9fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text c="dimmed">Project Screenshot/Demo</Text>
            </div>

            {/* Description */}
            <Text>{selectedProject.description}</Text>

            {/* Team Members */}
            <div>
              <Title order={5} mb="sm">Team Members</Title>
              <Group>
                {selectedProject.team_members.map((member) => (
                  <Group key={member.id} gap="xs">
                    <Avatar size="sm" />
                    <div>
                      <Text size="sm" fw={500}>{member.name}</Text>
                      {member.role && <Text size="xs" c="dimmed">{member.role}</Text>}
                    </div>
                  </Group>
                ))}
              </Group>
            </div>

            {/* Technologies */}
            <div>
              <Title order={5} mb="sm">Technologies Used</Title>
              <Group>
                {selectedProject.technologies.map((tech) => (
                  <Badge key={tech} variant="light">
                    {tech}
                  </Badge>
                ))}
              </Group>
            </div>

            {/* Links */}
            <Group>
              {selectedProject.github_url && (
                <Button
                  component="a"
                  href={selectedProject.github_url}
                  target="_blank"
                  leftSection={<IconBrandGithub size={16} />}
                  variant="light"
                >
                  View Code
                </Button>
              )}
              {selectedProject.demo_url && (
                <Button
                  component="a"
                  href={selectedProject.demo_url}
                  target="_blank"
                  leftSection={<IconExternalLink size={16} />}
                  variant="light"
                >
                  Live Demo
                </Button>
              )}
            </Group>

            {/* Vote Button */}
            <Button
              fullWidth
              leftSection={selectedProject.user_vote ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
              variant={selectedProject.user_vote ? 'filled' : 'light'}
              color="red"
              onClick={() => handleVote(selectedProject.id)}
            >
              {selectedProject.user_vote ? 'Voted' : 'Vote'} ({selectedProject.votes})
            </Button>
          </Stack>
        )}
      </Modal>
    </Container>
  )
}
