import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Grid,
  Avatar,
  Badge,
  ActionIcon,
  ThemeIcon,
  rem,
  Center,
  Modal,
  TextInput,
  Textarea,
  MultiSelect,
  Switch,
  NumberInput,
  Select,
  Tabs,
  Paper,
  Divider,
} from '@mantine/core'
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
import { useRealtime } from '../contexts/RealtimeContext'
import { TeamService, type TeamWithMembers } from '../services/teamService'
import { TeamChat } from '../components/TeamChat'
import { TeamFileManager } from '../components/TeamFileManager'
import { TeamVideoCall } from '../components/TeamVideoCall'

interface TeamForm {
  name: string
  description: string
  skills: string[]
  maxMembers: number
  isOpen: boolean
  hackathonId: string
}

export function Teams() {
  const { user } = useAuthStore()
  const { hackathons, teams, fetchHackathons, createTeam } = useHackathonStore()
  const [opened, { open, close }] = useDisclosure(false)
  const [teamDetailOpened, { open: openTeamDetail, close: closeTeamDetail }] = useDisclosure(false)
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState<string[]>([])

  useEffect(() => {
    fetchHackathons()
  }, [fetchHackathons])

  const form = useForm<TeamForm>({
    initialValues: {
      name: '',
      description: '',
      skills: [],
      maxMembers: 4,
      isOpen: true,
      hackathonId: '',
    },
    validate: {
      name: (value) => (value.length < 3 ? 'Team name must be at least 3 characters' : null),
      description: (value) => (value.length < 10 ? 'Description must be at least 10 characters' : null),
      hackathonId: (value) => (!value ? 'Please select a hackathon' : null),
    },
  })

  const handleSubmit = async (values: TeamForm) => {
    try {
      const teamData = {
        name: values.name,
        description: values.description,
        hackathon_id: values.hackathonId,
        created_by: user?.id || '',
        is_open: values.isOpen,
        skills: values.skills,
      }
      await createTeam(teamData)
      close()
      form.reset()
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const openTeamDetails = (team: any) => {
    setSelectedTeam(team)
    openTeamDetail()
  }

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           team.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSkills = skillFilter.length === 0 || 
                           skillFilter.some(skill => team.skills?.includes(skill))
      
      return matchesSearch && matchesSkills
    })
  }, [teams, searchQuery, skillFilter])

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
          onClick={open}
        >
          Create Team
        </Button>
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

      {/* Teams Grid */}
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
                          color={team.is_open ? 'green' : 'gray'}
                          variant="light"
                          size="sm"
                        >
                          {team.is_open ? 'Open' : 'Closed'}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mb="sm">
                        Hackathon Team
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
                    <Button 
                      variant="light" 
                      size="sm" 
                      style={{ flex: 1 }}
                      disabled={!team.is_open}
                      onClick={() => openTeamDetails(team)}
                    >
                      {team.is_open ? 'Join Team' : 'View Team'}
                    </Button>
                    
                    <Group gap="xs">
                      <ActionIcon 
                        variant="light" 
                        size="sm"
                        onClick={() => openTeamDetails(team)}
                      >
                        <IconEye size={14} />
                      </ActionIcon>
                      {team.team_members.some(m => m.profiles.name === user?.name && m.role === 'leader') && (
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
            <ThemeIcon size={80} variant="light" color="green">
              <IconUsers style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Text ta="center" size="lg" fw={500}>
              No teams found
            </Text>
            <Text ta="center" c="dimmed">
              Try adjusting your search criteria or create a new team.
            </Text>
            <Button
              variant="gradient"
              gradient={{ from: 'green', to: 'teal' }}
              leftSection={<IconPlus size={16} />}
              onClick={open}
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
        <form onSubmit={form.onSubmit(handleSubmit)}>
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

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" leftSection={<IconUsers size={16} />}>
                Create Team
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
              <Tabs.Tab value="chat">Team Chat</Tabs.Tab>
              <Tabs.Tab value="files">Files</Tabs.Tab>
              <Tabs.Tab value="video">Video Call</Tabs.Tab>
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
                      <Text size="sm">Current Hackathon</Text>
                    </Group>
                    <Group>
                      <Text size="sm" fw={500}>Team Size:</Text>
                      <Text size="sm">{selectedTeam.team_members.length}</Text>
                    </Group>
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
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="chat" pt="lg">
              <TeamChat teamId={selectedTeam.id} teamName={selectedTeam.name} />
            </Tabs.Panel>

            <Tabs.Panel value="files" pt="lg">
              <TeamFileManager teamId={selectedTeam.id} teamName={selectedTeam.name} />
            </Tabs.Panel>

            <Tabs.Panel value="video" pt="lg">
              <TeamVideoCall teamId={selectedTeam.id} teamName={selectedTeam.name} />
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>
    </Stack>
  )
}
