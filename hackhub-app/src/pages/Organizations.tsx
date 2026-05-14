import { useState } from 'react'
import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Grid,
  ThemeIcon,
  rem,
  Center,
  Skeleton,
  Alert,
  Modal,
  TextInput,
} from '@mantine/core'
import {
  IconBuilding,
  IconPlus,
  IconUsers,
  IconTrophy,
  IconSearch,
  IconAlertCircle,
  IconChevronRight,
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'

import { OrganizationService } from '../services/organizationService'
import { HackathonService } from '../services/hackathonService'
import { useAuthStore } from '../store/authStore'

import type { Organization } from '../services/organizationService'

const joinSchema = z.object({
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
})
type JoinFormValues = z.infer<typeof joinSchema>

function OrgCard({ org, role }: { org: Organization; role?: string }) {
  const navigate = useNavigate()
  const { data: hackathons } = useQuery({
    queryKey: ['hackathons-for-org', org.id],
    queryFn: () => HackathonService.getHackathons(0, 100),
    staleTime: 5 * 60 * 1000,
    select: (page) =>
      page.content.filter((h) => h.organizationId === org.id),
  })

  const roleColor: Record<string, string> = {
    owner: 'violet',
    manager: 'blue',
    member: 'green',
  }

  return (
    <Card
      withBorder
      radius="md"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/organizations/${org.id}`)}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="sm">
          <ThemeIcon variant="light" size="lg" color="blue">
            <IconBuilding size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="md">
              {org.name}
            </Text>
            <Text size="xs" c="dimmed">
              /{org.slug}
            </Text>
          </div>
        </Group>
        {role && (
          <Badge color={roleColor[role] ?? 'gray'} variant="light">
            {role}
          </Badge>
        )}
      </Group>

      {org.description && (
        <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
          {org.description}
        </Text>
      )}

      <Group gap="lg" mt="md">
        <Group gap="xs">
          <IconUsers size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
          <Text size="xs" c="dimmed">
            {org.memberCount ?? '—'} members
          </Text>
        </Group>
        <Group gap="xs">
          <IconTrophy size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
          <Text size="xs" c="dimmed">
            {hackathons?.length ?? '—'} hackathons
          </Text>
        </Group>
      </Group>

      <Group justify="flex-end" mt="sm">
        <Text size="xs" c="dimmed">
          View details
        </Text>
        <IconChevronRight size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
      </Group>
    </Card>
  )
}

export function Organizations() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [joinModalOpened, { open: openJoinModal, close: closeJoinModal }] = useDisclosure(false)
  const [createModalOpened, { close: closeCreateModal }] =
    useDisclosure(false)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: organizations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => OrganizationService.getMyOrganizations(),
    staleTime: 5 * 60 * 1000,
  })

  const joinMutation = useMutation({
    mutationFn: (data: JoinFormValues) => OrganizationService.joinOrganization(data.slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] })
      notifications.show({
        title: 'Joined organization',
        message: 'You have successfully joined the organization.',
        color: 'green',
      })
      closeJoinModal()
      joinForm.reset()
    },
    onError: (err: Error) => {
      notifications.show({
        title: 'Failed to join',
        message: err.message,
        color: 'red',
      })
    },
  })

  const joinForm = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { slug: '' },
  })

  const filteredOrgs = (organizations ?? []).filter(
    (org) =>
      !searchQuery ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canCreate = user?.role === 'admin' || user?.role === 'manager'

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          Failed to load organizations: {(error as Error).message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={1}>Organizations</Title>
            <Text c="dimmed" size="lg" mt="xs">
              Manage your organization memberships
            </Text>
          </div>
          <Group>
            <Button variant="light" onClick={openJoinModal}>
              Join Organization
            </Button>
            {canCreate && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => navigate('/organizations/new')}
              >
                Create Organization
              </Button>
            )}
          </Group>
        </Group>

        <TextInput
          placeholder="Search organizations..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />

        {isLoading ? (
          <Grid>
            {Array.from({ length: 3 }).map((_, i) => (
              <Grid.Col key={i} span={{ base: 12, md: 6 }}>
                <Skeleton height={140} radius="md" />
              </Grid.Col>
            ))}
          </Grid>
        ) : filteredOrgs.length > 0 ? (
          <Grid>
            {filteredOrgs.map((org) => (
              <Grid.Col key={org.id} span={{ base: 12, md: 6 }}>
                <OrgCard org={org} />
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size={80} variant="light" color="gray">
                <IconBuilding style={{ width: rem(40), height: rem(40) }} />
              </ThemeIcon>
              <Text ta="center" size="lg" fw={500}>
                {searchQuery ? 'No matching organizations' : 'No organizations yet'}
              </Text>
              <Text ta="center" c="dimmed">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create a new organization or join one with a slug'}
              </Text>
              {!searchQuery && (
                <Group>
                  <Button variant="light" onClick={openJoinModal}>
                    Join Organization
                  </Button>
                  {canCreate && (
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={() => navigate('/organizations/new')}
                    >
                      Create Organization
                    </Button>
                  )}
                </Group>
              )}
            </Stack>
          </Center>
        )}
      </Stack>

      {/* Join Modal */}
      <Modal opened={joinModalOpened} onClose={closeJoinModal} title="Join an Organization">
        <form
          onSubmit={joinForm.handleSubmit((data) => joinMutation.mutate(data))}
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Enter the organization slug to request membership.
            </Text>
            <TextInput
              label="Organization Slug"
              placeholder="e.g. acme-corp"
              error={joinForm.formState.errors.slug?.message}
              {...joinForm.register('slug')}
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={closeJoinModal}>
                Cancel
              </Button>
              <Button type="submit" loading={joinMutation.isPending}>
                Join
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Placeholder for create modal redirect */}
      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title="Create Organization"
      >
        <Text size="sm" c="dimmed">
          Redirecting to organization setup...
        </Text>
      </Modal>
    </Container>
  )
}
