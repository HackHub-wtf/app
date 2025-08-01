import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  TextInput,
  Textarea,
  Group,
  Button,
  NumberInput,
  MultiSelect,
  Select,
  Switch,
  Alert,
  Grid,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { DatePickerInput } from '@mantine/dates'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { HackathonService } from '../services/hackathonService'
import { notifications } from '@mantine/notifications'

const commonTags = [
  'AI/ML', 'Web Development', 'Mobile Apps', 'Blockchain', 'IoT', 'AR/VR',
  'Data Science', 'Cybersecurity', 'DevOps', 'Cloud Computing', 'Gaming',
  'Fintech', 'Healthcare', 'Education', 'Social Impact', 'Open Source'
]

export default function HackathonForm() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createHackathon } = useHackathonStore()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      max_team_size: 4,
      allowed_participants: 100,
      tags: [] as string[],
      prizes: [''],
      rules: `# Hackathon Rules & Guidelines

## Eligibility
- Open to all developers, designers, and innovators
- Teams can have 1-${4} members
- All skill levels welcome

## Submission Requirements
- Working prototype or demo
- Source code repository (GitHub preferred)
- 3-minute pitch video
- Documentation explaining your solution

## Judging Criteria
- Innovation and creativity (30%)
- Technical implementation (25%)
- Impact and potential (25%)
- Presentation quality (20%)

## Code of Conduct
- Respect all participants
- No harassment or discrimination
- Original work only (external APIs/libraries allowed)
- Have fun and learn!`,
      banner_url: '',
      status: 'draft' as 'draft' | 'open' | 'running' | 'completed',
      auto_generate_key: true,
      registration_key: '',
    },
    validate: {
      title: (value) => (value.length < 3 ? 'Title must be at least 3 characters' : null),
      description: (value) => (value.length < 10 ? 'Description must be at least 10 characters' : null),
      start_date: (value) => (!value ? 'Start date is required' : null),
      end_date: (value, values) => {
        if (!value) return 'End date is required'
        if (values.start_date && new Date(value) <= new Date(values.start_date)) {
          return 'End date must be after start date'
        }
        return null
      },
      max_team_size: (value) => (value < 1 || value > 10 ? 'Team size must be between 1 and 10' : null),
      allowed_participants: (value) => (value < 1 ? 'Must allow at least 1 participant' : null),
      registration_key: (value, values) => {
        if (!values.auto_generate_key && !value.trim()) {
          return 'Registration key is required when not auto-generating'
        }
        return null
      },
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return

    setLoading(true)
    try {
      const registrationKey = values.auto_generate_key 
        ? HackathonService.generateRegistrationKey() 
        : values.registration_key

      const hackathonData = {
        title: values.title,
        description: values.description,
        start_date: values.start_date,
        end_date: values.end_date,
        registration_key: registrationKey,
        status: values.status,
        max_team_size: values.max_team_size,
        allowed_participants: values.allowed_participants,
        created_by: user.id,
        banner_url: values.banner_url || undefined,
        rules: values.rules || undefined,
        prizes: values.prizes.filter(prize => prize.trim() !== ''),
        tags: values.tags,
      }

      await createHackathon(hackathonData)
      
      notifications.show({
        title: 'Success!',
        message: 'Hackathon created successfully',
        color: 'green',
      })

      navigate('/hackathons')
    } catch (err) {
      console.error('Error creating hackathon:', err)
      notifications.show({
        title: 'Error',
        message: 'Failed to create hackathon',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const addPrize = () => {
    form.setFieldValue('prizes', [...form.values.prizes, ''])
  }

  const removePrize = (index: number) => {
    const newPrizes = form.values.prizes.filter((_, i) => i !== index)
    form.setFieldValue('prizes', newPrizes)
  }

  const updatePrize = (index: number, value: string) => {
    const newPrizes = [...form.values.prizes]
    newPrizes[index] = value
    form.setFieldValue('prizes', newPrizes)
  }

  if (!user || user.role !== 'manager') {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          You don't have permission to create hackathons. Only managers can create hackathons.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Create New Hackathon</Title>
          <Text c="dimmed" size="lg" mt="xs">
            Set up an exciting coding challenge for your community
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
                  minRows={3}
                  required
                  {...form.getInputProps('description')}
                />

                <TextInput
                  label="Banner Image URL"
                  placeholder="https://example.com/banner.jpg"
                  {...form.getInputProps('banner_url')}
                />

                <MultiSelect
                  label="Tags & Categories"
                  placeholder="Select relevant tags"
                  data={commonTags}
                  searchable
                  {...form.getInputProps('tags')}
                />
              </Stack>
            </Card>

            {/* Schedule & Settings */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Schedule & Settings</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DatePickerInput
                    label="Start Date & Time"
                    placeholder="Pick start date and time"
                    required
                    valueFormat="YYYY-MM-DD HH:mm"
                    {...form.getInputProps('start_date')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DatePickerInput
                    label="End Date & Time"
                    placeholder="Pick end date and time"
                    required
                    valueFormat="YYYY-MM-DD HH:mm"
                    {...form.getInputProps('end_date')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    label="Maximum Team Size"
                    description="Maximum number of members per team"
                    min={1}
                    max={10}
                    required
                    {...form.getInputProps('max_team_size')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    label="Maximum Participants"
                    description="Total number of participants allowed"
                    min={1}
                    required
                    {...form.getInputProps('allowed_participants')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Select
                    label="Initial Status"
                    description="You can change this later"
                    data={[
                      { value: 'draft', label: 'Draft - Not visible to participants' },
                      { value: 'open', label: 'Open - Registration available' },
                    ]}
                    required
                    {...form.getInputProps('status')}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Registration */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Registration Settings</Title>
              <Stack gap="md">
                <Switch
                  label="Auto-generate registration key"
                  description="Automatically create a unique registration key"
                  {...form.getInputProps('auto_generate_key', { type: 'checkbox' })}
                />

                {!form.values.auto_generate_key && (
                  <TextInput
                    label="Custom Registration Key"
                    placeholder="e.g., HACKATHON2024"
                    description="Participants will need this key to join"
                    required
                    {...form.getInputProps('registration_key')}
                  />
                )}
              </Stack>
            </Card>

            {/* Prizes */}
            <Card withBorder radius="md" p="lg">
              <Group justify="space-between" mb="md">
                <Title order={3}>Prizes & Awards</Title>
                <Button variant="light" size="sm" onClick={addPrize}>
                  Add Prize
                </Button>
              </Group>
              <Stack gap="md">
                {form.values.prizes.map((prize, index) => (
                  <Group key={index} gap="sm">
                    <TextInput
                      placeholder={`Prize #${index + 1} (e.g., $1000 Grand Prize)`}
                      style={{ flex: 1 }}
                      value={prize}
                      onChange={(e) => updatePrize(index, e.target.value)}
                    />
                    {form.values.prizes.length > 1 && (
                      <Button
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => removePrize(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </Group>
                ))}
              </Stack>
            </Card>

            {/* Rules */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Rules & Guidelines</Title>
              <Textarea
                label="Hackathon Rules"
                description="Markdown formatting supported"
                placeholder="Enter hackathon rules and guidelines..."
                minRows={10}
                {...form.getInputProps('rules')}
              />
            </Card>

            {/* Submit */}
            <Group justify="flex-end">
              <Button variant="light" onClick={() => navigate('/hackathons')}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconCheck size={16} />}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Create Hackathon
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
