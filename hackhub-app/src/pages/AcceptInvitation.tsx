import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Button,
  Center,
  Loader,
  Alert,
  Badge,
  ThemeIcon,
  rem,
  Group,
} from '@mantine/core'
import {
  IconBuilding,
  IconAlertCircle,
  IconCheck,
  IconUserPlus,
  IconLock,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../store/authStore'
import { OrganizationService } from '../services/organizationService'
import type { InvitationPreview } from '../services/organizationService'

const roleBadgeColor = (role: string) =>
  role === 'manager' ? 'blue' : role === 'judge' ? 'indigo' : 'green'

const roleLabel = (role: string) =>
  role === 'manager' ? 'Manager' : role === 'judge' ? 'Judge' : 'Member'

export function AcceptInvitation() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    OrganizationService.previewInvitation(token)
      .then((data) => {
        setPreview(data)
        setOrgId(data.organizationId)
      })
      .catch(() => setLoadError('This invitation link is invalid or has expired.'))
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    if (!user) {
      // Preserve token in redirect so user comes back after login
      sessionStorage.setItem('pendingInviteToken', token)
      navigate(`/login?redirect=/invite/${token}`)
      return
    }
    setAccepting(true)
    try {
      await OrganizationService.acceptInvitation(token)
      setAccepted(true)
      notifications.show({
        title: 'Welcome!',
        message: `You joined ${preview?.organizationName}.`,
        color: 'green',
      })
    } catch (err) {
      notifications.show({
        title: 'Could not accept invitation',
        message: err instanceof Error ? err.message : 'Unknown error',
        color: 'red',
      })
    } finally {
      setAccepting(false)
    }
  }

  if (!preview && !loadError) {
    return (
      <Container size="sm" py="xl">
        <Center py="xl">
          <Loader />
        </Center>
      </Container>
    )
  }

  if (loadError) {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Invalid invitation">
          {loadError}
        </Alert>
        <Button mt="md" variant="light" onClick={() => navigate('/')}>
          Go home
        </Button>
      </Container>
    )
  }

  if (accepted) {
    return (
      <Container size="sm" py="xl">
        <Card withBorder radius="md" p="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} color="green" variant="light" radius="xl">
              <IconCheck style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Title order={2}>You're in!</Title>
            <Text c="dimmed" ta="center">
              You joined <b>{preview!.organizationName}</b> as a{' '}
              <b>{roleLabel(preview!.invitedRole)}</b>.
            </Text>
            <Button onClick={() => navigate(`/organizations/${orgId}`)}>
              Go to {preview!.organizationName}
            </Button>
          </Stack>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Card withBorder radius="md" p="xl">
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} color="blue" variant="light" radius="xl">
              <IconBuilding style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>

            <Stack align="center" gap="xs">
              <Title order={2} ta="center">
                You've been invited to join
              </Title>
              <Title order={1} ta="center">
                {preview!.organizationName}
              </Title>
            </Stack>

            <Group gap="sm">
              <Text size="sm" c="dimmed">You'll join as:</Text>
              <Badge
                size="lg"
                color={roleBadgeColor(preview!.invitedRole)}
                variant="light"
              >
                {roleLabel(preview!.invitedRole)}
              </Badge>
            </Group>

            <Text size="xs" c="dimmed">
              Invitation expires{' '}
              {new Date(preview!.expiresAt).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            {!user && (
              <Alert
                icon={<IconLock size={16} />}
                color="blue"
                variant="light"
                style={{ width: '100%' }}
              >
                You need to be logged in to accept this invitation. Click below and you'll be
                brought back here automatically.
              </Alert>
            )}

            <Button
              size="lg"
              leftSection={<IconUserPlus size={18} />}
              loading={accepting}
              onClick={handleAccept}
              fullWidth
            >
              {user ? `Accept & Join ${preview!.organizationName}` : 'Log in to accept'}
            </Button>

            <Button variant="subtle" size="sm" onClick={() => navigate('/')}>
              Decline
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
