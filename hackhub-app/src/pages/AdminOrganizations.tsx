import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Center,
  Pagination,
  Avatar,
  Anchor,
} from '@mantine/core'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBuilding,
  IconSearch,
  IconUsers,
  IconExternalLink,
} from '@tabler/icons-react'
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { PermissionService } from '../utils/permissions'
import { notifications } from '@mantine/notifications'
import { useForm } from '@mantine/form'
import { api } from '../lib/apiClient'

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  websiteUrl?: string
  createdBy: string
  createdAt: string
  memberCount: number
  hackathonCount: number
}

interface OrganizationFormData {
  name: string
  slug: string
  description: string
  websiteUrl: string
}

interface AdminOrgsPage {
  content: Organization[]
  totalPages: number
  totalElements: number
  number: number
}

export function AdminOrganizations() {
  const { user } = useAuthStore()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpened, setModalOpened] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const form = useForm<OrganizationFormData>({
    initialValues: {
      name: '',
      slug: '',
      description: '',
      websiteUrl: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must have at least 2 characters' : null),
      slug: (value) => {
        if (value.length < 3) return 'Slug must have at least 3 characters'
        if (!/^[a-z0-9-]+$/.test(value)) return 'Slug can only contain lowercase letters, numbers, and hyphens'
        return null
      },
    },
  })

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      const page: AdminOrgsPage = await api.get('/api/v1/admin/organizations?size=200&sort=createdAt,desc')
      setOrganizations(page.content)
    } catch (error) {
      console.error('Error loading organizations:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load organizations',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user && PermissionService.isAdmin(user)) {
      loadOrganizations()
    }
  }, [user, loadOrganizations])

  if (!user || !PermissionService.isAdmin(user)) {
    return (
      <Container size="xl" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <IconBuilding size={80} style={{ opacity: 0.3 }} />
            <Title order={3}>Access Denied</Title>
            <Text c="dimmed" ta="center">
              You don't have permission to manage organizations. Only administrators can access this page.
            </Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()

  const handleSubmit = async (values: OrganizationFormData) => {
    try {
      if (editingOrg) {
        await api.patch(`/api/v1/admin/organizations/${editingOrg.id}`, {
          name: values.name,
          description: values.description || null,
          websiteUrl: values.websiteUrl || null,
        })
        notifications.show({ title: 'Success', message: 'Organization updated', color: 'green' })
      } else {
        await api.post('/api/v1/organizations', {
          name: values.name,
          slug: values.slug,
        })
        notifications.show({ title: 'Success', message: 'Organization created', color: 'green' })
      }
      form.reset()
      setModalOpened(false)
      setEditingOrg(null)
      loadOrganizations()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save organization',
        color: 'red',
      })
    }
  }

  const handleEdit = (org: Organization) => {
    setEditingOrg(org)
    form.setValues({
      name: org.name,
      slug: org.slug,
      description: org.description || '',
      websiteUrl: org.websiteUrl || '',
    })
    setModalOpened(true)
  }

  const handleDelete = async (orgId: string, org: Organization) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/v1/admin/organizations/${orgId}`)
      notifications.show({ title: 'Success', message: 'Organization deleted', color: 'green' })
      loadOrganizations()
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to delete organization', color: 'red' })
    }
  }

  const openCreateModal = () => {
    setEditingOrg(null)
    form.reset()
    setModalOpened(true)
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrganizations = filteredOrganizations.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">Organization Management</Title>
            <Text c="dimmed" size="lg">Manage all organizations on the platform</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Create Organization
          </Button>
        </Group>

        <Card withBorder>
          <Group>
            <TextInput
              placeholder="Search organizations..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
          </Group>
        </Card>

        <Card withBorder>
          {loading ? (
            <Center py="xl"><Text>Loading organizations...</Text></Center>
          ) : paginatedOrganizations.length > 0 ? (
            <>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Organization</Table.Th>
                    <Table.Th>Slug</Table.Th>
                    <Table.Th>Members</Table.Th>
                    <Table.Th>Hackathons</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedOrganizations.map((org) => (
                    <Table.Tr key={org.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="sm">
                            <IconBuilding size={16} />
                          </Avatar>
                          <div>
                            <Text fw={500}>{org.name}</Text>
                            {org.description && (
                              <Text size="xs" c="dimmed" lineClamp={1}>{org.description}</Text>
                            )}
                            {org.websiteUrl && (
                              <Group gap={4}>
                                <IconExternalLink size={12} />
                                <Anchor href={org.websiteUrl} target="_blank" size="xs" style={{ textDecoration: 'none' }}>
                                  Website
                                </Anchor>
                              </Group>
                            )}
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">{org.slug}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconUsers size={16} />
                          <Text size="sm">{org.memberCount}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{org.hackathonCount}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{new Date(org.createdAt).toLocaleDateString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon variant="light" color="blue" onClick={() => handleEdit(org)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon variant="light" color="red" onClick={() => handleDelete(org.id, org)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} />
                </Group>
              )}
            </>
          ) : (
            <Center py="xl">
              <Stack align="center">
                <IconBuilding size={60} style={{ opacity: 0.3 }} />
                <Text c="dimmed">No organizations found</Text>
              </Stack>
            </Center>
          )}
        </Card>

        <Modal
          opened={modalOpened}
          onClose={() => { setModalOpened(false); setEditingOrg(null); form.reset() }}
          title={editingOrg ? 'Edit Organization' : 'Create New Organization'}
          size="md"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Organization Name"
                placeholder="Enter organization name"
                required
                {...form.getInputProps('name')}
                onChange={(e) => {
                  form.setFieldValue('name', e.target.value)
                  if (!editingOrg) {
                    form.setFieldValue('slug', generateSlug(e.target.value))
                  }
                }}
              />

              {!editingOrg && (
                <TextInput
                  label="Organization Slug"
                  placeholder="organization-slug"
                  description="Unique identifier for the organization"
                  required
                  {...form.getInputProps('slug')}
                />
              )}

              <Textarea
                label="Description"
                placeholder="Enter organization description"
                minRows={3}
                {...form.getInputProps('description')}
              />

              <TextInput
                label="Website URL"
                placeholder="https://example.com"
                {...form.getInputProps('websiteUrl')}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => { setModalOpened(false); setEditingOrg(null); form.reset() }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingOrg ? 'Update Organization' : 'Create Organization'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Container>
  )
}
