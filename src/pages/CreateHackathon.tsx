import {
  Stack,
  Title,
  Text,
  Card,
  TextInput,
  Textarea,
  Button,
  Group,
  Grid,
  NumberInput,
  Select,
  Switch,
  FileInput,
  Divider,
  Badge,
  ActionIcon,
  Paper,
  MultiSelect,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import {
  IconCalendar,
  IconUsers,
  IconTrophy,
  IconUpload,
  IconPlus,
  IconX,
  IconInfoCircle,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useForm } from '@mantine/form'
import { useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { useHackathonStore } from '../store/hackathonStore'
import { useAuthStore } from '../store/authStore'

interface HackathonForm {
  title: string
  description: string
  startDate: Date | null
  endDate: Date | null
  registrationKey: string
  maxTeamSize: number
  allowedParticipants: number
  rules: string
  prizes: string[]
  tags: string[]
  category: string
  isPublic: boolean
  allowLateRegistration: boolean
  requireApproval: boolean
}

export function CreateHackathon() {
  const navigate = useNavigate()
  const { createHackathon } = useHackathonStore()
  const { user } = useAuthStore()
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [currentPrize, setCurrentPrize] = useState('')

  const form = useForm<HackathonForm>({
    initialValues: {
      title: '',
      description: '',
      startDate: null,
      endDate: null,
      registrationKey: '',
      maxTeamSize: 5,
      allowedParticipants: 100,
      rules: '',
      prizes: [],
      tags: [],
      category: '',
      isPublic: true,
      allowLateRegistration: false,
      requireApproval: false,
    },
    validate: {
      title: (value) => (value.length < 5 ? 'Title must be at least 5 characters' : null),
      description: (value) => (value.length < 20 ? 'Description must be at least 20 characters' : null),
      startDate: (value) => (!value ? 'Start date is required' : null),
      endDate: (value, values) => {
        if (!value) return 'End date is required'
        if (values.startDate && value <= values.startDate) {
          return 'End date must be after start date'
        }
        return null
      },
      registrationKey: (value) => (value.length < 6 ? 'Registration key must be at least 6 characters' : null),
      maxTeamSize: (value) => (value < 1 || value > 10 ? 'Team size must be between 1 and 10' : null),
      allowedParticipants: (value) => (value < 1 ? 'Must allow at least 1 participant' : null),
    },
  })

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    form.setFieldValue('registrationKey', result)
  }

  const addPrize = () => {
    if (currentPrize.trim()) {
      form.setFieldValue('prizes', [...form.values.prizes, currentPrize.trim()])
      setCurrentPrize('')
    }
  }

  const removePrize = (index: number) => {
    form.setFieldValue('prizes', form.values.prizes.filter((_, i) => i !== index))
  }

  const handleSubmit = (values: HackathonForm) => {
    // Convert dates to ISO strings, ensuring they're valid Date objects
    const startDate = values.startDate instanceof Date ? values.startDate : new Date(values.startDate!)
    const endDate = values.endDate instanceof Date ? values.endDate : new Date(values.endDate!)
    
    const newHackathon = {
      title: values.title,
      description: values.description,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      registration_key: values.registrationKey,
      status: 'draft' as const,
      max_team_size: values.maxTeamSize,
      allowed_participants: values.allowedParticipants,
      created_by: user?.id || '1',
      rules: values.rules,
      prizes: values.prizes,
      tags: values.tags,
      banner_url: bannerFile ? URL.createObjectURL(bannerFile) : undefined,
    }

    createHackathon(newHackathon)

    notifications.show({
      title: 'Hackathon Created!',
      message: 'Your hackathon has been created successfully. Share the registration key with participants.',
      color: 'green',
    })

    navigate('/hackathons')
  }

  return (
    <Stack gap="lg" maw={800} mx="auto">
      <div>
        <Title order={1}>Create New Hackathon</Title>
        <Text c="dimmed" size="lg" mt="xs">
          Set up your hackathon event and invite participants to innovate
        </Text>
      </div>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Basic Information */}
          <Card withBorder radius="md" p="lg">
            <Title order={3} mb="md">Basic Information</Title>
            
            <Stack gap="md">
              <TextInput
                label="Hackathon Title"
                placeholder="e.g., AI Innovation Challenge 2024"
                required
                {...form.getInputProps('title')}
              />

              <Textarea
                label="Description"
                placeholder="Describe your hackathon, its goals, and what participants can expect..."
                required
                minRows={4}
                {...form.getInputProps('description')}
              />

              <Select
                label="Category"
                placeholder="Select a category"
                data={[
                  { value: 'ai-ml', label: 'AI & Machine Learning' },
                  { value: 'web-dev', label: 'Web Development' },
                  { value: 'mobile', label: 'Mobile Development' },
                  { value: 'blockchain', label: 'Blockchain' },
                  { value: 'iot', label: 'Internet of Things' },
                  { value: 'gaming', label: 'Gaming' },
                  { value: 'fintech', label: 'FinTech' },
                  { value: 'health', label: 'Healthcare' },
                  { value: 'education', label: 'Education' },
                  { value: 'sustainability', label: 'Sustainability' },
                  { value: 'open', label: 'Open Category' },
                ]}
                {...form.getInputProps('category')}
              />

              <MultiSelect
                label="Tags"
                placeholder="Add relevant tags"
                data={[
                  'React', 'Python', 'JavaScript', 'TypeScript', 'AI', 'ML',
                  'Blockchain', 'IoT', 'Mobile', 'Web', 'API', 'Frontend',
                  'Backend', 'Fullstack', 'DevOps', 'Cloud', 'Database'
                ]}
                searchable
                {...form.getInputProps('tags')}
              />

              <FileInput
                label="Banner Image"
                placeholder="Upload a banner for your hackathon"
                accept="image/*"
                leftSection={<IconUpload size={14} />}
                value={bannerFile}
                onChange={setBannerFile}
              />
            </Stack>
          </Card>

          {/* Timeline */}
          <Card withBorder radius="md" p="lg">
            <Group mb="md">
              <IconCalendar size={20} />
              <Title order={3}>Timeline</Title>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DateTimePicker
                  label="Start Date & Time"
                  placeholder="When does the hackathon start?"
                  required
                  minDate={new Date()}
                  {...form.getInputProps('startDate')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DateTimePicker
                  label="End Date & Time"
                  placeholder="When does the hackathon end?"
                  required
                  minDate={form.values.startDate || new Date()}
                  {...form.getInputProps('endDate')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Participants & Teams */}
          <Card withBorder radius="md" p="lg">
            <Group mb="md">
              <IconUsers size={20} />
              <Title order={3}>Participants & Teams</Title>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Maximum Participants"
                  placeholder="How many participants can join?"
                  required
                  min={1}
                  max={10000}
                  {...form.getInputProps('allowedParticipants')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Maximum Team Size"
                  placeholder="Max members per team"
                  required
                  min={1}
                  max={10}
                  {...form.getInputProps('maxTeamSize')}
                />
              </Grid.Col>
            </Grid>

            <Stack gap="sm" mt="md">
              <Switch
                label="Allow late registration"
                description="Participants can join after the hackathon starts"
                {...form.getInputProps('allowLateRegistration', { type: 'checkbox' })}
              />
              <Switch
                label="Require approval"
                description="Manually approve participant registrations"
                {...form.getInputProps('requireApproval', { type: 'checkbox' })}
              />
              <Switch
                label="Public hackathon"
                description="Make this hackathon discoverable publicly"
                {...form.getInputProps('isPublic', { type: 'checkbox' })}
              />
            </Stack>
          </Card>

          {/* Registration Key */}
          <Card withBorder radius="md" p="lg">
            <Group mb="md">
              <IconInfoCircle size={20} />
              <Title order={3}>Registration Key</Title>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
              Participants will need this key to register for your hackathon. Keep it secure and share only with intended participants.
            </Text>

            <Group>
              <TextInput
                placeholder="Enter or generate a registration key"
                required
                style={{ flex: 1 }}
                {...form.getInputProps('registrationKey')}
              />
              <Button variant="outline" onClick={generateRandomKey}>
                Generate Random
              </Button>
            </Group>
          </Card>

          {/* Prizes */}
          <Card withBorder radius="md" p="lg">
            <Group mb="md">
              <IconTrophy size={20} />
              <Title order={3}>Prizes & Rewards</Title>
            </Group>

            <Group mb="md">
              <TextInput
                placeholder="Enter prize (e.g., $5,000 Grand Prize)"
                value={currentPrize}
                onChange={(event) => setCurrentPrize(event.currentTarget.value)}
                style={{ flex: 1 }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addPrize()
                  }
                }}
              />
              <Button onClick={addPrize} leftSection={<IconPlus size={14} />}>
                Add Prize
              </Button>
            </Group>

            {form.values.prizes.length > 0 && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Prizes:</Text>
                {form.values.prizes.map((prize, index) => (
                  <Paper key={index} p="xs" withBorder>
                    <Group justify="space-between">
                      <Badge variant="light">{prize}</Badge>
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="subtle"
                        onClick={() => removePrize(index)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>

          {/* Rules & Guidelines */}
          <Card withBorder radius="md" p="lg">
            <Title order={3} mb="md">Rules & Guidelines</Title>
            
            <Textarea
              label="Hackathon Rules"
              placeholder="Define the rules, guidelines, and criteria for your hackathon..."
              minRows={6}
              description="Be clear about submission requirements, judging criteria, and any restrictions"
              {...form.getInputProps('rules')}
            />
          </Card>

          <Divider />

          {/* Actions */}
          <Group justify="space-between">
            <Button variant="subtle" onClick={() => navigate('/hackathons')}>
              Cancel
            </Button>
            <Group>
              <Button variant="outline" type="submit">
                Save as Draft
              </Button>
              <Button
                type="submit"
                leftSection={<IconTrophy size={16} />}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Create Hackathon
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
