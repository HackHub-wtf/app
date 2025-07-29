import {
  Group,
  Burger,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  ActionIcon,
  useMantineColorScheme,
  rem,
  Indicator,
} from '@mantine/core'
import {
  IconSun,
  IconMoon,
  IconUser,
  IconSettings,
  IconLogout,
  IconBell,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { NotificationCenter } from '../NotificationCenter'

interface HeaderProps {
  opened: boolean
  toggle: () => void
}

export function Header({ opened, toggle }: HeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Text size="xl" fw={700} c="blue">
          HackHub
        </Text>
      </Group>

      <Group>
        {/* Notifications */}
        <Indicator 
          disabled={false} 
          color="red" 
          size={8}
          processing
        >
          <ActionIcon
            variant="subtle"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            size="md"
          >
            <IconBell style={{ width: rem(18), height: rem(18) }} />
          </ActionIcon>
        </Indicator>

        <ActionIcon
          variant="subtle"
          onClick={() => toggleColorScheme()}
          size="md"
        >
          {colorScheme === 'dark' ? (
            <IconSun style={{ width: rem(18), height: rem(18) }} />
          ) : (
            <IconMoon style={{ width: rem(18), height: rem(18) }} />
          )}
        </ActionIcon>

        <Menu shadow="md" width={200}>
          <Menu.Target>
            <UnstyledButton>
              <Group gap="sm">
                <Avatar
                  src={user?.avatar}
                  alt={user?.name}
                  radius="xl"
                  size="sm"
                />
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={500}>
                    {user?.name}
                  </Text>
                  <Text c="dimmed" size="xs">
                    {user?.role}
                  </Text>
                </div>
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item
              leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => navigate('/profile')}
            >
              Profile
            </Menu.Item>
            <Menu.Item
              leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
            >
              Settings
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item
              color="red"
              leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      
      <NotificationCenter 
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </Group>
  )
}
