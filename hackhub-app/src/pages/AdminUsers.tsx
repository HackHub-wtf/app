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
  Select,
  Center,
  Alert,
  Pagination,
  Avatar,
} from '@mantine/core'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUser,
  IconShield,
  IconCrown,
  IconSearch,
  IconUserCheck,
} from '@tabler/icons-react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { PermissionService } from '../utils/permissions'
import type { Organization } from '../utils/organizations'
import { notifications } from '@mantine/notifications'
import { useForm } from '@mantine/form'
import { api } from '../lib/apiClient'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'participant'
  createdAt: string
  organizationId?: string
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'participant'
  organizationId: string
}

export function AdminUsers() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpened, setModalOpened] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const editingUserRef = useRef<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [organizationFilter, setOrganizationFilter] = useState<string>('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [userOrgMap, setUserOrgMap] = useState<Map<string, string>>(new Map())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const form = useForm<UserFormData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'participant',
      organizationId: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must have at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => editingUserRef.current ? null : (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      if (PermissionService.isAdmin(user!)) {
        // Admin: load all platform users
        type PageResult = { content: User[] }
        const result = await api.get<PageResult>('/api/v1/admin/users?size=200&sort=createdAt,desc')
        setUsers(result.content ?? [])
      } else {
        // Manager: load members from all orgs they manage
        type OrgItem = { id: string; name: string }
        type MemberItem = { userId: string; name: string; email: string; role: string; joinedAt: string }
        const orgs = await api.get<OrgItem[]>('/api/v1/organizations/my')
        const memberMap = new Map<string, User>()
        await Promise.all(
          (orgs ?? []).map(async (org) => {
            try {
              const members = await api.get<MemberItem[]>(`/api/v1/organizations/${org.id}/members`)
              ;(members ?? []).forEach((m) => {
                if (!memberMap.has(m.userId)) {
                  memberMap.set(m.userId, {
                    id: m.userId,
                    name: m.name ?? m.email,
                    email: m.email,
                    role: m.role === 'owner' || m.role === 'manager' ? 'manager' : 'participant',
                    createdAt: m.joinedAt,
                    organizationId: org.id,
                  })
                }
              })
            } catch { /* skip orgs we can't access */ }
          })
        )
        setUsers(Array.from(memberMap.values()))
      }
    } catch (error) {
      console.error('Error loading users:', error)
      notifications.show({ title: 'Error', message: 'Failed to load users', color: 'red' })
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadOrganizations = useCallback(async () => {
    try {
      type OrgItem = { id: string; name: string; slug: string }
      type MemberItem = { userId: string }
      let orgs: OrgItem[] = []

      if (PermissionService.isAdmin(user!)) {
        type OrgPage = { content: OrgItem[] }
        const result = await api.get<OrgPage>('/api/v1/admin/organizations?size=200&sort=name,asc')
        orgs = result.content ?? []
        setOrganizations(orgs as Organization[])
      } else {
        orgs = (await api.get<OrgItem[]>('/api/v1/organizations/my')) ?? []
        setOrganizations(orgs as Organization[])
      }

      // Build userId → orgName map
      const map = new Map<string, string>()
      await Promise.all(
        orgs.map(async (org) => {
          try {
            const members = await api.get<MemberItem[]>(`/api/v1/organizations/${org.id}/members`)
            ;(members ?? []).forEach((m) => map.set(m.userId, org.name))
          } catch { /* non-fatal */ }
        })
      )
      setUserOrgMap(map)
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }, [user])

  useEffect(() => {
    if (user && (PermissionService.canManageUsers(user) || PermissionService.isManagerOrAbove(user))) {
      loadUsers()
      loadOrganizations()
    }
  }, [user, loadUsers, loadOrganizations])

  // Check if user has management permissions
  if (!user || !(PermissionService.canManageUsers(user) || PermissionService.isManagerOrAbove(user))) {
    return (
      <Container size="xl" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <IconShield size={80} style={{ opacity: 0.3 }} />
            <Title order={3}>Access Denied</Title>
            <Text c="dimmed" ta="center">
              You don't have permission to manage users. Only administrators and managers can access this page.
            </Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  const handleSubmit = async (values: UserFormData) => {
    try {
      if (editingUser) {
        await api.patch(`/api/v1/admin/users/${editingUser.id}/role`, { role: values.role })
        notifications.show({ title: 'Success', message: 'User updated successfully', color: 'green' })
      } else {
        await api.post('/api/v1/admin/users', {
          email: values.email,
          name: values.name,
          password: values.password,
          role: values.role,
          organizationId: values.organizationId || null,
        })
        notifications.show({ title: 'Success', message: 'User created successfully', color: 'green' })
      }

      form.reset()
      setModalOpened(false)
      editingUserRef.current = null
      setEditingUser(null)
      loadUsers()
      loadOrganizations() // Refresh organizations list too
    } catch (error) {
      console.error('Error saving user:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save user',
        color: 'red',
      })
    }
  }

  const handleEdit = (targetUser: User) => {
    // Managers cannot edit admin users
    if (!PermissionService.isAdmin(user!) && targetUser.role === 'admin') {
      notifications.show({
        title: 'Access Denied',
        message: 'Only administrators can edit admin accounts',
        color: 'red',
      })
      return
    }

    editingUserRef.current = targetUser
    setEditingUser(targetUser)
    form.setValues({
      name: targetUser.name,
      email: targetUser.email,
      password: '', // Don't show existing password
      role: targetUser.role,
    })
    setModalOpened(true)
  }

  const handleDelete = async (userId: string, targetUser: User) => {
    // Managers cannot delete admin users
    if (!PermissionService.isAdmin(user!) && targetUser.role === 'admin') {
      notifications.show({
        title: 'Access Denied',
        message: 'Only administrators can delete admin accounts',
        color: 'red',
      })
      return
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/api/v1/admin/users/${userId}`)
      notifications.show({
        title: 'Success',
        message: 'User deleted successfully',
        color: 'green',
      })

      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to delete user',
        color: 'red',
      })
    }
  }

  const openCreateModal = () => {
    editingUserRef.current = null
    setEditingUser(null)
    form.reset()
    setModalOpened(true)
  }

  // Get available roles based on current user's permissions
  const getAvailableRoles = () => {
    if (PermissionService.isAdmin(user!)) {
      // Admins can create any role
      return [
        { value: 'participant', label: '👤 User - Team leader permissions only' },
        { value: 'manager', label: '👨‍💼 Manager - Own hackathons only' },
        { value: 'admin', label: '👑 Admin - Master access to everything' },
      ]
    } else if (PermissionService.isManagerOrAbove(user!)) {
      // Managers can only create users and other managers
      return [
        { value: 'participant', label: '👤 User - Team leader permissions only' },
        { value: 'manager', label: '👨‍💼 Manager - Own hackathons only' },
      ]
    }
    return []
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <IconCrown size={16} />
      case 'manager':
        return <IconShield size={16} />
      case 'participant':
        return <IconUser size={16} />
      default:
        return <IconUser size={16} />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red'
      case 'manager':
        return 'blue'
      case 'participant':
        return 'green'
      default:
        return 'gray'
    }
  }

  // Filter users based on search, role, and organization
  const filteredUsers = users.filter(targetUser => {
    const matchesSearch = targetUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         targetUser.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !roleFilter || targetUser.role === roleFilter
    
    // Organization filter — uses the userOrgMap built from member lists
    let matchesOrg = true
    if (organizationFilter) {
      const orgName = userOrgMap.get(targetUser.id)
      if (organizationFilter === 'none') {
        matchesOrg = !orgName
      } else {
        // organizationFilter holds an org id; find the org name for comparison
        const orgForFilter = organizations.find(o => o.id === organizationFilter)
        matchesOrg = !!orgName && orgName === orgForFilter?.name
      }
    }
    
    // Managers cannot see admin-role users
    const canSeeUser = PermissionService.isAdmin(user!) || targetUser.role !== 'admin'

    return matchesSearch && matchesRole && matchesOrg && canSeeUser
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              {PermissionService.isAdmin(user!) ? 'User Management' : 'Org Members'}
            </Title>
            <Text c="dimmed" size="lg">
              {PermissionService.isAdmin(user!)
                ? 'Manage all platform users and their roles'
                : 'Members across your organizations'}
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Add User
          </Button>
        </Group>

        {/* Filters */}
        <Card withBorder>
          <Group>
            <TextInput
              placeholder="Search users..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by role"
              data={[
                { value: '', label: 'All Roles' },
                { value: 'participant', label: 'User' },
                { value: 'manager', label: 'Manager' },
                ...(PermissionService.isAdmin(user!) ? [{ value: 'admin', label: 'Admin' }] : []),
              ]}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value || '')}
              clearable
            />
            <Select
              placeholder="Filter by organization"
              data={[
                { value: '', label: 'All Organizations' },
                ...organizations.map(org => ({ value: org.id, label: org.name }))
              ]}
              value={organizationFilter}
              onChange={(value) => setOrganizationFilter(value || '')}
              clearable
            />
          </Group>
        </Card>

        {/* Users Table */}
        <Card withBorder>
          {loading ? (
            <Center py="xl">
              <Text>Loading users...</Text>
            </Center>
          ) : paginatedUsers.length > 0 ? (
            <>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Organization</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Last Sign In</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedUsers.map((rowUser) => (
                    <Table.Tr key={rowUser.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" />
                          <div>
                            <Text fw={500}>{rowUser.name}</Text>
                            <Text size="xs" c="dimmed">{rowUser.email}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getRoleBadgeColor(rowUser.role)}
                          leftSection={getRoleIcon(rowUser.role)}
                          variant="light"
                        >
                          {rowUser.role.charAt(0).toUpperCase() + rowUser.role.slice(1)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {userOrgMap.get(rowUser.id) ?? '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {rowUser.createdAt ? new Date(rowUser.createdAt).toLocaleDateString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        Never
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {/* Only admins can edit platform roles */}
                          {PermissionService.isAdmin(user!) && (
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEdit(rowUser)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          )}
                          {PermissionService.isAdmin(user!) && (
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDelete(rowUser.id, rowUser)}
                              disabled={rowUser.id === user?.id}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
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
                <IconUserCheck size={60} style={{ opacity: 0.3 }} />
                <Text c="dimmed">No users found</Text>
              </Stack>
            </Center>
          )}
        </Card>

        {/* User Form Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => {
            setModalOpened(false)
            editingUserRef.current = null
            setEditingUser(null)
            form.reset()
          }}
          title={editingUser ? 'Edit User' : 'Create New User'}
          size="md"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Full Name"
                placeholder="Enter full name"
                required
                {...form.getInputProps('name')}
              />

              <TextInput
                label="Email"
                placeholder="Enter email address"
                required
                disabled={!!editingUser} // Can't change email for existing users
                {...form.getInputProps('email')}
              />

              {!editingUser && (
                <TextInput
                  label="Password"
                  placeholder="Enter password"
                  type="password"
                  required
                  {...form.getInputProps('password')}
                />
              )}

              <Select
                label="Role"
                placeholder="Select user role"
                required
                data={getAvailableRoles()}
                {...form.getInputProps('role')}
              />

              {!editingUser && PermissionService.isAdmin(user!) && (form.values.role === 'manager' || form.values.role === 'participant') && (
                <Select
                  label="Organization"
                  placeholder="Select organization"
                  data={organizations.map(org => ({ value: org.id, label: org.name }))}
                  required
                  clearable
                  {...form.getInputProps('organizationId')}
                />
              )}

              {editingUser && (
                <Alert color="blue" variant="light">
                  <Text size="sm">
                    Note: Password cannot be changed through this interface. 
                    Users can reset their password using the "Forgot Password" feature.
                  </Text>
                </Alert>
              )}

              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  onClick={() => {
                    setModalOpened(false)
                    editingUserRef.current = null
                    setEditingUser(null)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Container>
  )
}
