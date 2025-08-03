import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Grid,
  TextInput,
  Textarea,
  NumberInput,
  MultiSelect,
  Select,
  FileInput,
  Alert,
  LoadingOverlay,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconCalendar,
  IconUsers,
  IconTarget,
  IconAlertCircle,
  IconUpload,
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from '@mantine/form'
import { useAuthStore } from '../store/authStore'
import { useHackathonStore } from '../store/hackathonStore'
import { useRealtime } from '../hooks/useRealtime'
import { PermissionService } from '../utils/permissions'
import { notifications } from '@mantine/notifications'

// Helper function to get suggested status based on dates
const getSuggestedStatus = (startDate: Date, endDate: Date, currentStatus: string): 'draft' | 'open' | 'running' | 'completed' => {
  const now = new Date()
  
  // For past hackathons, be more flexible with suggestions
  if (endDate <= now) {
    return 'completed'
  } else if (startDate <= now && endDate > now) {
    return 'running'
  } else if (startDate > now) {
    // For future hackathons, suggest open unless it's currently draft
    return currentStatus === 'draft' ? 'draft' : 'open'
  }
  return currentStatus as 'draft' | 'open' | 'running' | 'completed'
}

// Helper function to get available status options based on current state
const getStatusOptions = (startDate: Date, endDate: Date, currentStatus: string) => {
  const now = new Date()
  const options = []

  // Draft is always available
  options.push({ value: 'draft', label: '📝 Draft - Not visible to participants' })
  
  // For past hackathons, allow all statuses for flexibility
  const isPastHackathon = endDate <= now
  
  if (isPastHackathon) {
    // Allow all statuses for past hackathons
    options.push({ value: 'open', label: '🚀 Open - Registration available (archived)' })
    options.push({ value: 'running', label: '⚡ Running - Event in progress (archived)' })
    options.push({ value: 'completed', label: '✅ Completed - Event finished' })
  } else {
    // For current/future hackathons, apply the original logic
    // Open is available if not past end date
    if (endDate > now) {
      options.push({ value: 'open', label: '🚀 Open - Registration available' })
    }
    
    // Running is available if past start date and before end date
    if (startDate <= now && endDate > now) {
      options.push({ value: 'running', label: '⚡ Running - Event in progress' })
    }
    
    // Completed is available if past end date or manually set
    if (endDate <= now || currentStatus === 'completed') {
      options.push({ value: 'completed', label: '✅ Completed - Event finished' })
    }
  }

  return options
}

interface HackathonEditForm {
  title: string
  description: string
  start_date: Date
  end_date: Date
  max_team_size: number
  allowed_participants: number
  registration_key: string
  status: 'draft' | 'open' | 'running' | 'completed'
  tags: string[]
  prizes: string[]
  rules: string
  banner_url?: string
}

