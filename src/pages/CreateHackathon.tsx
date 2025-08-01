import { useState } from 'react'
import {
  Container,
  Paper,
  Title,
  TextInput,
  Textarea,
  Button,
  Group,
  Select,
  NumberInput,
  Grid,
  Text,
  Stack,
  Badge,
  ActionIcon,
  Switch,
  Divider,
  Alert
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { DateTimePicker } from '@mantine/dates'
import { IconPlus, IconTrash, IconKey, IconInfoCircle } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router-dom'
import { HackathonService } from '../services/hackathonService'
import { useAuthStore } from '../store/authStore'

const CreateHackathon = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [prizes, setPrizes] = useState<string[]>([])
  const [registrationKey, setRegistrationKey] = useState('')

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      allowed_participants: 100,
      max_team_size: 4,
      require_registration_key: false,
      status: 'draft' as const,
      tags: [] as string[],
      banner_url: '',
      rulesText: ''
    },
    validate: {
      title: (value) => (!value ? 'Title is required' : null),
      description: (value) => (!value ? 'Description is required' : null),
      start_date: (value) => {
        if (!value) return 'Start date is required'
        const date = value instanceof Date ? value : new Date(value)
        if (isNaN(date.getTime())) return 'Invalid start date'
        return null
      },
      end_date: (value, values) => {
        if (!value) return 'End date is required'
        
        // Convert both dates to Date objects for comparison
        const endDate = value instanceof Date ? value : new Date(value)
        const startDate = values.start_date instanceof Date ? values.start_date : new Date(values.start_date)
        
        if (isNaN(endDate.getTime())) return 'Invalid end date'
        if (isNaN(startDate.getTime())) return 'Invalid start date'
        
        if (endDate <= startDate) return 'End date must be after start date'
        return null
      },
      allowed_participants: (value) => {
        if (!value || value < 1) return 'Must allow at least 1 participant'
        if (value > 10000) return 'Maximum 10,000 participants allowed'
        return null
      },
      max_team_size: (value) => {
        if (!value || value < 2) return 'Team size must be at least 2'
        if (value > 20) return 'Maximum team size is 20'
        return null
      }
    }
  })

  const generateRegistrationKey = () => {
    const key = HackathonService.generateRegistrationKey()
    setRegistrationKey(key)
    form.setFieldValue('require_registration_key', true)
  }

  const addPrize = () => {
    const newPrize = `Prize ${prizes.length + 1}`
    setPrizes([...prizes, newPrize])
  }

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index))
  }

  const updatePrize = (index: number, value: string) => {
    const updatedPrizes = [...prizes]
    updatedPrizes[index] = value
    setPrizes(updatedPrizes)
  }

  const handleSubmit = async (values: typeof form.values) => {
    if (!user || !user.id) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to create a hackathon',
        color: 'red'
      })
      return
    }

    setLoading(true)
    try {
      // Ensure dates are Date objects before calling toISOString()
      let startDate: Date
      let endDate: Date
      
      try {
        startDate = values.start_date instanceof Date ? values.start_date : new Date(values.start_date)
        endDate = values.end_date instanceof Date ? values.end_date : new Date(values.end_date)
        
        // Validate that the dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date values')
        }
      } catch {
        notifications.show({
          title: 'Error',
          message: 'Invalid date format. Please check your date selections.',
          color: 'red'
        })
        setLoading(false)
        return
      }

      const hackathonData = {
        title: values.title,
        description: values.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        allowed_participants: values.allowed_participants,
        max_team_size: values.max_team_size,
        registration_key: values.require_registration_key ? registrationKey : HackathonService.generateRegistrationKey(),
        prizes: prizes.length > 0 ? prizes : [],
        rules: values.rulesText || undefined,
        status: values.status,
        created_by: user.id,
        tags: values.tags || [],
        banner_url: values.banner_url || undefined
      }

      console.log('Creating hackathon with data:', hackathonData)
      const result = await HackathonService.createHackathon(hackathonData)
      console.log('Hackathon creation result:', result)
      
      if (result) {
        notifications.show({
          title: 'Success',
          message: 'Hackathon created successfully!',
          color: 'green'
        })

        navigate(`/hackathons/${result.id}`)
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to create hackathon - no result returned.',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Error creating hackathon:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create hackathon. Please try again.',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" radius="md" p="xl">
        <Title order={2} mb="xl">Create New Hackathon</Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Title"
                placeholder="Enter hackathon title"
                required
                {...form.getInputProps('title')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Description"
                placeholder="Describe your hackathon"
                minRows={4}
                required
                {...form.getInputProps('description')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateTimePicker
                label="Start Date"
                placeholder="Select start date and time"
                required
                {...form.getInputProps('start_date')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateTimePicker
                label="End Date"
                placeholder="Select end date and time"
                required
                {...form.getInputProps('end_date')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <NumberInput
                label="Maximum Participants"
                placeholder="Enter max participants"
                min={1}
                max={10000}
                required
                {...form.getInputProps('allowed_participants')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <NumberInput
                label="Maximum Team Size"
                placeholder="Enter max team size"
                min={2}
                max={20}
                required
                {...form.getInputProps('max_team_size')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label="Status"
                data={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'open', label: 'Open' },
                  { value: 'running', label: 'Running' },
                  { value: 'completed', label: 'Completed' }
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Banner URL"
                placeholder="Optional banner image URL"
                {...form.getInputProps('banner_url')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Divider my="md" />
              <Group justify="space-between" mb="md">
                <Text fw={500}>Registration Settings</Text>
              </Group>

              <Group mb="md">
                <Switch
                  label="Require Registration Key"
                  description="Participants need a key to register"
                  {...form.getInputProps('require_registration_key', { type: 'checkbox' })}
                />
                <Button
                  variant="light"
                  leftSection={<IconKey size={16} />}
                  onClick={generateRegistrationKey}
                >
                  Generate Key
                </Button>
              </Group>

              {(form.values.require_registration_key || registrationKey) && (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
                  <Text size="sm" fw={500} mb={4}>Registration Key:</Text>
                  <Badge variant="filled" size="lg">{registrationKey}</Badge>
                  <Text size="xs" c="dimmed" mt={4}>
                    Share this key with participants to allow registration
                  </Text>
                </Alert>
              )}
            </Grid.Col>

            <Grid.Col span={12}>
              <Divider my="md" />
              <Group justify="space-between" mb="md">
                <Text fw={500}>Prizes</Text>
                <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addPrize}>
                  Add Prize
                </Button>
              </Group>

              <Stack gap="md">
                {prizes.map((prize, index) => (
                  <Group key={index}>
                    <TextInput
                      placeholder={`Prize ${index + 1}`}
                      value={prize}
                      onChange={(e) => updatePrize(index, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removePrize(index)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Grid.Col>

            <Grid.Col span={12}>
              <Divider my="md" />
              <Text fw={500} mb="md">Rules & Guidelines</Text>
              <Textarea
                placeholder="Enter rules and guidelines for the hackathon"
                minRows={4}
                {...form.getInputProps('rulesText')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Divider my="xl" />
              <Group justify="flex-end">
                <Button
                  variant="subtle"
                  onClick={() => navigate('/hackathons')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!form.isValid()}
                >
                  Create Hackathon
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

export default CreateHackathon
