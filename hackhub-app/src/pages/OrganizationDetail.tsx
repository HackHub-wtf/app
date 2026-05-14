import { useState } from 'react'
import {
  Container,
  Stack,
  Title,
  Text,
  Badge,
  Group,
  Tabs,
  Card,
  Avatar,
  Select,
  Button,
  Grid,
  Skeleton,
  Alert,
  TextInput,
  ThemeIcon,
  rem,
  Center,
  ActionIcon,
  Tooltip,
  Paper,
  SegmentedControl,
  Divider,
  Modal,
  CopyButton,
  Code,
} from '@mantine/core'
import {
  IconBuilding,
  IconUsers,
  IconTrophy,
  IconSettings,
  IconAlertCircle,
  IconPlus,
  IconEdit,
  IconChevronLeft,
  IconCheck,
  IconX,
  IconLock,
  IconWorld,
  IconUserPlus,
  IconShieldLock,
  IconTrash,
  IconCopy,
  IconMail,
  IconClockHour4,
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'

import { OrganizationService } from '../services/organizationService'
import { HackathonService } from '../services/hackathonService'
import { useAuthStore } from '../store/authStore'

import type { OrgMember, OrgVisibility, OrgJoinPolicy, InvitableRole, OrgInvitation } from '../services/organizationService'
import type { Hackathon } from '../services/hackathonService'

const settingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})
type SettingsFormValues = z.infer<typeof settingsSchema>

function roleBadgeColor(role: OrgMember['role']): string {
  return role === 'owner' ? 'violet' : role === 'manager' ? 'blue' : 'green'
}

function statusColor(status: Hackathon['status']): string {
  return (
    { open: 'blue', running: 'green', completed: 'gray', draft: 'yellow' }[status] ?? 'gray'
  )
}

function statusLabel(status: Hackathon['status']): string {
  return (
    { open: 'Open', running: 'Running', completed: 'Completed', draft: 'Draft' }[status] ?? status
  )
}

