import { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Group,
  Stepper,
  Alert,
  CopyButton,
  Code,
  ThemeIcon,
  Loader,
} from '@mantine/core'
import {
  IconBuilding,
  IconUsers,
  IconCheck,
  IconInfoCircle,
  IconCopy,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'

import { OrganizationService } from '../services/organizationService'
import { useAuthStore } from '../store/authStore'

import type { Organization } from '../services/organizationService'

// ---------- Schemas ----------

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})
type CreateFormValues = z.infer<typeof createSchema>

// ---------- Helpers ----------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ---------- Step 1 ----------

function StepCreate({
  onCreated,
}: {
  onCreated: (org: Organization) => void
}) {
  const queryClient = useQueryClient()
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle'
  )
  const [checkTimer, setCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', slug: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateFormValues) => OrganizationService.createOrganization(data),
    onSuccess: (org: Organization) => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] })
      notifications.show({
        title: 'Organization created',
        message: `${org.name} is ready.`,
        color: 'green',
      })
      onCreated(org)
    },
    onError: (err: Error) => {
      notifications.show({
        title: 'Failed to create',
        message: err.message,
        color: 'red',
      })
    },
  })

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue('name', value)
    const currentSlug = form.getValues('slug')
    const derived = generateSlug(form.getValues('name'))
    // Only auto-fill if slug is empty or was previously auto-derived
    if (!currentSlug || currentSlug === generateSlug(derived)) {
      const newSlug = generateSlug(value)
      form.setValue('slug', newSlug, { shouldValidate: true })
      scheduleSlugCheck(newSlug)
    }
  }

  const handleSlugChange = (value: string) => {
    form.setValue('slug', value, { shouldValidate: true })
    scheduleSlugCheck(value)
  }

  function scheduleSlugCheck(slug: string) {
    if (checkTimer) clearTimeout(checkTimer)
    if (slug.length < 3) {
      setSlugStatus('idle')
      return
    }
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      const available = await OrganizationService.checkSlugAvailable(slug)
      setSlugStatus(available ? 'available' : 'taken')
    }, 400)
    setCheckTimer(timer)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (checkTimer) clearTimeout(checkTimer)
    }
  }, [checkTimer])

  const slugRightSection = (() => {
    if (slugStatus === 'checking') return <Loader size="xs" />
    if (slugStatus === 'available')
      return <IconCheck size={14} style={{ color: 'var(--mantine-color-green-6)' }} />
    if (slugStatus === 'taken')
      return <IconAlertCircle size={14} style={{ color: 'var(--mantine-color-red-6)' }} />
    return null
  })()

  const slugError =
    form.formState.errors.slug?.message ??
    (slugStatus === 'taken' ? 'This slug is already taken' : undefined)

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        if (slugStatus === 'taken') return
        createMutation.mutate(data)
      })}
    >
      <Stack gap="md">
        <TextInput
          label="Organization Name"
          placeholder="Acme Corporation"
          required
          value={form.watch('name')}
          onChange={(e) => handleNameChange(e.currentTarget.value)}
          error={form.formState.errors.name?.message}
        />

        <TextInput
          label="Organization Slug"
          placeholder="acme-corp"
          description="Unique identifier — lowercase letters, numbers, and hyphens only."
          required
          value={form.watch('slug')}
          onChange={(e) => handleSlugChange(e.currentTarget.value)}
          error={slugError}
          rightSection={slugRightSection}
        />

        <Group justify="flex-end" mt="md">
          <Button
            type="submit"
            loading={createMutation.isPending}
            disabled={slugStatus === 'taken' || slugStatus === 'checking'}
          >
            Create Organization
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

// ---------- Step 2 ----------

function StepInvite({ org, onDone }: { org: Organization; onDone: () => void }) {
  const joinUrl = `${window.location.origin}/organizations?join=${org.slug}`

  return (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        There is no email invite API yet. Share the link below so teammates can join by entering
        the slug on the Organizations page.
      </Alert>

      <div>
        <Text size="sm" fw={500} mb={4}>
          Join slug
        </Text>
        <Group gap="xs">
          <Code>{org.slug}</Code>
          <CopyButton value={org.slug}>
            {({ copied, copy }) => (
              <Button
                size="xs"
                variant="light"
                leftSection={<IconCopy size={14} />}
                color={copied ? 'green' : 'blue'}
                onClick={copy}
              >
                {copied ? 'Copied!' : 'Copy slug'}
              </Button>
            )}
          </CopyButton>
        </Group>
      </div>

      <div>
        <Text size="sm" fw={500} mb={4}>
          Shareable link
        </Text>
        <Group gap="xs">
          <Code style={{ wordBreak: 'break-all' }}>{joinUrl}</Code>
          <CopyButton value={joinUrl}>
            {({ copied, copy }) => (
              <Button
                size="xs"
                variant="light"
                leftSection={<IconCopy size={14} />}
                color={copied ? 'green' : 'blue'}
                onClick={copy}
              >
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
            )}
          </CopyButton>
        </Group>
      </div>

      <Group justify="flex-end" mt="md">
        <Button onClick={onDone}>Go to Organization</Button>
      </Group>
    </Stack>
  )
}

// ---------- Main Wizard ----------

export function OrganizationSetup() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeStep, setActiveStep] = useState(0)
  const [createdOrg, setCreatedOrg] = useState<Organization | null>(null)

  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="orange">
          You need to be logged in to create an organization.{' '}
          <Button variant="subtle" size="xs" onClick={() => navigate('/login')}>
            Login
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <Stack gap="lg">
          <Group gap="sm">
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconBuilding size={20} />
            </ThemeIcon>
            <div>
              <Title order={3}>Create Organization</Title>
              <Text size="sm" c="dimmed">
                Set up your org on HackHub
              </Text>
            </div>
          </Group>

          <Stepper active={activeStep} size="sm">
            <Stepper.Step
              label="Details"
              description="Name and slug"
              icon={<IconBuilding size={16} />}
              completedIcon={<IconCheck size={16} />}
            >
              <StepCreate
                onCreated={(org) => {
                  setCreatedOrg(org)
                  setActiveStep(1)
                }}
              />
            </Stepper.Step>

            <Stepper.Step
              label="Invite"
              description="Share join link"
              icon={<IconUsers size={16} />}
            >
              {createdOrg && (
                <StepInvite
                  org={createdOrg}
                  onDone={() => navigate(`/organizations/${createdOrg.id}`)}
                />
              )}
            </Stepper.Step>

            <Stepper.Completed>
              <Text c="dimmed" ta="center">
                All done!
              </Text>
            </Stepper.Completed>
          </Stepper>

          <Group justify="flex-start">
            <Button
              variant="subtle"
              size="xs"
              onClick={() => navigate('/')}
            >
              Skip for now
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  )
}
