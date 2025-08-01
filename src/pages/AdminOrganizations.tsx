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
import { supabase } from '../lib/supabase'

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website_url?: string
  created_by: string
  created_at: string
  updated_at: string
  member_count?: number
  hackathon_count?: number
  creator_name?: string
}

interface OrganizationFormData {
  name: string
  slug: string
  description: string
  website_url: string
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
      website_url: '',
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

      // Get organizations with additional stats
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // Get creator names separately
      const { data: creators, error: creatorsError } = await supabase
        .from('profiles')
        .select('id, name')

      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError)
      }

      // Create creator map
      const creatorMap = new Map(creators?.map(c => [c.id, c.name]) || [])

      // Get member counts for each organization
      const { data: memberCounts, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')

      if (memberError) {
        console.error('Error fetching member counts:', memberError)
      }

      // Get hackathon counts for each organization
      const { data: hackathonCounts, error: hackathonError } = await supabase
        .from('hackathons')
        .select('organization_id')

      if (hackathonError) {
        console.error('Error fetching hackathon counts:', hackathonError)
      }

      // Combine data
      const organizationsWithStats = orgsData?.map(org => {
        const memberCount = memberCounts?.filter(m => m.organization_id === org.id).length || 0
        const hackathonCount = hackathonCounts?.filter(h => h.organization_id === org.id).length || 0
        
        return {
          ...org,
          member_count: memberCount,
          hackathon_count: hackathonCount,
          creator_name: creatorMap.get(org.created_by) || 'Unknown'
        }
      }) || []

      setOrganizations(organizationsWithStats)
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

  // Check if user has admin permissions
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleSubmit = async (values: OrganizationFormData) => {
    try {
      if (editingOrg) {
        // Update existing organization
        const { error } = await supabase
          .from('organizations')
          .update({
            name: values.name,
            slug: values.slug,
            description: values.description || null,
            website_url: values.website_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingOrg.id)

        if (error) throw error

        notifications.show({
          title: 'Success',
          message: 'Organization updated successfully',
          color: 'green',
        })
      } else {
        // Create new organization (admin only)
        const { error } = await supabase
          .from('organizations')
          .insert([{
            name: values.name,
            slug: values.slug,
            description: values.description || null,
            website_url: values.website_url || null,
            created_by: user.id,
          }])

        if (error) throw error

        notifications.show({
          title: 'Success',
          message: 'Organization created successfully',
          color: 'green',
        })
      }

      form.reset()
      setModalOpened(false)
      setEditingOrg(null)
      loadOrganizations()
    } catch (error) {
      console.error('Error saving organization:', error)
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
      website_url: org.website_url || '',
    })
    setModalOpened(true)
  }

  const handleDelete = async (orgId: string, org: Organization) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone and will affect all associated hackathons and members.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId)

      if (error) throw error

      notifications.show({
        title: 'Success',
        message: 'Organization deleted successfully',
        color: 'green',
      })

      loadOrganizations()
    } catch (error) {
      console.error('Error deleting organization:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to delete organization',
        color: 'red',
      })
    }
  }

  const openCreateModal = () => {
    setEditingOrg(null)
    form.reset()
    setModalOpened(true)
  }

  // Filter organizations
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Pagination
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrganizations = filteredOrganizations.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Organization Management
            </Title>
            <Text c="dimmed" size="lg">
              Manage all organizations on the platform
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Create Organization
          </Button>
        </Group>

        {/* Filters */}
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

        {/* Organizations Table */}
        <Card withBorder>
          {loading ? (
            <Center py="xl">
              <Text>Loading organizations...</Text>
            </Center>
          ) : paginatedOrganizations.length > 0 ? (
            <>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Organization</Table.Th>
                    <Table.Th>Slug</Table.Th>
                    <Table.Th>Creator</Table.Th>
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
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {org.description}
                              </Text>
                            )}
                            {org.website_url && (
                              <Group gap={4}>
                                <IconExternalLink size={12} />
                                <Anchor
                                  href={org.website_url}
                                  target="_blank"
                                  size="xs"
                                  style={{ textDecoration: 'none' }}
                                >
                                  Website
                                </Anchor>
                              </Group>
                            )}
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          {org.slug}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{org.creator_name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconUsers size={16} />
                          <Text size="sm">{org.member_count}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{org.hackathon_count}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(org.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleEdit(org)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(org.id, org)}
                          >
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
                  <Pagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={totalPages}
                  />
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

        {/* Organization Form Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => {
            setModalOpened(false)
            setEditingOrg(null)
            form.reset()
          }}
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
                    // Auto-generate slug for new organizations
                    const newSlug = generateSlug(e.target.value)
                    form.setFieldValue('slug', newSlug)
                  }
                }}
              />

              <TextInput
                label="Organization Slug"
                placeholder="organization-slug"
                description="Unique identifier for the organization"
                required
                {...form.getInputProps('slug')}
              />

              <Textarea
                label="Description"
                placeholder="Enter organization description"
                minRows={3}
                {...form.getInputProps('description')}
              />

              <TextInput
                label="Website URL"
                placeholder="https://example.com"
                {...form.getInputProps('website_url')}
              />

              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  onClick={() => {
                    setModalOpened(false)
                    setEditingOrg(null)
                    form.reset()
                  }}
                >
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