export function OrganizationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<OrgMember['role'] | null>(null)
  const [pendingVisibility, setPendingVisibility] = useState<OrgVisibility | null>(null)
  const [pendingJoinPolicy, setPendingJoinPolicy] = useState<OrgJoinPolicy | null>(null)
  const [inviteModalOpened, { open: openInviteModal, close: closeInviteModal }] = useDisclosure(false)
  const [inviteRole, setInviteRole] = useState<InvitableRole>('member')
  const [inviteEmail, setInviteEmail] = useState('')
  const [createdInvitation, setCreatedInvitation] = useState<OrgInvitation | null>(null)

  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => OrganizationService.getOrganization(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', id],
    queryFn: () => OrganizationService.getMembers(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  const { data: hackathonsPage, isLoading: hackathonsLoading } = useQuery({
    queryKey: ['hackathons'],
    queryFn: () => HackathonService.getHackathons(0, 100),
    staleTime: 5 * 60 * 1000,
  })

  const orgHackathons = (hackathonsPage?.content ?? []).filter(
    (h) => h.organizationId === id
  )

  const currentUserMember = members?.find((m) => m.userId === user?.id)
  const isOwnerOrManager =
    user?.role === 'admin' ||
    currentUserMember?.role === 'owner' ||
    currentUserMember?.role === 'manager'

  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string
      role: OrgMember['role']
    }) => OrganizationService.updateMemberRole(id!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', id] })
      notifications.show({
        title: 'Role updated',
        message: 'Member role has been updated.',
        color: 'green',
      })
      setEditingMemberId(null)
      setPendingRole(null)
    },
    onError: (err: Error) => {
      notifications.show({
        title: 'Failed to update role',
        message: err.message,
        color: 'red',
      })
    },
  })

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: { name: org?.name ?? '' },
  })

  const updateOrgMutation = useMutation({
    mutationFn: (data: SettingsFormValues) =>
      OrganizationService.adminUpdateOrganization(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] })
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] })
      notifications.show({
        title: 'Organization updated',
        message: 'Changes have been saved.',
        color: 'green',
      })
    },
    onError: (err: Error) => {
      notifications.show({
        title: 'Failed to update',
        message: err.message,
        color: 'red',
      })
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: { visibility?: OrgVisibility; joinPolicy?: OrgJoinPolicy }) =>
      OrganizationService.updateSettings(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] })
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] })
      notifications.show({ title: 'Settings saved', message: 'Organization policy updated.', color: 'green' })
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Failed to update', message: err.message, color: 'red' })
    },
  })

  const { data: invitations } = useQuery({
    queryKey: ['org-invitations', id],
    queryFn: () => OrganizationService.listInvitations(id!),
    enabled: !!id && isOwnerOrManager,
    staleTime: 30 * 1000,
  })

  const createInvitationMutation = useMutation({
    mutationFn: () =>
      OrganizationService.createInvitation(id!, inviteRole, inviteEmail.trim() || undefined),
    onSuccess: (inv) => {
      setCreatedInvitation(inv)
      queryClient.invalidateQueries({ queryKey: ['org-invitations', id] })
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Failed to create invitation', message: err.message, color: 'red' })
    },
  })

  const revokeInvitationMutation = useMutation({
    mutationFn: (invId: string) => OrganizationService.revokeInvitation(id!, invId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invitations', id] })
      notifications.show({ title: 'Invitation revoked', message: 'The link is no longer valid.', color: 'orange' })
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Failed to revoke', message: err.message, color: 'red' })
    },
  })

  const inviteLink = (inv: OrgInvitation) =>
    `${window.location.origin}/invite/${inv.token}`

  if (orgError) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          Failed to load organization: {(orgError as Error).message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Back + Header */}
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconChevronLeft size={16} />}
            onClick={() => navigate('/organizations')}
            size="sm"
          >
            Organizations
          </Button>
        </Group>

        {orgLoading ? (
          <Skeleton height={80} radius="md" />
        ) : org ? (
          <Paper withBorder p="lg" radius="md">
            <Group justify="space-between">
              <Group gap="md">
                <ThemeIcon size="xl" variant="light" color="blue">
                  <IconBuilding size={28} />
                </ThemeIcon>
                <div>
                  <Title order={2}>{org.name}</Title>
                  <Text c="dimmed" size="sm">
                    /{org.slug}
                  </Text>
                </div>
              </Group>
              <Group>
                {org.visibility === 'open' ? (
                  <Badge color="teal" variant="light" leftSection={<IconWorld size={12} />}>Open</Badge>
                ) : (
                  <Badge color="gray" variant="light" leftSection={<IconLock size={12} />}>Closed</Badge>
                )}
                {org.joinPolicy === 'invite_only' && (
                  <Badge color="orange" variant="light" leftSection={<IconUserPlus size={12} />}>Invite only</Badge>
                )}
                {currentUserMember && (
                  <Badge color={roleBadgeColor(currentUserMember.role)} variant="light" size="lg">
                    {currentUserMember.role}
                  </Badge>
                )}
              </Group>
            </Group>
            {org.description && (
              <Text mt="sm" size="sm" c="dimmed">
                {org.description}
              </Text>
            )}
          </Paper>
        ) : null}

        {/* Tabs */}
        <Tabs defaultValue="hackathons">
          <Tabs.List>
            <Tabs.Tab value="hackathons" leftSection={<IconTrophy size={16} />}>
              Hackathons
            </Tabs.Tab>
            <Tabs.Tab value="members" leftSection={<IconUsers size={16} />}>
              Members
            </Tabs.Tab>
            {isOwnerOrManager && (
              <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                Settings
              </Tabs.Tab>
            )}
          </Tabs.List>

          {/* Hackathons Tab */}
          <Tabs.Panel value="hackathons" pt="md">
            <Stack gap="md">
              <Group justify="flex-end">
                {isOwnerOrManager && (
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() =>
                      navigate(`/hackathons/create?organizationId=${id}`)
                    }
                  >
                    Create Hackathon
                  </Button>
                )}
              </Group>

              {hackathonsLoading ? (
                <Grid>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Grid.Col key={i} span={{ base: 12, md: 6 }}>
                      <Skeleton height={100} radius="md" />
                    </Grid.Col>
                  ))}
                </Grid>
              ) : orgHackathons.length > 0 ? (
                <Grid>
                  {orgHackathons.map((h) => (
                    <Grid.Col key={h.id} span={{ base: 12, md: 6 }}>
                      <Card
                        withBorder
                        radius="md"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/hackathons/${h.id}`)}
                      >
                        <Group justify="space-between" mb="xs">
                          <Text fw={600}>{h.title}</Text>
                          <Badge color={statusColor(h.status)} variant="light">
                            {statusLabel(h.status)}
                          </Badge>
                        </Group>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {h.description}
                        </Text>
                        <Text size="xs" c="dimmed" mt="sm">
                          {new Date(h.startDate).toLocaleDateString()} –{' '}
                          {new Date(h.endDate).toLocaleDateString()}
                        </Text>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              ) : (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <ThemeIcon size={64} variant="light" color="gray">
                      <IconTrophy style={{ width: rem(32), height: rem(32) }} />
                    </ThemeIcon>
                    <Text c="dimmed">No hackathons yet for this organization</Text>
                    {isOwnerOrManager && (
                      <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() =>
                          navigate(`/hackathons/create?organizationId=${id}`)
                        }
                      >
                        Create First Hackathon
                      </Button>
                    )}
                  </Stack>
                </Center>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Members Tab */}
          <Tabs.Panel value="members" pt="md">
            {/* Invite button (owners/managers only) */}
            {isOwnerOrManager && (
              <Group justify="flex-end" mb="sm">
                <Button
                  leftSection={<IconUserPlus size={16} />}
                  onClick={() => { setCreatedInvitation(null); setInviteEmail(''); setInviteRole('member'); openInviteModal() }}
                  size="sm"
                >
                  Invite Member
                </Button>
              </Group>
            )}

            {membersLoading ? (
              <Stack gap="sm">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height={56} radius="md" />
                ))}
              </Stack>
            ) : members && members.length > 0 ? (
              <Stack gap="sm">
                {members.map((member) => (
                  <Card key={member.id} withBorder radius="md">
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Avatar
                          radius="xl"
                          size="md"
                          color="blue"
                        >
                          {member.name?.charAt(0).toUpperCase() ?? '?'}
                        </Avatar>
                        <div>
                          <Text fw={500} size="sm">
                            {member.name ?? member.userId}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {member.email}
                          </Text>
                        </div>
                      </Group>

                      <Group gap="sm">
                        {isOwnerOrManager && editingMemberId === member.id ? (
                          <Group gap="xs">
                            <Select
                              size="xs"
                              w={120}
                              data={[
                                { value: 'owner', label: 'Owner' },
                                { value: 'manager', label: 'Manager' },
                                { value: 'member', label: 'Member' },
                              ]}
                              value={pendingRole ?? member.role}
                              onChange={(val) =>
                                setPendingRole(val as OrgMember['role'])
                              }
                            />
                            <Tooltip label="Save">
                              <ActionIcon
                                size="sm"
                                color="green"
                                variant="light"
                                loading={updateRoleMutation.isPending}
                                onClick={() => {
                                  if (pendingRole) {
                                    updateRoleMutation.mutate({
                                      userId: member.userId,
                                      role: pendingRole,
                                    })
                                  }
                                }}
                              >
                                <IconCheck size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Cancel">
                              <ActionIcon
                                size="sm"
                                color="gray"
                                variant="light"
                                onClick={() => {
                                  setEditingMemberId(null)
                                  setPendingRole(null)
                                }}
                              >
                                <IconX size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        ) : (
                          <Group gap="xs">
                            <Badge
                              color={roleBadgeColor(member.role)}
                              variant="light"
                            >
                              {member.role}
                            </Badge>
                            {isOwnerOrManager && member.userId !== user?.id && (
                              <Tooltip label="Change role">
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() => {
                                    setEditingMemberId(member.id)
                                    setPendingRole(member.role)
                                  }}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        )}
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size={64} variant="light" color="gray">
                    <IconUsers style={{ width: rem(32), height: rem(32) }} />
                  </ThemeIcon>
                  <Text c="dimmed">No members found</Text>
                </Stack>
              </Center>
            )}

            {/* Pending invitations (owners/managers only) */}
            {isOwnerOrManager && invitations && invitations.length > 0 && (
              <Stack gap="xs" mt="lg">
                <Group gap="xs">
                  <IconClockHour4 size={16} />
                  <Text fw={600} size="sm">Pending invitations ({invitations.length})</Text>
                </Group>
                {invitations.map((inv) => (
                  <Card key={inv.id} withBorder radius="md" p="sm">
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Badge color={roleBadgeColor(inv.invitedRole)} variant="light" size="sm">
                          {inv.invitedRole}
                        </Badge>
                        {inv.invitedEmail && (
                          <Group gap="xs">
                            <IconMail size={14} />
                            <Text size="xs" c="dimmed">{inv.invitedEmail}</Text>
                          </Group>
                        )}
                        <Text size="xs" c="dimmed">
                          Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <CopyButton value={inviteLink(inv)}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
                              <ActionIcon size="sm" variant="light" color={copied ? 'green' : 'blue'} onClick={copy}>
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                        <Tooltip label="Revoke invitation">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            loading={revokeInvitationMutation.isPending}
                            onClick={() => revokeInvitationMutation.mutate(inv.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          {/* Settings Tab */}
          {isOwnerOrManager && (
            <Tabs.Panel value="settings" pt="md">
              <Stack gap="md" maw={520}>
                {/* Name */}
                <Card withBorder radius="md">
                  <Stack gap="md">
                    <Text fw={600}>Organization Name</Text>
                    <form onSubmit={settingsForm.handleSubmit((data) => updateOrgMutation.mutate(data))}>
                      <Stack gap="md">
                        <TextInput
                          label="Display Name"
                          error={settingsForm.formState.errors.name?.message}
                          {...settingsForm.register('name')}
                        />
                        <Group justify="flex-end">
                          <Button type="submit" loading={updateOrgMutation.isPending}>
                            Save
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  </Stack>
                </Card>

                {/* Visibility */}
                <Card withBorder radius="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconWorld size={18} />
                      <Text fw={600}>Visibility</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      <b>Open</b> — non-members can see this org's profile before joining.{' '}
                      <b>Closed</b> — org is invisible to non-members.
                    </Text>
                    <SegmentedControl
                      value={pendingVisibility ?? org?.visibility ?? 'closed'}
                      onChange={(v) => setPendingVisibility(v as OrgVisibility)}
                      data={[
                        { label: 'Closed', value: 'closed' },
                        { label: 'Open', value: 'open' },
                      ]}
                    />
                    <Divider />
                    <Group gap="xs">
                      <IconShieldLock size={18} />
                      <Text fw={600}>Join Policy</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      <b>Self-register</b> — anyone can join via slug.{' '}
                      <b>Invite only</b> — requires an invitation link.
                    </Text>
                    <SegmentedControl
                      value={pendingJoinPolicy ?? org?.joinPolicy ?? 'self_register'}
                      onChange={(v) => setPendingJoinPolicy(v as OrgJoinPolicy)}
                      data={[
                        { label: 'Self-register', value: 'self_register' },
                        { label: 'Invite only', value: 'invite_only' },
                      ]}
                    />
                    <Group justify="flex-end">
                      <Button
                        loading={updateSettingsMutation.isPending}
                        disabled={!pendingVisibility && !pendingJoinPolicy}
                        onClick={() =>
                          updateSettingsMutation.mutate({
                            visibility: pendingVisibility ?? undefined,
                            joinPolicy: pendingJoinPolicy ?? undefined,
                          })
                        }
                      >
                        Save Policy
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </Stack>
            </Tabs.Panel>
          )}
        </Tabs>
      </Stack>

      {/* Invite Member Modal */}
      <Modal
        opened={inviteModalOpened}
        onClose={() => { closeInviteModal(); setCreatedInvitation(null) }}
        title="Invite Member"
        size="md"
      >
        {createdInvitation ? (
          <Stack gap="md">
            <Alert icon={<IconCheck size={16} />} color="green" title="Invitation created">
              Share this link with the person you want to invite. It expires on{' '}
              {new Date(createdInvitation.expiresAt).toLocaleDateString()}.
            </Alert>
            <Code block style={{ wordBreak: 'break-all' }}>
              {inviteLink(createdInvitation)}
            </Code>
            <CopyButton value={inviteLink(createdInvitation)}>
              {({ copied, copy }) => (
                <Button
                  fullWidth
                  leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  color={copied ? 'green' : 'blue'}
                  onClick={copy}
                >
                  {copied ? 'Copied to clipboard!' : 'Copy invite link'}
                </Button>
              )}
            </CopyButton>
            <Button variant="light" onClick={() => { closeInviteModal(); setCreatedInvitation(null) }}>
              Done
            </Button>
          </Stack>
        ) : (
          <Stack gap="md">
            <Select
              label="Role"
              description="What role will this person have?"
              required
              value={inviteRole}
              onChange={(v) => setInviteRole((v as InvitableRole) ?? 'member')}
              data={[
                { value: 'member', label: 'Member — participate in hackathons' },
                ...(currentUserMember?.role === 'owner' || user?.role === 'admin'
                  ? [{ value: 'manager', label: 'Manager — create hackathons, manage members' }]
                  : []),
                { value: 'judge', label: 'Judge — assigned to score hackathons' },
              ]}
            />
            <TextInput
              label="Email (optional)"
              description="Shown on the pending invitations list for reference"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Alert icon={<IconLock size={14} />} color="blue" variant="light">
              The generated link is single-use and expires in 7 days. Anyone with the link can
              join — do not share it publicly.
            </Alert>
            <Group justify="flex-end">
              <Button variant="light" onClick={closeInviteModal}>Cancel</Button>
              <Button
                leftSection={<IconUserPlus size={16} />}
                loading={createInvitationMutation.isPending}
                onClick={() => createInvitationMutation.mutate()}
              >
                Generate invite link
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  )
}
