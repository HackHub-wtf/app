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
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { PermissionService } from '../utils/permissions'
import { notifications } from '@mantine/notifications'
import { useForm } from '@mantine/form'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'participant'
  created_at: string
  last_sign_in_at?: string
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'participant'
}

export function AdminUsers() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpened, setModalOpened] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const form = useForm<UserFormData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'participant',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must have at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      if (PermissionService.isAdmin(user!)) {
        // Admins can see all users
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setUsers(data || [])
      } else if (PermissionService.isManagerOrAbove(user!)) {
        // Managers can only see users from their hackathons
        // First get hackathons managed by this user
        const { data: managedHackathons, error: hackathonsError } = await supabase
          .from('hackathons')
          .select('id')
          .eq('created_by', user!.id)

        if (hackathonsError) throw hackathonsError

        const hackathonIds = managedHackathons.map(h => h.id)

        if (hackathonIds.length === 0) {
          // No hackathons managed, only show the manager themselves
          const { data: managerProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user!.id)
            .single()

          if (profileError) throw profileError
          setUsers([managerProfile])
        } else {
          // Get users who are team members in manager's hackathons
          const { data: teamMembers, error: teamMembersError } = await supabase
            .from('team_members')
            .select(`
              user_id,
              teams!inner(hackathon_id)
            `)
            .in('teams.hackathon_id', hackathonIds)

          if (teamMembersError) throw teamMembersError

          // Extract unique user IDs
          const userIds = [...new Set(teamMembers.map(tm => tm.user_id))]
          
          // Add manager's ID
          userIds.push(user!.id)

          // Get all profiles for these users (excluding admin users)
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds)
            .neq('role', 'admin')

          if (profilesError) throw profilesError

          setUsers(profiles || [])
        }
      } else {
        // Regular users cannot access this page
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load users',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user && (PermissionService.canManageUsers(user) || PermissionService.isManagerOrAbove(user))) {
      loadUsers()
    }
  }, [user, loadUsers])

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
        // Update existing user
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: values.name,
            role: values.role,
          })
          .eq('id', editingUser.id)

        if (profileError) throw profileError

        notifications.show({
          title: 'Success',
          message: 'User updated successfully',
          color: 'green',
        })
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        })

        if (authError) throw authError

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: authData.user.id,
              name: values.name,
              email: values.email,
              role: values.role,
            }])

          if (profileError) throw profileError

          notifications.show({
            title: 'Success',
            message: 'User created successfully',
            color: 'green',
          })
        }
      }

      form.reset()
      setModalOpened(false)
      setEditingUser(null)
      loadUsers()
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
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Note: In a real app, you'd also need to handle deleting the auth user
      // This requires admin privileges on the auth service

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

  // Filter users based on search and role
  const filteredUsers = users.filter(targetUser => {
    const matchesSearch = targetUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         targetUser.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !roleFilter || targetUser.role === roleFilter
    
    // If current user is a manager (not admin), hide admin users from the list
    const canSeeUser = PermissionService.isAdmin(user!) || targetUser.role !== 'admin'
    
    return matchesSearch && matchesRole && canSeeUser
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
              User Management
            </Title>
            <Text c="dimmed" size="lg">
              {PermissionService.isAdmin(user!) 
                ? 'Manage system users and their roles' 
                : 'Create and manage team members'}
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
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Last Sign In</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedUsers.map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" />
                          <div>
                            <Text fw={500}>{user.name}</Text>
                            <Text size="xs" c="dimmed">{user.email}</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getRoleBadgeColor(user.role)}
                          leftSection={getRoleIcon(user.role)}
                          variant="light"
                        >
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {new Date(user.created_at).toLocaleDateString()}
                      </Table.Td>
                      <Table.Td>
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleEdit(user)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(user.id, user)}
                            disabled={user.id === user.id} // Prevent self-deletion
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