export function HackathonEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hackathons, updateHackathon } = useHackathonStore()
  const { isConnected } = useRealtime()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hackathon, setHackathon] = useState<typeof hackathons[0] | null>(null)

  // Form configuration
  const form = useForm<HackathonEditForm>({
    initialValues: {
      title: '',
      description: '',
      start_date: new Date(),
      end_date: new Date(),
      max_team_size: 4,
      allowed_participants: 100,
      registration_key: '',
      status: 'draft',
      tags: [],
      prizes: [''],
      rules: '',
      banner_url: '',
    },
    validate: {
      title: (value) => (value.length < 3 ? 'Title must be at least 3 characters' : null),
      description: (value) => (value.length < 10 ? 'Description must be at least 10 characters' : null),
      // Allow past dates for hackathons (removed past date restriction)
      start_date: () => null,
      end_date: (value, values) => 
        value <= values.start_date ? 'End date must be after start date' : null,
      max_team_size: (value) => (value < 1 || value > 10 ? 'Team size must be between 1 and 10' : null),
      allowed_participants: (value) => (value < 1 ? 'Must allow at least 1 participant' : null),
      status: (value, values) => {
        const now = new Date()
        const startDate = values.start_date instanceof Date ? values.start_date : new Date(values.start_date)
        const endDate = values.end_date instanceof Date ? values.end_date : new Date(values.end_date)
        
        // Allow more flexible status transitions for past hackathons
        if (value === 'running' && startDate > now) {
          return 'Cannot set status to "Running" before the start date'
        }
        if (value === 'open' && endDate <= now) {
          return 'Cannot set status to "Open" after the end date'
        }
        // Allow completed status to be set manually regardless of dates
        return null
      },
    },
  })

  // Load hackathon data
  useEffect(() => {
    const loadHackathon = async () => {
      if (!id) {
        navigate('/hackathons')
        return
      }

      setLoading(true)
      try {
        // Find hackathon in store
        const foundHackathon = hackathons.find(h => h.id === id)
        if (!foundHackathon) {
          notifications.show({
            title: 'Hackathon Not Found',
            message: 'The hackathon you are trying to edit could not be found.',
            color: 'red',
          })
          navigate('/hackathons')
          return
        }

        // Check permissions
        if (!user || !PermissionService.canEditHackathon(user, foundHackathon)) {
          notifications.show({
            title: 'Access Denied',
            message: 'You do not have permission to edit this hackathon.',
            color: 'red',
          })
          navigate(`/hackathons/${id}`)
          return
        }

        setHackathon(foundHackathon)
        
        // Populate form with hackathon data
        form.setValues({
          title: foundHackathon.title || '',
          description: foundHackathon.description || '',
          start_date: new Date(foundHackathon.start_date),
          end_date: new Date(foundHackathon.end_date),
          max_team_size: foundHackathon.max_team_size || 4,
          allowed_participants: foundHackathon.allowed_participants || 100,
          registration_key: foundHackathon.registration_key || '',
          status: foundHackathon.status || 'draft',
          tags: foundHackathon.tags || [],
          prizes: foundHackathon.prizes || [''],
          rules: foundHackathon.rules || '',
          banner_url: foundHackathon.banner_url || '',
        })
      } catch (error) {
        console.error('Error loading hackathon:', error)
        notifications.show({
          title: 'Error',
          message: 'Failed to load hackathon data.',
          color: 'red',
        })
        navigate('/hackathons')
      } finally {
        setLoading(false)
      }
    }

    loadHackathon()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hackathons, user, navigate])

  const handleSubmit = async (values: HackathonEditForm) => {
    if (!hackathon || !user) return

    setSaving(true)
    try {
      // Convert dates to ISO strings, ensuring they're valid Date objects
      const startDate = values.start_date instanceof Date ? values.start_date : new Date(values.start_date)
      const endDate = values.end_date instanceof Date ? values.end_date : new Date(values.end_date)
      
      const updatedHackathon = {
        ...hackathon,
        ...values,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Check if status changed for special notification
      const statusChanged = hackathon.status !== values.status
      
      // In real implementation: await HackathonService.updateHackathon(id, updatedHackathon)
      await updateHackathon(hackathon.id, updatedHackathon)

      // Show success notification with status change info
      let message = 'Hackathon has been updated successfully.'
      if (statusChanged) {
        const statusLabels = {
          'draft': 'Draft (not visible)',
          'open': 'Open for registration',
          'running': 'Currently running',
          'completed': 'Completed'
        }
        message += ` Status changed to: ${statusLabels[values.status]}.`
      }

      notifications.show({
        title: 'Success!',
        message,
        color: 'green',
      })

      navigate(`/hackathons/${id}`)
    } catch (error) {
      console.error('Error updating hackathon:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to update hackathon. Please try again.',
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  const availableTags = [
    'AI/ML', 'Blockchain', 'IoT', 'FinTech', 'HealthTech', 'EdTech', 
    'Gaming', 'Mobile', 'Web', 'DevOps', 'Security', 'Data Science',
    'AR/VR', 'Sustainability', 'Social Impact', 'Hardware'
  ]

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <LoadingOverlay visible />
        <div style={{ height: '400px' }} />
      </Container>
    )
  }

  if (!hackathon) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Hackathon Not Found"
          color="red"
        >
          The hackathon you are trying to edit could not be found.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group mb="md">
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate(`/hackathons/${id}`)}
            >
              Back to Hackathon
            </Button>
            {/* Real-time connection indicator */}
            {user && (
              <Group gap="xs" ml="auto">
                <div 
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isConnected ? '#51cf66' : '#fa5252',
                  }}
                />
                <Text size="xs" c="dimmed">
                  {isConnected ? 'Connected' : 'Offline'}
                </Text>
              </Group>
            )}
          </Group>
          
          <Title order={1} mb="xs">
            Edit Hackathon
          </Title>
          <Text c="dimmed" size="lg">
            Update your hackathon details and settings
          </Text>
        </div>

        {/* Edit Form */}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            {/* Basic Information */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Basic Information</Title>
              <Stack gap="md">
                <TextInput
                  label="Hackathon Title"
                  placeholder="Enter hackathon title"
                  required
                  {...form.getInputProps('title')}
                />

                <Textarea
                  label="Description"
                  placeholder="Describe your hackathon..."
                  required
                  minRows={4}
                  {...form.getInputProps('description')}
                />

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <DateTimePicker
                      label="Start Date & Time"
                      placeholder="Select start date and time"
                      required
                      leftSection={<IconCalendar size={16} />}
                      {...form.getInputProps('start_date')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <DateTimePicker
                      label="End Date & Time"
                      placeholder="Select end date and time"
                      required
                      leftSection={<IconCalendar size={16} />}
                      {...form.getInputProps('end_date')}
                    />
                  </Grid.Col>
                </Grid>

                <Select
                  label="Hackathon Status"
                  placeholder="Select current status"
                  required
                  description="Change the status to control access and visibility"
                  data={getStatusOptions(form.values.start_date, form.values.end_date, form.values.status)}
                  {...form.getInputProps('status')}
                />

                {/* Status suggestion alert */}
                {(() => {
                  const suggested = getSuggestedStatus(form.values.start_date, form.values.end_date, form.values.status)
                  if (suggested !== form.values.status) {
                    return (
                      <Alert color="blue" variant="light" mt="xs">
                        <Group justify="space-between">
                          <Text size="sm">
                            💡 Suggested status: <strong>{suggested}</strong> (based on dates)
                          </Text>
                          <Button 
                            size="xs" 
                            variant="light"
                            onClick={() => form.setFieldValue('status', suggested)}
                          >
                            Apply
                          </Button>
                        </Group>
                      </Alert>
                    )
                  }
                  return null
                })()}

                <FileInput
                  label="Banner Image"
                  placeholder="Upload hackathon banner"
                  leftSection={<IconUpload size={16} />}
                  accept="image/*"
                />
              </Stack>
            </Card>

            {/* Status Information */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Status Guide</Title>
              <Stack gap="sm">
                <Group>
                  <Text fw={500} c={form.values.status === 'draft' ? 'blue' : 'dimmed'}>📝 Draft:</Text>
                  <Text size="sm" c={form.values.status === 'draft' ? undefined : 'dimmed'}>
                    Hackathon is not visible to participants. Use this for preparation.
                  </Text>
                </Group>
                <Group>
                  <Text fw={500} c={form.values.status === 'open' ? 'blue' : 'dimmed'}>🚀 Open:</Text>
                  <Text size="sm" c={form.values.status === 'open' ? undefined : 'dimmed'}>
                    Registration is available. Participants can view and join the hackathon.
                  </Text>
                </Group>
                <Group>
                  <Text fw={500} c={form.values.status === 'running' ? 'blue' : 'dimmed'}>⚡ Running:</Text>
                  <Text size="sm" c={form.values.status === 'running' ? undefined : 'dimmed'}>
                    Event is in progress. Participants can submit ideas and collaborate.
                  </Text>
                </Group>
                <Group>
                  <Text fw={500} c={form.values.status === 'completed' ? 'blue' : 'dimmed'}>✅ Completed:</Text>
                  <Text size="sm" c={form.values.status === 'completed' ? undefined : 'dimmed'}>
                    Event has finished. Results can be announced and archives are available.
                  </Text>
                </Group>
              </Stack>
            </Card>

            {/* Participation Settings */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Participation Settings</Title>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Maximum Team Size"
                      placeholder="Enter max team size"
                      min={1}
                      max={10}
                      required
                      leftSection={<IconUsers size={16} />}
                      {...form.getInputProps('max_team_size')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Maximum Participants"
                      placeholder="Enter participant limit"
                      min={1}
                      required
                      leftSection={<IconTarget size={16} />}
                      {...form.getInputProps('allowed_participants')}
                    />
                  </Grid.Col>
                </Grid>

                <TextInput
                  label="Registration Key"
                  placeholder="Enter registration key (optional)"
                  description="Participants will need this key to register"
                  {...form.getInputProps('registration_key')}
                />
              </Stack>
            </Card>

            {/* Categories & Tags */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Categories & Tags</Title>
              <MultiSelect
                label="Tags"
                placeholder="Select relevant tags"
                data={availableTags}
                description="Help participants find your hackathon"
                {...form.getInputProps('tags')}
              />
            </Card>

            {/* Prizes */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Prizes</Title>
              <Stack gap="sm">
                {form.values.prizes.map((_, index) => (
                  <Group key={index}>
                    <TextInput
                      placeholder={`Prize ${index + 1} (e.g., $1000 First Place)`}
                      style={{ flex: 1 }}
                      value={form.values.prizes[index]}
                      onChange={(event) => {
                        const newPrizes = [...form.values.prizes]
                        newPrizes[index] = event.currentTarget.value
                        form.setFieldValue('prizes', newPrizes)
                      }}
                    />
                    {index > 0 && (
                      <Button
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => {
                          const newPrizes = form.values.prizes.filter((_, i) => i !== index)
                          form.setFieldValue('prizes', newPrizes)
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Group>
                ))}
                <Button
                  variant="light"
                  onClick={() => {
                    form.setFieldValue('prizes', [...form.values.prizes, ''])
                  }}
                >
                  Add Prize
                </Button>
              </Stack>
            </Card>

            {/* Rules */}
            <Card withBorder radius="md" p="lg">
              <Title order={3} mb="md">Rules & Guidelines</Title>
              <Textarea
                label="Rules"
                placeholder="Enter hackathon rules and guidelines..."
                minRows={6}
                description="Use markdown for formatting"
                {...form.getInputProps('rules')}
              />
            </Card>

            {/* Action Buttons */}
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => navigate(`/hackathons/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={saving}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
