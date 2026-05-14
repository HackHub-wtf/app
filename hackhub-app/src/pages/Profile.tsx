import {
  Stack,
  Title,
  Text,
  Card,
  Grid,
  Group,
  Avatar,
  Button,
  TextInput,
  Textarea,
  Badge,
  Switch,
  Select,
  Paper,
  Divider,
  ThemeIcon,
  rem,
} from '@mantine/core'
import {
  IconUser,
  IconSettings,
  IconTrophy,
  IconUsers,
  IconBulb,
  IconEdit,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useForm } from '@mantine/form'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'

interface ProfileForm {
  name: string
  email: string
  bio: string
  skills: string
  githubUsername: string
  linkedinUrl: string
}

export function Profile() {
  const { user, updateProfile } = useAuthStore()
  const [editMode, setEditMode] = useState(false)
  const [notifications_enabled, setNotificationsEnabled] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)

  const form = useForm<ProfileForm>({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: 'Passionate developer interested in AI and sustainable technology.',
      skills: 'React, TypeScript, Python, Machine Learning',
      githubUsername: '',
      linkedinUrl: '',
    },
  })

  const handleSaveProfile = (values: ProfileForm) => {
    updateProfile({
      name: values.name,
      email: values.email,
    })
    
    notifications.show({
      title: 'Profile updated',
      message: 'Your profile has been saved successfully',
      color: 'green',
    })
    
    setEditMode(false)
  }

  const mockStats = {
    hackathonsParticipated: 6,
    teamsJoined: 8,
    ideasSubmitted: 12,
    votesReceived: 142,
  }

  const statsCards = [
    {
      title: 'Hackathons',
      value: mockStats.hackathonsParticipated,
      icon: IconTrophy,
      color: 'blue',
    },
    {
      title: 'Teams',
      value: mockStats.teamsJoined,
      icon: IconUsers,
      color: 'green',
    },
    {
      title: 'Ideas',
      value: mockStats.ideasSubmitted,
      icon: IconBulb,
      color: 'yellow',
    },
    {
      title: 'Votes',
      value: mockStats.votesReceived,
      icon: IconTrophy,
      color: 'red',
    },
  ]

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={1}>Profile</Title>
          <Text c="dimmed" size="lg" mt="xs">
            Manage your account and preferences
          </Text>
        </div>
        <Button
          leftSection={<IconEdit size={16} />}
          variant={editMode ? 'subtle' : 'light'}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </Button>
      </Group>

      <Grid>
        {/* Profile Information */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder radius="md" p="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <Group>
                  <Avatar size={80} radius="xl" src={user?.avatar}>
                    {user?.name?.charAt(0)}
                  </Avatar>
                  <div>
                    <Text fw={600} size="xl">
                      {user?.name}
                    </Text>
                    <Text c="dimmed">
                      {user?.email}
                    </Text>
                    <Badge variant="light" color="blue" mt="xs">
                      {user?.role}
                    </Badge>
                  </div>
                </Group>
              </Group>

              <Divider />

              <form onSubmit={form.onSubmit(handleSaveProfile)}>
                <Stack gap="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Full Name"
                        disabled={!editMode}
                        {...form.getInputProps('name')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Email"
                        disabled={!editMode}
                        {...form.getInputProps('email')}
                      />
                    </Grid.Col>
                  </Grid>

                  <Textarea
                    label="Bio"
                    placeholder="Tell us about yourself"
                    disabled={!editMode}
                    minRows={3}
                    {...form.getInputProps('bio')}
                  />

                  <TextInput
                    label="Skills"
                    placeholder="e.g., React, Python, AI/ML"
                    description="Separate skills with commas"
                    disabled={!editMode}
                    {...form.getInputProps('skills')}
                  />

                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="GitHub Username"
                        placeholder="your-username"
                        disabled={!editMode}
                        {...form.getInputProps('githubUsername')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="LinkedIn URL"
                        placeholder="https://linkedin.com/in/your-profile"
                        disabled={!editMode}
                        {...form.getInputProps('linkedinUrl')}
                      />
                    </Grid.Col>
                  </Grid>

                  {editMode && (
                    <Group justify="flex-end">
                      <Button type="submit">
                        Save Changes
                      </Button>
                    </Group>
                  )}
                </Stack>
              </form>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Stats Sidebar */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Activity Stats */}
            <Card withBorder radius="md" p="lg">
              <Group justify="space-between" mb="md">
                <Text fw={600} size="lg">
                  Activity Stats
                </Text>
                <ThemeIcon variant="light" size="sm">
                  <IconUser size={16} />
                </ThemeIcon>
              </Group>

              <Stack gap="md">
                {statsCards.map((stat) => (
                  <Paper key={stat.title} p="sm" withBorder radius="sm">
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" c="dimmed">
                          {stat.title}
                        </Text>
                        <Text fw={600} size="xl">
                          {stat.value}
                        </Text>
                      </div>
                      <ThemeIcon
                        color={stat.color}
                        variant="light"
                        size="md"
                      >
                        <stat.icon style={{ width: rem(16), height: rem(16) }} />
                      </ThemeIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Card>

            {/* Settings */}
            <Card withBorder radius="md" p="lg">
              <Group justify="space-between" mb="md">
                <Text fw={600} size="lg">
                  Preferences
                </Text>
                <ThemeIcon variant="light" size="sm">
                  <IconSettings size={16} />
                </ThemeIcon>
              </Group>

              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      Push Notifications
                    </Text>
                    <Text size="xs" c="dimmed">
                      Get notified about updates
                    </Text>
                  </div>
                  <Switch
                    checked={notifications_enabled}
                    onChange={(event) => setNotificationsEnabled(event.currentTarget.checked)}
                  />
                </Group>

                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      Email Updates
                    </Text>
                    <Text size="xs" c="dimmed">
                      Receive email notifications
                    </Text>
                  </div>
                  <Switch
                    checked={emailUpdates}
                    onChange={(event) => setEmailUpdates(event.currentTarget.checked)}
                  />
                </Group>

                <Select
                  label="Default Hackathon Filter"
                  data={[
                    { value: 'all', label: 'All Hackathons' },
                    { value: 'open', label: 'Open for Registration' },
                    { value: 'running', label: 'Currently Running' },
                  ]}
                  defaultValue="all"
                />
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
