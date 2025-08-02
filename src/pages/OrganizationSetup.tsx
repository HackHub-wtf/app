import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Alert,
  LoadingOverlay,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { OrganizationService } from '../utils/organizations'
import { notifications } from '@mantine/notifications'
import { IconInfoCircle } from '@tabler/icons-react'

interface OrganizationFormData {
  name: string
  slug: string
  description: string
  website_url: string
}

export function OrganizationSetup() {
  const navigate = useNavigate()
  const { user, loading: authLoading, initialized, refreshProfile } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  const suggestedOrg = searchParams.get('org') || ''

  // Debug auth state
  useEffect(() => {
    console.log('OrganizationSetup - Auth state:', { user, authLoading, initialized })
  }, [user, authLoading, initialized])

  const form = useForm<OrganizationFormData>({
    initialValues: {
      name: '',
      slug: suggestedOrg,
      description: '',
      website_url: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Organization name must be at least 2 characters' : null),
      slug: (value) => {
        if (value.length < 3) return 'Organization slug must be at least 3 characters'
        if (!/^[a-z0-9-]+$/.test(value)) return 'Slug can only contain lowercase letters, numbers, and hyphens'
        if (slugAvailable === false) return 'This slug is already taken'
        return null
      },
    },
  })

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    setSlugChecking(true)
    try {
      const available = await OrganizationService.isSlugAvailable(slug)
      setSlugAvailable(available)
    } catch (error) {
      console.error('Error checking slug:', error)
    } finally {
      setSlugChecking(false)
    }
  }

  // Handle name change and auto-generate slug
  const handleNameChange = (name: string) => {
    form.setFieldValue('name', name)
    if (!form.values.slug || form.values.slug === generateSlug(form.values.name)) {
      const newSlug = generateSlug(name)
      form.setFieldValue('slug', newSlug)
      if (newSlug.length >= 3) {
        checkSlugAvailability(newSlug)
      }
    }
  }

  // Handle slug change
  const handleSlugChange = (slug: string) => {
    form.setFieldValue('slug', slug)
    if (slug.length >= 3) {
      checkSlugAvailability(slug)
    } else {
      setSlugAvailable(null)
    }
  }

  // Handle form submission
  const handleSubmit = async (values: OrganizationFormData) => {
    console.log('Submit - Auth state:', { user, authLoading, initialized })
    
    if (!initialized) {
      notifications.show({
        title: 'Loading...',
        message: 'Please wait while we initialize your session.',
        color: 'blue',
      })
      return
    }

    if (!user) {
      notifications.show({
        title: 'Authentication required',
        message: 'Please log in to create an organization.',
        color: 'red',
      })
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      console.log('Creating organization with values:', values)
      console.log('User ID:', user.id)
      
      const organization = await OrganizationService.createOrganization(
        {
          name: values.name,
          slug: values.slug,
          description: values.description || undefined,
        },
        user.id
      )

      console.log('Organization created:', organization)

      if (organization) {
        // Refresh user profile to reflect new organization and manager role
        await refreshProfile()
        
        notifications.show({
          title: 'Organization created!',
          message: `Welcome to ${organization.name}! You can now create hackathons and invite team members.`,
          color: 'green',
        })

        // Navigate to dashboard or organization page
        navigate('/')
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to create organization. Please try again.',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create organization. Please try again.',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  // Check slug availability on mount if suggested org is provided
  useEffect(() => {
    if (suggestedOrg && suggestedOrg.length >= 3) {
      checkSlugAvailability(suggestedOrg)
    }
  }, [suggestedOrg])

  return (
    <Container size="md" py="xl">
      <Paper withBorder shadow="md" p="xl">
        <LoadingOverlay visible={loading || (!initialized && authLoading)} />
        
        <Stack gap="lg">
          <div>
            <Title order={2} mb="sm">
              Create Your Organization
            </Title>
            <Text c="dimmed">
              Set up your organization to start creating hackathons and managing teams. 
              Think of this as your organization's home on HackHub.
            </Text>
          </div>

          {!initialized && authLoading && (
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              Initializing your session...
            </Alert>
          )}

          {initialized && !user && (
            <Alert icon={<IconInfoCircle size="1rem" />} color="orange">
              You need to be logged in to create an organization. 
              <Button variant="subtle" size="xs" onClick={() => navigate('/login')} ml="sm">
                Login here
              </Button>
            </Alert>
          )}

          {suggestedOrg && (
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              We've suggested the organization name "{suggestedOrg}" based on your registration. 
              You can modify it if needed.
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Organization Name"
                placeholder="Acme Corporation"
                required
                value={form.values.name}
                onChange={(event) => handleNameChange(event.currentTarget.value)}
                error={form.errors.name}
              />

              <TextInput
                label="Organization Slug"
                placeholder="acme-corp"
                description="This will be your unique identifier (like GitHub usernames). Only lowercase letters, numbers, and hyphens."
                required
                value={form.values.slug}
                onChange={(event) => handleSlugChange(event.currentTarget.value)}
                error={form.errors.slug}
                rightSection={
                  slugChecking ? (
                    <Text size="xs" c="dimmed">Checking...</Text>
                  ) : slugAvailable === true ? (
                    <Text size="xs" c="green">✓ Available</Text>
                  ) : slugAvailable === false ? (
                    <Text size="xs" c="red">✗ Taken</Text>
                  ) : null
                }
              />

              <Textarea
                label="Description"
                placeholder="Tell us about your organization..."
                minRows={3}
                value={form.values.description}
                onChange={(event) => form.setFieldValue('description', event.currentTarget.value)}
              />

              <TextInput
                label="Website (Optional)"
                placeholder="https://acme.com"
                value={form.values.website_url}
                onChange={(event) => form.setFieldValue('website_url', event.currentTarget.value)}
              />

              <Group justify="flex-end" mt="xl">
                <Button
                  variant="subtle"
                  onClick={() => navigate('/')}
                >
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  disabled={!slugAvailable || slugChecking}
                  loading={loading}
                >
                  Create Organization
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  )
}
