import { NavLink, Stack, Text, ThemeIcon, Group, Badge } from '@mantine/core'
import {
  IconDashboard,
  IconTrophy,
  IconUsers,
  IconBulb,
  IconUser,
  IconPlus,
  IconPresentation,
  IconShield,
  IconBuilding,
} from '@tabler/icons-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useHackathonStore } from '../../store/hackathonStore'
import { PermissionService } from '../../utils/permissions'

const navigationItems = [
  {
    label: 'Dashboard',
    icon: IconDashboard,
    path: '/',
    description: 'Overview and analytics',
  },
  {
    label: 'Hackathons',
    icon: IconTrophy,
    path: '/hackathons',
    description: 'Browse and manage events',
  },
  {
    label: 'Teams',
    icon: IconUsers,
    path: '/teams',
    description: 'Join or create teams',
  },
  {
    label: 'Ideas',
    icon: IconBulb,
    path: '/ideas',
    description: 'Share and vote on ideas',
  },
  {
    label: 'Projects',
    icon: IconPresentation,
    path: '/projects',
    description: 'Showcase and discover projects',
  },
  {
    label: 'Profile',
    icon: IconUser,
    path: '/profile',
    description: 'Manage your account',
  },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hackathons } = useHackathonStore()

  const isManager = user?.role === 'manager'
  const isAdmin = user && PermissionService.canManageUsers(user)
  const activeHackathons = hackathons.filter(h => h.status === 'running').length

  return (
    <Stack gap="xs">
      <Text size="xs" fw={500} c="dimmed" tt="uppercase" mb="sm">
        Navigation
      </Text>

      {navigationItems.map((item) => (
        <NavLink
          key={item.path}
          label={
            <Group justify="space-between" w="100%">
              <Text size="sm">{item.label}</Text>
              {item.path === '/hackathons' && activeHackathons > 0 && (
                <Badge size="xs" variant="light" color="green">
                  {activeHackathons}
                </Badge>
              )}
            </Group>
          }
          description={item.description}
          leftSection={
            <ThemeIcon variant="light" size="sm">
              <item.icon size={16} />
            </ThemeIcon>
          }
          active={location.pathname === item.path}
          onClick={() => navigate(item.path)}
          variant="subtle"
        />
      ))}

      {(isAdmin || isManager) && (
        <>
          <Text size="xs" fw={500} c="dimmed" tt="uppercase" mt="lg" mb="sm">
            {isAdmin ? 'Admin Panel' : 'Management'}
          </Text>
          
          {isManager && !isAdmin && (
            <NavLink
              label="Create Hackathon"
              description="Start a new event"
              leftSection={
                <ThemeIcon variant="light" size="sm" color="blue">
                  <IconPlus size={16} />
                </ThemeIcon>
              }
              onClick={() => navigate('/hackathons/create')}
              variant="subtle"
            />
          )}
          
          <NavLink
            label="Manage Users"
            description={isAdmin ? "Create and manage user accounts" : "Create team members"}
            leftSection={
              <ThemeIcon variant="light" size="sm" color={isAdmin ? "red" : "blue"}>
                <IconShield size={16} />
              </ThemeIcon>
            }
            active={location.pathname === '/admin/users'}
            onClick={() => navigate('/admin/users')}
            variant="subtle"
          />
          
          {isAdmin && (
            <NavLink
              label="Manage Organizations"
              description="View and manage all organizations"
              leftSection={
                <ThemeIcon variant="light" size="sm" color="purple">
                  <IconBuilding size={16} />
                </ThemeIcon>
              }
              active={location.pathname === '/admin/organizations'}
              onClick={() => navigate('/admin/organizations')}
              variant="subtle"
            />
          )}
        </>
      )}

      <Text size="xs" c="dimmed" mt="auto" pt="lg">
        Welcome, {user?.name}
      </Text>
    </Stack>
  )
}
