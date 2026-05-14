import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Center,
  Divider,
  Grid,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Paper,
  rem,
  Select,
  Stack,
  Switch,
  Tabs,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconPlus,
  IconUsers,
  IconEdit,
  IconEye,
  IconCrown,
  IconSearch,
  IconFilter,
} from '@tabler/icons-react'
import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { IdeaService } from '../services/ideaService'
import type { Idea } from '../services/ideaService'
import { TeamService } from '../services/teamService'
import { TeamChatNew } from '../components/TeamChatNew'
import { TeamFileManagerNew } from '../components/TeamFileManagerNew'
import { TeamVideoCall } from '../components/TeamVideoCall'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { ProjectAttachments } from '../components/ProjectAttachments'
import type { ProjectAttachment } from '../components/ProjectAttachments'
import { PermissionService } from '../utils/permissions'
import { HackathonService } from '../services/hackathonService'

interface TeamForm {
  name: string
  description: string
  skills: string[]
  maxMembers: number
  isOpen: boolean
  hackathonId: string
  ideaTitle: string
  ideaDescription: string
  ideaCategory: string
  ideaTags: string[] | string
  repositoryUrl: string
  demoUrl: string
  projectAttachments: ProjectAttachment[]
}

// Helper function to parse project data from idea database fields
const parseProjectData = (idea: Idea | null) => {
  if (idea) {
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
  return {
    repositoryUrl: '',
    demoUrl: '',
    projectAttachments: [] as ProjectAttachment[],
  }
}

export function Teams() {
  const { id: routeHackathonId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const hackathonId = routeHackathonId ?? searchParams.get('hackathon') ?? undefined
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hackathons, teams, fetchHackathons, fetchTeams, joinTeam, updateTeam } = useHackathonStore()
  const [opened, { open, close }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [teamDetailOpened, { close: closeTeamDetail }] = useDisclosure(false)
  const [ideaDetailOpened, { open: openIdeaDetail, close: closeIdeaDetail }] = useDisclosure(false)
  const [selectedTeam, setSelectedTeam] = useState<typeof teams[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState<string[]>([])
  const [teamIdea, setTeamIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: contextHackathon } = useQuery({
    queryKey: ['hackathon', routeHackathonId],
    queryFn: () => HackathonService.getHackathon(routeHackathonId!),
    enabled: !!routeHackathonId,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    // Always fetch hackathons for selection
    fetchHackathons()
  }, [fetchHackathons])

  useEffect(() => {
    if (hackathonId) {
      fetchTeams(hackathonId)
    }
  }, [hackathonId, fetchTeams])

  const form = useForm<TeamForm>({
    initialValues: {
      name: '',
      description: '',
      skills: [],
      maxMembers: 4,
      isOpen: true,
      hackathonId: '',
      ideaTitle: '',
      ideaDescription: '',
      ideaCategory: '',
      ideaTags: [],
      repositoryUrl: '',
      demoUrl: '',
      projectAttachments: [],
    },
    validate: {
      name: (value) => (value.length < 3 ? 'Team name must be at least 3 characters' : null),
      description: (value) => (value.length < 10 ? 'Description must be at least 10 characters' : null),
      hackathonId: (value) => (!value ? 'Please select a hackathon' : null),
      // Make idea fields optional - only validate if they have content
      ideaTitle: (value) => (value && value.length > 0 && value.length < 5 ? 'Idea title must be at least 5 characters' : null),
      ideaDescription: (value) => (value && value.length > 0 && value.length < 20 ? 'Idea description must be at least 20 characters' : null),
      ideaCategory: () => null, // Make category optional
      // Add validation for project URLs
      repositoryUrl: (value) => {
        if (value && value.length > 0) {
          const urlPattern = /^https?:\/\/.+/
          return !urlPattern.test(value) ? 'Repository URL must be a valid URL (http:// or https://)' : null
        }
        return null
      },
      demoUrl: (value) => {
        if (value && value.length > 0) {
          const urlPattern = /^https?:\/\/.+/
          return !urlPattern.test(value) ? 'Demo URL must be a valid URL (http:// or https://)' : null
        }
        return null
      },
      // Validate project attachments array
      projectAttachments: (value) => {
        if (Array.isArray(value)) {
          for (const attachment of value) {
            if (!attachment.title || !attachment.url) {
              return 'All project attachments must have a title and URL'
            }
          }
        }
        return null
      },
    },
    // Add custom validation for conditional idea requirements
    transformValues: (values) => {
      // If any idea field is filled, we consider it an idea submission
      const hasIdeaContent = values.ideaTitle || values.ideaDescription || values.ideaCategory;
      return {
        ...values,
        hasIdeaContent
      };
    }
  })

  const editForm = useForm<TeamForm>({
    initialValues: {
      name: '',
      description: '',
      skills: [],
      maxMembers: 4,
      isOpen: true,
      hackathonId: '',
      ideaTitle: '',
      ideaDescription: '',
      ideaCategory: '',
      ideaTags: [],
      repositoryUrl: '',
      demoUrl: '',
      projectAttachments: [],
    },
    validate: {
      name: (value) => (value.length < 3 ? 'Team name must be at least 3 characters' : null),
      description: (value) => (value.length < 10 ? 'Description must be at least 10 characters' : null),
      // Add idea field validations for editing - optional but validate if content exists
      ideaTitle: (value) => (value && value.length > 0 && value.length < 5 ? 'Idea title must be at least 5 characters' : null),
      ideaDescription: (value) => (value && value.length > 0 && value.length < 20 ? 'Idea description must be at least 20 characters' : null),
      // Add validation for project URLs
      repositoryUrl: (value) => {
        if (value && value.length > 0) {
          const urlPattern = /^https?:\/\/.+/
          return !urlPattern.test(value) ? 'Repository URL must be a valid URL (http:// or https://)' : null
        }
        return null
      },
      demoUrl: (value) => {
        if (value && value.length > 0) {
          const urlPattern = /^https?:\/\/.+/
          return !urlPattern.test(value) ? 'Demo URL must be a valid URL (http:// or https://)' : null
        }
        return null
      },
      // Validate project attachments array
      projectAttachments: (value) => {
        if (Array.isArray(value)) {
          for (const attachment of value) {
            if (!attachment.title || !attachment.url) {
              return 'All project attachments must have a title and URL'
            }
          }
        }
        return null
      },
    },
  })

  const handleCreateTeam = () => {
    if (!hackathonId) {
      notifications.show({
        title: 'Error',
        message: 'Please select a hackathon first',
        color: 'red',
      })
      return
    }
    
    // Set the hackathon ID in the form
    form.setFieldValue('hackathonId', hackathonId)
    open()
  }

  const handleSubmit = async (values: TeamForm) => {
    console.log('🚀 Form submission started with values:', values)
    
    if (!user || !user.id) {
      console.log('❌ User validation failed:', { user })
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to create a team',
        color: 'red',
      })
      return
    }

    if (!hackathonId) {
      console.log('❌ Hackathon validation failed:', { hackathonId })
      notifications.show({
        title: 'Error',
        message: 'Please select a hackathon first',
        color: 'red',
      })
      return
    }

    console.log('✅ Basic validations passed, setting loading state')
    setLoading(true)
    try {
      // Validate required data
      if (!values.name || !values.description) {
        throw new Error('Team name and description are required')
      }
      
      if (!user.id || typeof user.id !== 'string') {
        throw new Error('Invalid user authentication')
      }
      
      const teamData = {
        name: values.name,
        description: values.description,
        hackathonId: hackathonId,
        skills: values.skills || [],
      }
      
      console.log('📝 Creating team with data:', teamData)
      
      // Use TeamService directly to create team and get the team back
      const newTeam = await TeamService.createTeam(teamData)
      console.log('✅ Team creation result:', newTeam)
      
      if (!newTeam) {
        throw new Error('Failed to create team - no result returned')
      }

      // Create the associated idea if provided
      if (values.ideaTitle && values.ideaTitle.trim()) {
        console.log('💡 Creating idea for team:', newTeam.id)
        await IdeaService.createIdea({
          title: values.ideaTitle,
          description: values.ideaDescription || '',
          hackathonId: hackathonId,
          category: values.ideaCategory || 'Other',
          tags: Array.isArray(values.ideaTags)
            ? values.ideaTags
            : (values.ideaTags as string).split(',').map((tag: string) => tag.trim()).filter(Boolean),
          teamId: newTeam.id,
        })
        console.log('✅ Idea created successfully')
      } else {
        console.log('ℹ️ No idea title provided, skipping idea creation')
      }
      
      notifications.show({
        title: 'Success',
        message: 'Team created successfully!',
        color: 'green',
      })
      
      close()
      form.reset()
      fetchTeams(hackathonId) // Use hackathonId instead of values.hackathonId
    } catch (error) {
      console.error('❌ Error creating team and idea:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create team. Please try again.',
        color: 'red',
      })
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
    }
  }

  const openTeamEdit = async (team: typeof teams[0]) => {
    setSelectedTeam(team)
    
    // Fetch team's idea if it exists
    let ideaData = null
    let projectData = {
      repositoryUrl: '',
      demoUrl: '',
      projectAttachments: [] as ProjectAttachment[]
    }
    
    try {
      const ideasPage = await IdeaService.getIdeas(team.hackathonId)
      const teamIdeas = ideasPage.content.filter(i => i.teamId === team.id)
      if (teamIdeas.length > 0) {
        ideaData = teamIdeas[0]

        if (ideaData) {
          projectData = parseProjectData(ideaData)
        }
      }
    } catch (error) {
      console.error('Error fetching team idea:', error)
    }

    editForm.setValues({
      name: team.name,
      description: team.description,
      skills: team.skills || [],
      maxMembers: team.members.length,
      isOpen: team.isOpen,
      hackathonId: team.hackathonId,
      ideaTitle: ideaData?.title || '',
      ideaDescription: ideaData?.description || '',
      ideaCategory: ideaData?.category || '',
      ideaTags: ideaData?.tags || [],
      repositoryUrl: projectData.repositoryUrl,
      demoUrl: projectData.demoUrl,
      projectAttachments: projectData.projectAttachments,
    })
    openEdit()
  }

  const handleEditSubmit = async (values: TeamForm) => {
    if (!selectedTeam) {
      console.error('No selected team for update')
      return
    }
    
    console.log('handleEditSubmit called with values:', values)
    console.log('selectedTeam:', selectedTeam)
    
    try {
      // Update team information
      const updateData = {
        name: values.name,
        description: values.description,
        skills: values.skills,
      }
      
      console.log('Updating team with data:', updateData)
      const result = await updateTeam(selectedTeam.id, updateData)
      console.log('Team update result:', result)
      
      // Update team's idea if idea fields are provided OR if we have project data to save
      if (values.ideaTitle || values.ideaDescription || values.repositoryUrl || values.demoUrl || values.projectAttachments.length > 0) {
        try {
          const ideasPage = await IdeaService.getIdeas(selectedTeam.hackathonId)
          const existingIdeas = ideasPage.content.filter(i => i.teamId === selectedTeam.id)

          if (existingIdeas.length > 0) {
            const existingIdea = existingIdeas[0]
            const ideaUpdateData: Partial<import('../services/ideaService').CreateIdeaInput> = {}
            if (values.ideaTitle) ideaUpdateData.title = values.ideaTitle
            if (values.ideaDescription) ideaUpdateData.description = values.ideaDescription
            if (values.ideaCategory) ideaUpdateData.category = values.ideaCategory
            if (values.ideaTags && values.ideaTags.length > 0) {
              ideaUpdateData.tags = Array.isArray(values.ideaTags) ? values.ideaTags : [values.ideaTags].filter(Boolean)
            }

            if (Object.keys(ideaUpdateData).length > 0) {
              await IdeaService.updateIdea(existingIdea.id, ideaUpdateData)
            }
          } else if (values.ideaTitle && values.ideaDescription && values.ideaCategory) {
            await IdeaService.createIdea({
              title: values.ideaTitle,
              description: values.ideaDescription,
              category: values.ideaCategory,
              tags: Array.isArray(values.ideaTags) ? values.ideaTags : [values.ideaTags].filter(Boolean),
              hackathonId: values.hackathonId,
              teamId: selectedTeam.id,
            })
          }
        } catch (ideaError) {
          console.error('Failed to update idea:', ideaError)
          notifications.show({
            title: 'Warning',
            message: 'Team updated but idea update failed: ' + (ideaError as Error).message,
            color: 'yellow'
          })
        }
      } else {
        console.log('No idea fields or project data to save')
      }
      
      closeEdit()
      editForm.reset()
      
      // Refresh team data
      if (hackathonId) {
        fetchTeams(hackathonId)
      }
      
      // Refresh idea data if team detail is open
      if (teamIdea) {
        fetchTeamIdea(selectedTeam.id)
      }
      
      notifications.show({
        title: 'Success!',
        message: 'Team and idea updated successfully',
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to update team:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to update team',
        color: 'red'
      })
    }
  }


  const fetchTeamIdea = async (teamId: string) => {
    try {
      const ideasPage = await IdeaService.getIdeas(hackathonId || '')
      const found = ideasPage.content.find(idea => idea.teamId === teamId)
      setTeamIdea(found ?? null)
    } catch (error) {
      console.error('Error fetching team idea:', error)
      setTeamIdea(null)
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    try {
      if (!user?.id) {
        notifications.show({
          title: 'Error',
          message: 'You must be logged in to join a team',
          color: 'red'
        })
        return
      }
      
      // Check if user is already a member
      const team = teams.find(t => t.id === teamId)
      const isAlreadyMember = (team?.members ?? []).some(member => member.userId === user.id)

      if (isAlreadyMember) {
        notifications.show({
          title: 'Already a member',
          message: 'You are already a member of this team',
          color: 'yellow'
        })
        return
      }

      await joinTeam(teamId)
      notifications.show({
        title: 'Success!',
        message: 'You have successfully joined the team',
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to join team:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to join team. Please try again.',
        color: 'red'
      })
    }
  }

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      if (!user) return false

      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (team.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSkills = skillFilter.length === 0 ||
                            skillFilter.some(skill => team.skills?.includes(skill))

      return matchesSearch && matchesSkills
    })
  }, [teams, searchQuery, skillFilter, user])

  const availableSkills = ['React', 'Python', 'JavaScript', 'TypeScript', 'AI/ML', 'Blockchain', 'IoT', 'UI/UX', 'Node.js', 'Vue.js', 'Security', 'Data Science']

  // If no hackathon is selected, show hackathon selection
  if (!hackathonId) {
    const visibleHackathons = user ? hackathons : []
    
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={1}>Teams</Title>
            <Text c="dimmed">Select a hackathon to view and manage teams</Text>
          </div>
        </Group>

        <Grid>
          {visibleHackathons.map((hackathon) => (
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
                    onClick={() => navigate(`/hackathons/${hackathon.id}/teams`)}
                    leftSection={<IconUsers size={16} />}
                    variant="light"
                  >
                    View Teams
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {visibleHackathons.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size={80} variant="light" color="blue">
                <IconUsers style={{ width: rem(40), height: rem(40) }} />
              </ThemeIcon>
              <Title order={3}>No Hackathons Available</Title>
              <Text c="dimmed" ta="center">
                {user?.role === 'admin' 
                  ? "No hackathons exist yet. Create the first one!" 
                  : user?.role === 'manager' 
                    ? "You haven't created any hackathons yet, or no hackathons are available to you."
                    : "There are no hackathons available to you. Contact an administrator."}
              </Text>
            </Stack>
          </Center>
        )}
      </Stack>
    )
  }

  const currentHackathon = hackathons.find(h => h.id === hackathonId)

  return (
    <Stack gap="lg">
      {routeHackathonId && contextHackathon && (
        <>
          <Breadcrumbs>
            <Anchor onClick={() => navigate('/hackathons')}>Hackathons</Anchor>
            <Anchor onClick={() => navigate(`/hackathons/${routeHackathonId}`)}>{contextHackathon.title}</Anchor>
            <Text>Teams</Text>
          </Breadcrumbs>
          <Button
            variant="subtle"
            size="sm"
            w="fit-content"
            onClick={() => navigate(`/hackathons/${routeHackathonId}`)}
          >
            &larr; Back to {contextHackathon.title}
          </Button>
        </>
      )}
      <Group justify="space-between">
        <div>
          <Title order={1}>Teams</Title>
          <Text c="dimmed" size="lg" mt="xs">
            {contextHackathon ? `Teams for ${contextHackathon.title}` : currentHackathon ? `Teams for ${currentHackathon.title}` : 'Teams'}
          </Text>
        </div>
        {/* Only show Create Team button if user has permission */}
        {user && PermissionService.isManagerOrAbove(user) && (
          <Button
            leftSection={<IconPlus size={16} />}
            variant="gradient"
            gradient={{ from: 'green', to: 'teal' }}
            onClick={handleCreateTeam}
          >
            Create Team
          </Button>
        )}
      </Group>

      {/* Filters */}
      <Card withBorder radius="md" p="md">
        <Group>
          <TextInput
            placeholder="Search teams..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <MultiSelect
            placeholder="Filter by skills"
            data={availableSkills}
            value={skillFilter}
            onChange={setSkillFilter}
            leftSection={<IconFilter size={16} />}
            w={200}
            clearable
          />
        </Group>
      </Card>

      {/* Teams Content */}
      {filteredTeams.length > 0 ? (
        <Grid>
          {filteredTeams.map((team) => (
            <Grid.Col key={team.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card withBorder radius="md" h="100%" p="lg">
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Text fw={600} size="lg" lineClamp={1}>
                          {team.name}
                        </Text>
                        <Badge
                          color={team.isOpen ? 'green' : 'gray'}
                          variant="light"
                          size="sm"
                        >
                          {team.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mb="sm">
                        {hackathons.find(h => h.id === team.hackathonId)?.title || 'Hackathon Team'}
                      </Text>
                    </div>
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {team.description}
                  </Text>

                  {/* Team Size */}
                  <Group gap="xs">
                    <IconUsers size={14} />
                    <Text size="sm">
                      {(team.members ?? []).length} members
                    </Text>
                  </Group>

                  {/* Team Members */}
                  <Group gap="xs">
                    {(team.members ?? []).slice(0, 4).map((member) => (
                      <Group key={member.id} gap="xs">
                        <Avatar size="sm" radius="xl">
                          {member.userId.substring(0, 1).toUpperCase()}
                        </Avatar>
                        {member.role === 'leader' && (
                          <IconCrown size={12} color="gold" />
                        )}
                      </Group>
                    ))}
                    {(team.members ?? []).length > 4 && (
                      <Text size="xs" c="dimmed">
                        +{(team.members ?? []).length - 4} more
                      </Text>
                    )}
                  </Group>

                  {/* Skills */}
                  <Group gap="xs">
                    {(team.skills ?? []).slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" size="xs">
                        {skill}
                      </Badge>
                    ))}
                    {(team.skills ?? []).length > 3 && (
                      <Badge variant="outline" size="xs" c="dimmed">
                        +{(team.skills ?? []).length - 3}
                      </Badge>
                    )}
                  </Group>

                  <Group justify="space-between" mt="auto">
                    {(() => {
                      const members = team.members ?? []
                      const isUserMember = members.some(member => member.userId === user?.id)
                      const isUserLeader = members.some(member => member.userId === user?.id && member.role === 'leader')

                      if (isUserMember) {
                        return (
                          <Button
                            variant="filled"
                            size="sm"
                            style={{ flex: 1 }}
                            color="blue"
                            onClick={() => navigate(`/teams/${team.id}`)}
                          >
                            {isUserLeader ? 'Manage Team' : 'View My Team'}
                          </Button>
                        )
                      }

                      return (
                        <Button
                          variant="light"
                          size="sm"
                          style={{ flex: 1 }}
                          disabled={!team.isOpen}
                          onClick={() => team.isOpen ? handleJoinTeam(team.id) : undefined}
                        >
                          {team.isOpen ? 'Join Team' : 'Closed'}
                        </Button>
                      )
                    })()}

                    <Group gap="xs">
                      {/* Only show view button for team members */}
                      {(team.members ?? []).some(member => member.userId === user?.id) && (
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => navigate(`/teams/${team.id}`)}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      )}
                      {/* Only show edit button if user is admin, manager, or team leader */}
                      {user && (
                        PermissionService.isManagerOrAbove(user) ||
                        (team.members ?? []).some(m => m.userId === user.id && m.role === 'leader')
                      ) && (
                        <ActionIcon 
                          variant="light" 
                          size="sm" 
                          color="blue"
                          onClick={() => openTeamEdit(team)}
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
            <ThemeIcon size={80} variant="light" color="green">
              <IconUsers style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Text ta="center" size="lg" fw={500}>
              No teams found
            </Text>
            <Text ta="center" c="dimmed">
              No teams found for the selected hackathon. Try adjusting your search criteria or create a new team.
            </Text>
            <Button
              variant="gradient"
              gradient={{ from: 'green', to: 'teal' }}
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateTeam}
            >
              Create Team
            </Button>
          </Stack>
        </Center>
      )}

      {/* Create Team Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Create New Team"
        size="lg"
      >
        <form onSubmit={form.onSubmit((values) => {
          console.log('🎯 Form onSubmit triggered with values:', values)
          console.log('🔍 Form validation state:', form.errors)
          console.log('🔗 Repository URL:', values.repositoryUrl)
          console.log('🌐 Demo URL:', values.demoUrl)
          console.log('📎 Project Attachments:', values.projectAttachments)
          handleSubmit(values)
        }, (errors) => {
          console.log('❌ Form validation failed with errors:', errors)
          notifications.show({
            title: 'Validation Error',
            message: 'Please fix the form errors before submitting',
            color: 'red',
          })
        })}>
          <Stack gap="md">
            <TextInput
              label="Team Name"
              placeholder="Enter a catchy team name"
              required
              {...form.getInputProps('name')}
            />

            <Textarea
              label="Description"
              placeholder="Describe your team's mission and goals"
              required
              minRows={3}
              {...form.getInputProps('description')}
            />

            <Select
              label="Hackathon"
              placeholder="Select which hackathon this team is for"
              required
              data={hackathons.map(h => ({ value: h.id, label: h.title }))}
              {...form.getInputProps('hackathonId')}
            />

            <MultiSelect
              label="Required Skills"
              placeholder="Select skills needed for your team"
              data={availableSkills}
              {...form.getInputProps('skills')}
            />

            <NumberInput
              label="Maximum Team Size"
              placeholder="How many members can join?"
              required
              min={2}
              max={10}
              {...form.getInputProps('maxMembers')}
            />

            <Switch
              label="Open for new members"
              description="Allow other participants to join your team"
              {...form.getInputProps('isOpen', { type: 'checkbox' })}
            />

            <Divider label="Team Idea" labelPosition="center" />

            <TextInput
              label="Idea Title"
              placeholder="What's your hackathon idea?"
              required
              {...form.getInputProps('ideaTitle')}
            />

            <MarkdownEditor
              label="Idea Description"
              required
              minRows={4}
              value={form.values.ideaDescription}
              onChange={(value) => form.setFieldValue('ideaDescription', value)}
            />

            <Select
              label="Idea Category"
              placeholder="Select a category for your idea"
              required
              data={[
                { value: 'Web Development', label: 'Web Development' },
                { value: 'Mobile App', label: 'Mobile App' },
                { value: 'AI/Machine Learning', label: 'AI/Machine Learning' },
                { value: 'IoT/Hardware', label: 'IoT/Hardware' },
                { value: 'Game Development', label: 'Game Development' },
                { value: 'Data Science', label: 'Data Science' },
                { value: 'Blockchain', label: 'Blockchain' },
                { value: 'DevOps/Infrastructure', label: 'DevOps/Infrastructure' },
                { value: 'Other', label: 'Other' }
              ]}
              {...form.getInputProps('ideaCategory')}
            />

            <TagsInput
              label="Idea Tags"
              placeholder="Add tags (e.g., react, python, api)"
              description="Add relevant technologies or keywords"
              {...form.getInputProps('ideaTags')}
            />

            <ProjectAttachments
              attachments={form.values.projectAttachments}
              onAttachmentsChange={(attachments) => form.setFieldValue('projectAttachments', attachments)}
              repositoryUrl={form.values.repositoryUrl}
              onRepositoryUrlChange={(url) => form.setFieldValue('repositoryUrl', url)}
              demoUrl={form.values.demoUrl}
              onDemoUrlChange={(url) => form.setFieldValue('demoUrl', url)}
              repositoryUrlError={form.errors.repositoryUrl as string}
              demoUrlError={form.errors.demoUrl as string}
              attachmentsError={form.errors.projectAttachments as string}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={close} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" leftSection={<IconUsers size={16} />} loading={loading}>
                Create Team
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title="Edit Team"
        size="md"
        padding="lg"
      >
        <form onSubmit={editForm.onSubmit((values) => {
          console.log('=== EDIT FORM SUBMISSION STARTED ===')
          console.log('Form values:', values)
          console.log('Form errors:', editForm.errors)
          console.log('Form isDirty:', editForm.isDirty())
          console.log('Form isValid:', editForm.isValid())
          console.log('Project attachments:', values.projectAttachments)
          console.log('Repository URL:', values.repositoryUrl)
          console.log('Demo URL:', values.demoUrl)
          console.log('=== CALLING handleEditSubmit ===')
          handleEditSubmit(values)
        }, (errors) => {
          console.log('=== EDIT FORM VALIDATION FAILED ===')
          console.log('Validation errors:', errors)
          notifications.show({
            title: 'Validation Error',
            message: 'Please check your form inputs: ' + Object.keys(errors).join(', '),
            color: 'red'
          })
        })}>
          <Stack gap="md">
            <TextInput
              label="Team Name"
              placeholder="Enter your team name"
              required
              {...editForm.getInputProps('name')}
            />

            <Textarea
              label="Description"
              placeholder="Describe your team's mission and goals"
              required
              minRows={3}
              {...editForm.getInputProps('description')}
            />

            <MultiSelect
              label="Required Skills"
              placeholder="What skills are you looking for?"
              data={availableSkills}
              {...editForm.getInputProps('skills')}
            />

            <Divider label="Team Idea" labelPosition="center" />

            <TextInput
              label="Idea Title"
              placeholder="Enter your team's idea title"
              {...editForm.getInputProps('ideaTitle')}
            />

            <MarkdownEditor
              label="Idea Description"
              minRows={4}
              value={editForm.values.ideaDescription}
              onChange={(value) => editForm.setFieldValue('ideaDescription', value)}
            />

            <Select
              label="Idea Category"
              placeholder="Select a category for your idea"
              data={[
                { value: 'Web Development', label: 'Web Development' },
                { value: 'Mobile App', label: 'Mobile App' },
                { value: 'AI/Machine Learning', label: 'AI/Machine Learning' },
                { value: 'IoT/Hardware', label: 'IoT/Hardware' },
                { value: 'Game Development', label: 'Game Development' },
                { value: 'Data Science', label: 'Data Science' },
                { value: 'Blockchain', label: 'Blockchain' },
                { value: 'DevOps/Infrastructure', label: 'DevOps/Infrastructure' },
                { value: 'Other', label: 'Other' }
              ]}
              {...editForm.getInputProps('ideaCategory')}
            />

            <TagsInput
              label="Idea Tags"
              placeholder="Enter tags (press Enter to add)"
              description="Add relevant technologies or keywords"
              {...editForm.getInputProps('ideaTags')}
            />

            <ProjectAttachments
              attachments={editForm.values.projectAttachments}
              onAttachmentsChange={(attachments) => editForm.setFieldValue('projectAttachments', attachments)}
              repositoryUrl={editForm.values.repositoryUrl}
              onRepositoryUrlChange={(url) => editForm.setFieldValue('repositoryUrl', url)}
              demoUrl={editForm.values.demoUrl}
              onDemoUrlChange={(url) => editForm.setFieldValue('demoUrl', url)}
              repositoryUrlError={editForm.errors.repositoryUrl as string}
              demoUrlError={editForm.errors.demoUrl as string}
              attachmentsError={editForm.errors.projectAttachments as string}
            />

            <Switch
              label="Open for new members"
              description="Allow other participants to join your team"
              {...editForm.getInputProps('isOpen', { type: 'checkbox' })}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeEdit}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                leftSection={<IconEdit size={16} />}
              >
                Update Team
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Team Detail Modal */}
      <Modal
        opened={teamDetailOpened}
        onClose={closeTeamDetail}
        title={selectedTeam ? `${selectedTeam.name} - Team Details` : 'Team Details'}
        size="xl"
        padding="lg"
      >
        {selectedTeam && (
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="idea">Team Idea</Tabs.Tab>
              {/* Only show collaboration tabs for team members */}
              {(selectedTeam.members ?? []).some(member => member.userId === user?.id) && (
                <>
                  <Tabs.Tab value="chat">Team Chat</Tabs.Tab>
                  <Tabs.Tab value="files">Files</Tabs.Tab>
                  <Tabs.Tab value="video">Video Call</Tabs.Tab>
                </>
              )}
            </Tabs.List>

            <Tabs.Panel value="overview" pt="lg">
              <Stack gap="md">
                <Paper withBorder p="md" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Title order={4}>{selectedTeam.name}</Title>
                      <Badge color={selectedTeam.isOpen ? 'green' : 'red'}>
                        {selectedTeam.isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </Group>
                    <Text c="dimmed">{selectedTeam.description}</Text>
                    <Divider />
                    <Group>
                      <Text size="sm" fw={500}>Hackathon:</Text>
                      <Text size="sm">{hackathons.find(h => h.id === selectedTeam.hackathonId)?.title || 'Unknown Hackathon'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" fw={500}>Team Size:</Text>
                      <Text size="sm">{(selectedTeam.members ?? []).length}</Text>
                    </Group>
                    
                    {/* Join Team Button in Modal */}
                    {(() => {
                      const isUserMember = (selectedTeam.members ?? []).some(member => member.userId === user?.id)
                      
                      if (!isUserMember && selectedTeam.isOpen) {
                        return (
                          <Button 
                            onClick={() => handleJoinTeam(selectedTeam.id)}
                            leftSection={<IconUsers size={16} />}
                          >
                            Join This Team
                          </Button>
                        )
                      }
                      
                      if (isUserMember) {
                        return (
                          <Badge color="blue" variant="light" size="lg">
                            You are a member of this team
                          </Badge>
                        )
                      }
                      
                      return null
                    })()}
                  </Stack>
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Title order={5} mb="sm">Team Members</Title>
                  <Stack gap="xs">
                    {selectedTeam.members.map((member, index: number) => (
                      <Group key={index} justify="space-between">
                        <Group>
                          <Avatar size="sm" radius="xl">
                            {member.userId.substring(0, 1).toUpperCase()}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>{member.userId.substring(0, 8)}</Text>
                          </div>
                        </Group>
                        <Badge variant="light" color={member.role === 'leader' ? 'blue' : 'gray'}>
                          {member.role}
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Title order={5} mb="sm">Required Skills</Title>
                  <Group gap="xs">
                    {selectedTeam.skills.map((skill: string) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </Group>
                </Paper>

                {/* Show collaboration note for non-members */}
                {!(selectedTeam.members ?? []).some(member => member.userId === user?.id) && (
                  <Paper withBorder p="md" radius="md">
                    <Stack gap="sm" align="center">
                      <Text c="dimmed" ta="center">
                        🔒 Join this team to access collaboration features like team chat, file sharing, and video calls
                      </Text>
                      {selectedTeam.isOpen && (
                        <Button 
                          onClick={() => handleJoinTeam(selectedTeam.id)}
                          leftSection={<IconUsers size={16} />}
                          variant="light"
                        >
                          Join This Team
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="idea" pt="lg">
              <Stack gap="md">
                {teamIdea ? (
                  <Paper withBorder p="md" radius="md">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Title order={4}>{teamIdea.title}</Title>
                        <Group gap="xs">
                          <Badge variant="light" color="green" size="sm">
                            Team: {selectedTeam.name}
                          </Badge>
                          <Badge color="blue">{teamIdea.category}</Badge>
                        </Group>
                      </Group>
                      
                      <MarkdownRenderer enableScroll={true} maxHeight="30vh">
                        {teamIdea.description}
                      </MarkdownRenderer>

                      {/* Project Attachments - Read-only display */}
                      <ProjectAttachments
                        attachments={parseProjectData(teamIdea).projectAttachments}
                        onAttachmentsChange={() => {}} // Read-only
                        repositoryUrl={parseProjectData(teamIdea).repositoryUrl}
                        onRepositoryUrlChange={() => {}} // Read-only
                        demoUrl={parseProjectData(teamIdea).demoUrl}
                        onDemoUrlChange={() => {}} // Read-only
                        readonly={true}
                      />

                      {teamIdea.tags && teamIdea.tags.length > 0 && (
                        <>
                          <Divider />
                          <Group>
                            <Text size="sm" fw={500}>Tags:</Text>
                            <Group gap="xs">
                              {teamIdea.tags.map((tag: string) => (
                                <Badge key={tag} variant="outline" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </Group>
                          </Group>
                        </>
                      )}

                      <Divider />
                      <Group justify="space-between">
                        <Group>
                          <Text size="sm" c="dimmed">
                            Created: {new Date(teamIdea.createdAt).toLocaleDateString()}
                          </Text>
                          <Group gap="xs">
                            <Text size="sm" c="dimmed">Status:</Text>
                            <Badge size="sm" color={teamIdea.status === 'submitted' ? 'green' : 'yellow'}>
                              {teamIdea.status}
                            </Badge>
                          </Group>
                        </Group>
                        <Button
                          variant="light"
                          size="sm"
                          leftSection={<IconEye size={16} />}
                          onClick={() => openIdeaDetail()}
                        >
                          View Details
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>
                ) : (
                  <Paper withBorder p="md" radius="md">
                    <Stack gap="sm" align="center">
                      <Text c="dimmed" ta="center">
                        💡 This team hasn't submitted an idea yet
                      </Text>
                      {(selectedTeam.members ?? []).some(member => member.userId === user?.id) && (
                        <Text size="sm" c="dimmed" ta="center">
                          Team members can create an idea by creating a new team or updating this team's information
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Only show collaboration tab panels for team members */}
            {(selectedTeam.members ?? []).some(member => member.userId === user?.id) && (
              <>
                <Tabs.Panel value="chat" pt="lg">
                  <TeamChatNew teamId={selectedTeam.id} />
                </Tabs.Panel>

                <Tabs.Panel value="files" pt="lg">
                  <TeamFileManagerNew teamId={selectedTeam.id} />
                </Tabs.Panel>

                <Tabs.Panel value="video" pt="lg">
                  <TeamVideoCall teamId={selectedTeam.id} teamName={selectedTeam.name} />
                </Tabs.Panel>
              </>
            )}
          </Tabs>
        )}
      </Modal>

      {/* Idea Details Modal */}
      <Modal
        opened={ideaDetailOpened}
        onClose={closeIdeaDetail}
        title={teamIdea ? `Idea Details: ${teamIdea.title}` : 'Idea Details'}
        size="lg"
      >
        {teamIdea && selectedTeam && (
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>{teamIdea.title}</Title>
              <Group gap="xs">
                <Badge variant="light" color="green" size="sm">
                  Team: {selectedTeam.name}
                </Badge>
                <Badge color="blue">{teamIdea.category}</Badge>
              </Group>
            </Group>

            <MarkdownRenderer enableScroll={true} maxHeight="40vh">
              {teamIdea.description}
            </MarkdownRenderer>

            {/* Project Attachments - Read-only display */}
            <ProjectAttachments
              attachments={parseProjectData(teamIdea).projectAttachments}
              onAttachmentsChange={() => {}} // Read-only
              repositoryUrl={parseProjectData(teamIdea).repositoryUrl}
              onRepositoryUrlChange={() => {}} // Read-only
              demoUrl={parseProjectData(teamIdea).demoUrl}
              onDemoUrlChange={() => {}} // Read-only
              readonly={true}
            />

            {teamIdea.tags && teamIdea.tags.length > 0 && (
              <Group gap="xs">
                <Text size="sm" fw={500}>Tags:</Text>
                {teamIdea.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" size="xs">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}

            <Group justify="space-between">
              <Group gap="xs">
                <Avatar size="sm" radius="xl">
                  {teamIdea.createdBy?.slice(0, 2).toUpperCase() || 'U'}
                </Avatar>
                <Text size="sm">Created by: {teamIdea.createdBy}</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {new Date(teamIdea.createdAt).toLocaleDateString()}
              </Text>
            </Group>

            <Group justify="space-between" pt="md">
              <Group gap="xs">
                <Text size="sm" c="dimmed">Status:</Text>
                <Badge size="sm" color={teamIdea.status === 'submitted' ? 'green' : 'yellow'}>
                  {teamIdea.status}
                </Badge>
              </Group>
              <Button variant="light" onClick={closeIdeaDetail}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
