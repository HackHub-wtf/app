import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Loader,
  Alert,
  Center,
  ThemeIcon,
  rem,
  Paper,
  SegmentedControl,
  ActionIcon,
  Table,
  Progress,
} from '@mantine/core'
import {
  IconTrophy,
  IconAlertCircle,
  IconArrowLeft,
  IconBulb,
  IconHeart,
  IconDownload,
  IconStar,
  IconMedal,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { IdeaService } from '../services/ideaService'
import type { Idea } from '../services/ideaService'

type SortMode = 'score' | 'votes'

interface RankedIdea extends Idea {
  rank: number
}

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉']

function getMedalColor(rank: number): string {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return ''
}

function getPodiumColor(rank: number): string {
  if (rank === 1) return 'yellow'
  if (rank === 2) return 'gray'
  if (rank === 3) return 'orange'
  return 'blue'
}

function LeaderboardRow({ idea, maxScore, maxVotes }: { idea: RankedIdea; maxScore: number; maxVotes: number }): React.ReactElement {
  const isTopThree = idea.rank <= 3
  const medalColor = getMedalColor(idea.rank)

  return (
    <Table.Tr
      style={{
        backgroundColor: isTopThree ? `${medalColor}15` : undefined,
        borderLeft: isTopThree ? `3px solid ${medalColor}` : '3px solid transparent',
      }}
    >
      <Table.Td>
        <Group gap="xs" justify="center">
          {idea.rank <= 3 ? (
            <Text size="xl">{MEDAL_EMOJIS[idea.rank - 1]}</Text>
          ) : (
            <Text fw={700} c="dimmed" size="sm" style={{ minWidth: rem(24), textAlign: 'center' }}>
              {idea.rank}
            </Text>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Stack gap={2}>
          <Text fw={isTopThree ? 700 : 500} size={isTopThree ? 'md' : 'sm'}>
            {idea.title}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {idea.description}
          </Text>
          <Group gap="xs" mt={2}>
            {idea.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} size="xs" variant="outline">
                {tag}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {idea.teamId ? idea.teamId.slice(0, 8) + '…' : '—'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Stack gap={4}>
          <Group gap="xs">
            <IconStar size={14} color="var(--mantine-color-yellow-5)" />
            <Text fw={700} size="sm" c={isTopThree ? getPodiumColor(idea.rank) : undefined}>
              {idea.totalScore.toFixed(1)}
            </Text>
          </Group>
          <Progress
            value={(idea.totalScore / (maxScore || 10)) * 100}
            size="xs"
            color={getPodiumColor(idea.rank)}
          />
        </Stack>
      </Table.Td>
      <Table.Td>
        <Stack gap={4}>
          <Group gap="xs">
            <IconHeart size={14} color="var(--mantine-color-red-5)" />
            <Text fw={isTopThree ? 700 : 500} size="sm">
              {idea.voteCount}
            </Text>
          </Group>
          <Progress
            value={(idea.voteCount / (maxVotes || 1)) * 100}
            size="xs"
            color="red"
          />
        </Stack>
      </Table.Td>
    </Table.Tr>
  )
}

interface LeaderboardProps {
  hackathonId?: string
}

export function Leaderboard({ hackathonId: propHackathonId }: LeaderboardProps = {}): React.ReactElement {
  const { hackathonId: paramHackathonId } = useParams<{ hackathonId: string }>()
  const hackathonId = propHackathonId ?? paramHackathonId
  const navigate = useNavigate()
  const [sortMode, setSortMode] = useState<SortMode>('score')

  const {
    data: ideasPage,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['leaderboard-ideas', hackathonId],
    queryFn: () => IdeaService.getIdeas(hackathonId!, 0, 200),
    enabled: !!hackathonId,
    staleTime: 60 * 1000,
  })

  const handleExport = (): void => {
    notifications.show({
      title: 'Coming soon',
      message: 'Leaderboard export will be available in a future release.',
      color: 'blue',
      icon: <IconDownload size={16} />,
    })
  }

  const ideas: Idea[] = ideasPage?.content ?? []

  const rankedIdeas: RankedIdea[] = [...ideas]
    .sort((a, b) => {
      if (sortMode === 'score') {
        return b.totalScore - a.totalScore || b.voteCount - a.voteCount
      }
      return b.voteCount - a.voteCount || b.totalScore - a.totalScore
    })
    .map((idea, index) => ({ ...idea, rank: index + 1 }))

  const maxScore = Math.max(...ideas.map((i) => i.totalScore), 0)
  const maxVotes = Math.max(...ideas.map((i) => i.voteCount), 0)

  const topThree = rankedIdeas.slice(0, 3)

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="sm" mb="xs">
              {hackathonId && (
                <ActionIcon
                  variant="subtle"
                  onClick={() => navigate(`/hackathons/${hackathonId}`)}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              )}
              <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                <IconTrophy size={20} />
              </ThemeIcon>
              <Title order={2}>Leaderboard</Title>
            </Group>
            <Text c="dimmed" ml={hackathonId ? rem(76) : rem(44)}>
              Live rankings for all submitted ideas
            </Text>
          </div>
          <Group gap="sm">
            <SegmentedControl
              value={sortMode}
              onChange={(val) => setSortMode(val as SortMode)}
              data={[
                { label: 'By Score', value: 'score' },
                { label: 'By Votes', value: 'votes' },
              ]}
              size="sm"
            />
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              onClick={handleExport}
              size="sm"
            >
              Export
            </Button>
          </Group>
        </Group>

        {isLoading && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" color="yellow" />
              <Text c="dimmed">Loading rankings…</Text>
            </Stack>
          </Center>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {error instanceof Error ? error.message : 'Failed to load leaderboard.'}
          </Alert>
        )}

        {!isLoading && !error && rankedIdeas.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <ThemeIcon size={64} variant="light" color="yellow" radius="xl">
                <IconBulb size={32} />
              </ThemeIcon>
              <Text fw={500}>No ideas yet</Text>
              <Text size="sm" c="dimmed">
                Rankings will appear once ideas are submitted and scored.
              </Text>
            </Stack>
          </Center>
        )}

        {!isLoading && !error && topThree.length > 0 && (
          <Group grow gap="md" align="stretch">
            {topThree.map((idea) => (
              <Paper
                key={idea.id}
                p="lg"
                withBorder
                radius="md"
                style={{
                  borderColor: getMedalColor(idea.rank),
                  borderWidth: 2,
                  background: `linear-gradient(135deg, ${getMedalColor(idea.rank)}20, transparent)`,
                }}
              >
                <Stack gap="sm" align="center">
                  <Text style={{ fontSize: rem(36) }}>{MEDAL_EMOJIS[idea.rank - 1]}</Text>
                  <Badge size="lg" color={getPodiumColor(idea.rank)} variant="filled">
                    #{idea.rank}
                  </Badge>
                  <Text fw={700} ta="center" lineClamp={2}>
                    {idea.title}
                  </Text>
                  <Group gap="lg">
                    <Group gap="xs">
                      <IconStar size={16} color={getMedalColor(idea.rank)} />
                      <Text fw={700}>{idea.totalScore.toFixed(1)}</Text>
                    </Group>
                    <Group gap="xs">
                      <IconHeart size={16} color="var(--mantine-color-red-5)" />
                      <Text fw={500}>{idea.voteCount}</Text>
                    </Group>
                  </Group>
                  <Group gap="xs">
                    <IconMedal size={14} color="gray" />
                    <Text size="xs" c="dimmed">
                      {idea.category}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Group>
        )}

        {!isLoading && !error && rankedIdeas.length > 0 && (
          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: rem(60), textAlign: 'center' }}>Rank</Table.Th>
                  <Table.Th>Idea</Table.Th>
                  <Table.Th style={{ width: rem(100) }}>Team</Table.Th>
                  <Table.Th style={{ width: rem(140) }}>
                    <Group gap="xs">
                      <IconStar size={14} />
                      Score
                    </Group>
                  </Table.Th>
                  <Table.Th style={{ width: rem(120) }}>
                    <Group gap="xs">
                      <IconHeart size={14} />
                      Votes
                    </Group>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rankedIdeas.map((idea) => (
                  <LeaderboardRow
                    key={idea.id}
                    idea={idea}
                    maxScore={maxScore}
                    maxVotes={maxVotes}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
