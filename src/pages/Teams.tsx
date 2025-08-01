import {
  ActionIcon,
  Avatar,
  Badge,
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
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { IdeaService, type IdeaWithDetails } from '../services/ideaService'
import { TeamService } from '../services/teamService'
import { TeamChatNew } from '../components/TeamChatNew'
import { TeamFileManagerNew } from '../components/TeamFileManagerNew'
import { TeamVideoCall } from '../components/TeamVideoCall'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { ProjectAttachments } from '../components/ProjectAttachments'
import type { ProjectAttachment } from '../store/hackathonStore'

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
const parseProjectData = (idea: IdeaWithDetails | null) => {
  if (idea) {
    return {
      repositoryUrl: idea.repository_url || '',
      demoUrl: idea.demo_url || '',
      projectAttachments: idea.project_attachments ? 
        JSON.parse(idea.project_attachments) : []
    }
  }
  return {
    repositoryUrl: '',
    demoUrl: '',
    projectAttachments: []
  }
}

export function Teams() {
  const { user } = useAuthStore()
  const { hackathons, teams, fetchHackathons, fetchTeams, joinTeam, updateTeam } = useHackathonStore()
  const [opened, { open, close }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [teamDetailOpened, { open: openTeamDetail, close: closeTeamDetail }] = useDisclosure(false)
  const [ideaDetailOpened, { open: openIdeaDetail, close: closeIdeaDetail }] = useDisclosure(false)
  const [selectedTeam, setSelectedTeam] = useState<typeof teams[0] | null>(null)
  const [selectedHackathon, setSelectedHackathon] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState<string[]>([])
  const [teamIdea, setTeamIdea] = useState<IdeaWithDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchHackathons()
  }, [fetchHackathons])

  useEffect(() => {
    // Only fetch teams for the selected hackathon
    if (selectedHackathon) {
      fetchTeams(selectedHackathon)
    }
  }, [selectedHackathon, fetchTeams])

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
    if (!selectedHackathon) {
      notifications.show({
        title: 'Error',
        message: 'Please select a hackathon first',
        color: 'red',
      })
      return
    }
    
    // Set the hackathon ID in the form
    form.setFieldValue('hackathonId', selectedHackathon)
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

    if (!selectedHackathon) {
      console.log('❌ Hackathon validation failed:', { selectedHackathon })
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
        hackathon_id: selectedHackathon, // Use selectedHackathon instead of values.hackathonId
        created_by: user.id,
        is_open: values.isOpen,
        skills: values.skills || []
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
          hackathon_id: selectedHackathon, // Use selectedHackathon instead of values.hackathonId
          category: values.ideaCategory || 'Other',
          tags: Array.isArray(values.ideaTags) 
            ? values.ideaTags
            : (values.ideaTags as string).split(',').map((tag: string) => tag.trim()).filter(Boolean),
          team_id: newTeam.id,
          created_by: user.id,
          repository_url: values.repositoryUrl,
          demo_url: values.demoUrl,
          project_attachments: values.projectAttachments
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
      fetchTeams(selectedHackathon) // Use selectedHackathon instead of values.hackathonId
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
      const ideas = await IdeaService.getTeamIdeas(team.id)
      if (ideas.length > 0) {
        ideaData = ideas[0] // Get the first (should be only) idea
        
        // Load project data from the proper database fields
        if (ideaData) {
          projectData = {
            repositoryUrl: ideaData.repository_url || '',
            demoUrl: ideaData.demo_url || '',
            projectAttachments: ideaData.project_attachments ? 
              JSON.parse(ideaData.project_attachments) : []
          }
          console.log('Loaded project data from database fields:', projectData)
        }
      }
    } catch (error) {
      console.error('Error fetching team idea:', error)
    }
    
    editForm.setValues({
      name: team.name,
      description: team.description,
      skills: team.skills || [],
      maxMembers: team.team_members.length, // Use current member count as max
      isOpen: team.is_open,
      hackathonId: team.hackathon_id,
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
        is_open: values.isOpen,
        skills: values.skills,
      }
      
      console.log('Updating team with data:', updateData)
      const result = await updateTeam(selectedTeam.id, updateData)
      console.log('Team update result:', result)
      
      // Update team's idea if idea fields are provided OR if we have project data to save
      if (values.ideaTitle || values.ideaDescription || values.repositoryUrl || values.demoUrl || values.projectAttachments.length > 0) {
        try {
          // First, get the existing idea
          const existingIdeas = await IdeaService.getTeamIdeas(selectedTeam.id)
          
          if (existingIdeas.length > 0) {
            // Update existing idea with project information
            const existingIdea = existingIdeas[0]
            
            // Only update idea fields if they have content
            const ideaUpdateData: {
              title?: string
              description?: string
              category?: string
              tags?: string[]
            } = {}
            if (values.ideaTitle) ideaUpdateData.title = values.ideaTitle
            if (values.ideaDescription) ideaUpdateData.description = values.ideaDescription
            if (values.ideaCategory) ideaUpdateData.category = values.ideaCategory
            if (values.ideaTags && values.ideaTags.length > 0) {
              ideaUpdateData.tags = Array.isArray(values.ideaTags) ? values.ideaTags : [values.ideaTags].filter(Boolean)
            }
            
            // Update the idea with basic fields if any exist
            if (Object.keys(ideaUpdateData).length > 0) {
              await IdeaService.updateIdea(existingIdea.id, ideaUpdateData)
              console.log('Updated idea with basic data:', ideaUpdateData)
            }
            
            // Update project info using the proper database fields
            await IdeaService.updateIdea(existingIdea.id, {
              repository_url: values.repositoryUrl || '',
              demo_url: values.demoUrl || '',
              project_attachments: values.projectAttachments || []
            })
            console.log('Updated project data in database fields:', {
              repository_url: values.repositoryUrl,
              demo_url: values.demoUrl,
              project_attachments: values.projectAttachments
            })
            
          } else if (values.ideaTitle && values.ideaDescription && values.ideaCategory) {
            // Create new idea only if we have the required fields
            const projectData = {
              repository_url: values.repositoryUrl || '',
              demo_url: values.demoUrl || '',
              project_attachments: values.projectAttachments || []
            }
            
            await IdeaService.createIdea({
              title: values.ideaTitle,
              description: values.ideaDescription,
              category: values.ideaCategory,
              tags: Array.isArray(values.ideaTags) ? values.ideaTags : [values.ideaTags].filter(Boolean),
              hackathon_id: values.hackathonId,
              created_by: user?.id || '',
              team_id: selectedTeam.id,
              status: 'submitted',
              repository_url: values.repositoryUrl,
              demo_url: values.demoUrl,
              project_attachments: values.projectAttachments,
            })
            console.log('Created new idea with project data in database fields')
            console.log('Created new idea with project data:', projectData)
          } else {
            console.log('No idea created - missing required fields (title, description, category)')
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
      if (selectedHackathon) {
        fetchTeams(selectedHackathon)
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

  const openTeamDetails = (team: typeof teams[0]) => {
    setSelectedTeam(team)
    // Fetch team's idea when team is selected
    fetchTeamIdea(team.id)
    openTeamDetail()
  }

  const fetchTeamIdea = async (teamId: string) => {
    try {
      const ideas = await IdeaService.getIdeas(selectedHackathon)
      const teamIdea = ideas.find(idea => idea.team_id === teamId)
      setTeamIdea(teamIdea || null)
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
      const isAlreadyMember = team?.team_members.some(member => member.user_id === user.id)
      
      if (isAlreadyMember) {
        notifications.show({
          title: 'Already a member',
          message: 'You are already a member of this team',
          color: 'yellow'
        })
        return
      }
      
      await joinTeam(teamId, user.id)
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
      const matchesHackathon = selectedHackathon === '' || team.hackathon_id === selectedHackathon
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           team.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSkills = skillFilter.length === 0 || 
                           skillFilter.some(skill => team.skills?.includes(skill))
      
      return matchesHackathon && matchesSearch && matchesSkills
    })
  }, [teams, selectedHackathon, searchQuery, skillFilter])

  const availableSkills = ['React', 'Python', 'JavaScript', 'TypeScript', 'AI/ML', 'Blockchain', 'IoT', 'UI/UX', 'Node.js', 'Vue.js', 'Security', 'Data Science']

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={1}>Teams</Title>
          <Text c="dimmed" size="lg" mt="xs">
            Join existing teams or create your own for hackathons
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="gradient"
          gradient={{ from: 'green', to: 'teal' }}
          onClick={handleCreateTeam}
          disabled={!selectedHackathon}
          title={!selectedHackathon ? "Please select a hackathon first" : "Create a new team"}
        >
          Create Team
        </Button>
      </Group>

      {/* Filters */}
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          {/* Hackathon Filter - Required */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Select Hackathon <Text span c="red">*</Text>
            </Text>
            <Select
              placeholder="Choose a hackathon to view teams"
              data={hackathons.map(h => ({ value: h.id, label: h.title }))}
              value={selectedHackathon}
              onChange={(value) => setSelectedHackathon(value || '')}
              size="md"
              required
            />
          </div>
          
          {/* Other Filters - Only show when hackathon is selected */}
          {selectedHackathon && (
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
          )}
        </Stack>
      </Card>

      {/* Teams Content */}
      {!selectedHackathon ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} variant="light" color="blue">
              <IconFilter style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Text ta="center" size="lg" fw={500}>
              Select a Hackathon
            </Text>
            <Text ta="center" c="dimmed">
              Please select a hackathon from the filter above to view its teams.
            </Text>
          </Stack>
        </Center>
      ) : filteredTeams.length > 0 ? (
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
                          color={team.is_open ? 'green' : 'gray'}
                          variant="light"
                          size="sm"
                        >
                          {team.is_open ? 'Open' : 'Closed'}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mb="sm">
                        {hackathons.find(h => h.id === team.hackathon_id)?.title || 'Hackathon Team'}
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
                      {team.team_members.length} members
                    </Text>
                  </Group>

                  {/* Team Members */}
                  <Group gap="xs">
                    {team.team_members.slice(0, 4).map((member) => (
                      <Group key={member.id} gap="xs">
                        <Avatar size="sm" radius="xl">
                          {member.profiles.name.charAt(0)}
                        </Avatar>
                        {member.role === 'leader' && (
                          <IconCrown size={12} color="gold" />
                        )}
                      </Group>
                    ))}
                    {team.team_members.length > 4 && (
                      <Text size="xs" c="dimmed">
                        +{team.team_members.length - 4} more
                      </Text>
                    )}
                  </Group>

                  {/* Skills */}
                  <Group gap="xs">
                    {team.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" size="xs">
                        {skill}
                      </Badge>
                    ))}
                    {team.skills.length > 3 && (
                      <Badge variant="outline" size="xs" c="dimmed">
                        +{team.skills.length - 3}
                      </Badge>
                    )}
                  </Group>

                  <Group justify="space-between" mt="auto">
                    {(() => {
                      const isUserMember = team.team_members.some(member => member.user_id === user?.id)
                      const isUserLeader = team.team_members.some(member => member.user_id === user?.id && member.role === 'leader')
                      
                      if (isUserMember) {
                        return (
                          <Button 
                            variant="filled" 
                            size="sm" 
                            style={{ flex: 1 }}
                            color="blue"
                            onClick={() => openTeamDetails(team)}
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
                          disabled={!team.is_open}
                          onClick={() => team.is_open ? handleJoinTeam(team.id) : undefined}
                        >
                          {team.is_open ? 'Join Team' : 'Closed'}
                        </Button>
                      )
                    })()}
                    
                    <Group gap="xs">
                      {/* Only show view button for team members */}
                      {team.team_members.some(member => member.user_id === user?.id) && (
                        <ActionIcon 
                          variant="light" 
                          size="sm"
                          onClick={() => openTeamDetails(team)}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      )}
                      {/* Only show edit button for team leaders */}
                      {team.team_members.some(m => m.user_id === user?.id && m.role === 'leader') && (
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
              {selectedTeam.team_members.some(member => member.user_id === user?.id) && (
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
                      <Badge color={selectedTeam.is_open ? 'green' : 'red'}>
                        {selectedTeam.is_open ? 'Open' : 'Closed'}
                      </Badge>
                    </Group>
                    <Text c="dimmed">{selectedTeam.description}</Text>
                    <Divider />
                    <Group>
                      <Text size="sm" fw={500}>Hackathon:</Text>
                      <Text size="sm">{hackathons.find(h => h.id === selectedTeam.hackathon_id)?.title || 'Unknown Hackathon'}</Text>
                    </Group>
                    <Group>
                      <Text size="sm" fw={500}>Team Size:</Text>
                      <Text size="sm">{selectedTeam.team_members.length}</Text>
                    </Group>
                    
                    {/* Join Team Button in Modal */}
                    {(() => {
                      const isUserMember = selectedTeam.team_members.some(member => member.user_id === user?.id)
                      
                      if (!isUserMember && selectedTeam.is_open) {
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
                    {selectedTeam.team_members.map((member: typeof selectedTeam.team_members[0], index: number) => (
                      <Group key={index} justify="space-between">
                        <Group>
                          <Avatar size="sm" radius="xl">
                            {member.profiles.name.charAt(0)}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>{member.profiles.name}</Text>
                            <Group gap="xs">
                              {member.profiles.skills.map((skill: string) => (
                                <Badge key={skill} size="xs" variant="light">
                                  {skill}
                                </Badge>
                              ))}
                            </Group>
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
                {!selectedTeam.team_members.some(member => member.user_id === user?.id) && (
                  <Paper withBorder p="md" radius="md">
                    <Stack gap="sm" align="center">
                      <Text c="dimmed" ta="center">
                        🔒 Join this team to access collaboration features like team chat, file sharing, and video calls
                      </Text>
                      {selectedTeam.is_open && (
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
                            Created: {new Date(teamIdea.created_at).toLocaleDateString()}
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
                      {selectedTeam.team_members.some(member => member.user_id === user?.id) && (
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
            {selectedTeam.team_members.some(member => member.user_id === user?.id) && (
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
                  {teamIdea.created_by?.slice(0, 2).toUpperCase() || 'U'}
                </Avatar>
                <Text size="sm">Created by: {teamIdea.profiles?.name || teamIdea.created_by}</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {new Date(teamIdea.created_at).toLocaleDateString()}
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
