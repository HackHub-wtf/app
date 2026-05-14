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
  Slider,
  Loader,
  Alert,
  Center,
  ThemeIcon,
  rem,
  Divider,
  Paper,
  Progress,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconTrophy,
  IconAlertCircle,
  IconCheck,
  IconArrowLeft,
  IconBulb,
  IconUsers,
  IconStar,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../store/authStore'
import { VotingService } from '../services/votingService'
import { IdeaService } from '../services/ideaService'
import { PermissionService } from '../utils/permissions'
import type { Idea } from '../services/ideaService'
import type { VotingCriteria } from '../services/votingService'

interface IdeaScores {
  [criteriaId: string]: number
}

interface ScoredIdea {
  ideaId: string
  scores: IdeaScores
}

function IdeaJudgingCard({
  idea,
  criteria,
  onScoreSubmit,
  isSubmitting,
  alreadyScored,
}: {
  idea: Idea
  criteria: VotingCriteria[]
  onScoreSubmit: (ideaId: string, scores: IdeaScores) => void
  isSubmitting: boolean
  alreadyScored: boolean
}) {
  const [scores, setScores] = useState<IdeaScores>(() =>
    Object.fromEntries(criteria.map((c) => [c.id, 5]))
  )
  const [expanded, setExpanded] = useState(false)

  const allScored = criteria.every((c) => scores[c.id] !== undefined)
  const averageScore =
    criteria.length > 0
      ? criteria.reduce((sum, c) => sum + (scores[c.id] ?? 5) * (c.weight / 100), 0)
      : 0

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'green'
    if (score >= 6) return 'blue'
    if (score >= 4) return 'yellow'
    return 'red'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 9) return 'Excellent'
    if (score >= 7) return 'Good'
    if (score >= 5) return 'Average'
    if (score >= 3) return 'Below Average'
    return 'Poor'
  }

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Group gap="sm" mb="xs">
              <Text fw={700} size="lg">
                {idea.title}
              </Text>
              {alreadyScored && (
                <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                  Scored
                </Badge>
              )}
            </Group>
            <Text size="sm" c="dimmed" lineClamp={expanded ? undefined : 2}>
              {idea.description}
            </Text>
            {idea.description.length > 120 && (
              <ActionIcon
                variant="subtle"
                size="xs"
                onClick={() => setExpanded((v) => !v)}
                mt={4}
              >
                {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </ActionIcon>
            )}
          </div>
          <Stack align="flex-end" gap="xs">
            <Badge size="lg" variant="filled" color={getScoreColor(averageScore)}>
              {averageScore.toFixed(1)}
            </Badge>
            <Text size="xs" c="dimmed">
              weighted avg
            </Text>
          </Stack>
        </Group>

        <Group gap="md">
          {idea.teamId && (
            <Group gap="xs">
              <IconUsers size={14} color="gray" />
              <Text size="xs" c="dimmed">
                Team ID: {idea.teamId.slice(0, 8)}…
              </Text>
            </Group>
          )}
          <Group gap="xs">
            <IconBulb size={14} color="gray" />
            <Text size="xs" c="dimmed">
              {idea.category}
            </Text>
          </Group>
          {idea.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} size="xs" variant="outline">
              {tag}
            </Badge>
          ))}
        </Group>

        {alreadyScored ? (
          <Alert icon={<IconCheck size={16} />} color="green" variant="light">
            You have already scored this idea. Scores cannot be changed after submission.
          </Alert>
        ) : (
          <>
            <Divider label="Score each criterion" labelPosition="center" />

            <Stack gap="lg">
              {criteria.map((criterion) => {
                const score = scores[criterion.id] ?? 5
                return (
                  <Paper key={criterion.id} p="md" withBorder radius="sm">
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <div>
                          <Group gap="xs">
                            <Text fw={600} size="sm">
                              {criterion.name}
                            </Text>
                            <Badge size="xs" variant="light" color="gray">
                              {criterion.weight}%
                            </Badge>
                          </Group>
                          {criterion.description && (
                            <Text size="xs" c="dimmed" mt={2}>
                              {criterion.description}
                            </Text>
                          )}
                        </div>
                        <Group gap="xs" align="center">
                          <Text
                            fw={700}
                            size="xl"
                            c={getScoreColor(score)}
                            style={{ minWidth: rem(32), textAlign: 'center' }}
                          >
                            {score}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {getScoreLabel(score)}
                          </Text>
                        </Group>
                      </Group>
                      <Slider
                        value={score}
                        onChange={(val) =>
                          setScores((prev) => ({ ...prev, [criterion.id]: val }))
                        }
                        min={1}
                        max={10}
                        step={1}
                        marks={[
                          { value: 1, label: '1' },
                          { value: 5, label: '5' },
                          { value: 10, label: '10' },
                        ]}
                        color={getScoreColor(score)}
                        size="lg"
                      />
                    </Stack>
                  </Paper>
                )
              })}
            </Stack>

            <Group justify="space-between" align="center">
              <div>
                <Text size="sm" c="dimmed">
                  Weighted score preview
                </Text>
                <Progress
                  value={(averageScore / 10) * 100}
                  color={getScoreColor(averageScore)}
                  size="sm"
                  style={{ width: 200 }}
                  mt={4}
                />
              </div>
              <Button
                leftSection={<IconStar size={16} />}
                disabled={!allScored || isSubmitting}
                loading={isSubmitting}
                onClick={() => onScoreSubmit(idea.id, scores)}
                color="indigo"
              >
                Submit Scores
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Card>
  )
}

export function JudgingPanel(): React.ReactElement {
  const { hackathonId } = useParams<{ hackathonId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [scoredIdeas, setScoredIdeas] = useState<Set<string>>(new Set())
  const [submittingIdea, setSubmittingIdea] = useState<string | null>(null)

  const canJudge =
    user !== null && PermissionService.isManagerOrAbove(user)

  const {
    data: criteria,
    isLoading: criteriaLoading,
    error: criteriaError,
  } = useQuery({
    queryKey: ['voting-criteria', hackathonId],
    queryFn: () => VotingService.getCriteria(hackathonId!),
    enabled: !!hackathonId && canJudge,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: ideasPage,
    isLoading: ideasLoading,
    error: ideasError,
  } = useQuery({
    queryKey: ['judging-ideas', hackathonId],
    queryFn: () => IdeaService.getIdeas(hackathonId!, 0, 100),
    enabled: !!hackathonId && canJudge,
    staleTime: 2 * 60 * 1000,
  })

  const scoreIdeaMutation = useMutation({
    mutationFn: async ({ ideaId, scores }: ScoredIdea) => {
      const entries = Object.entries(scores)
      for (const [criteriaId, score] of entries) {
        await VotingService.scoreIdea(ideaId, criteriaId, score)
      }
      return ideaId
    },
    onSuccess: (ideaId) => {
      setScoredIdeas((prev) => new Set(prev).add(ideaId))
      setSubmittingIdea(null)
      queryClient.invalidateQueries({ queryKey: ['judging-ideas', hackathonId] })
      notifications.show({
        title: 'Scores submitted',
        message: 'Your scores have been recorded successfully.',
        color: 'green',
      })
    },
    onError: (error) => {
      setSubmittingIdea(null)
      notifications.show({
        title: 'Failed to submit scores',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red',
      })
    },
  })

  const handleScoreSubmit = (ideaId: string, scores: IdeaScores): void => {
    setSubmittingIdea(ideaId)
    scoreIdeaMutation.mutate({ ideaId, scores })
  }

  if (!canJudge) {
    return (
      <Container size="md" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} variant="light" color="red">
              <IconAlertCircle style={{ width: rem(40), height: rem(40) }} />
            </ThemeIcon>
            <Title order={3}>Access Denied</Title>
            <Text ta="center" c="dimmed">
              Only hackathon organizers and administrators can access the judging panel.
            </Text>
            <Button variant="light" onClick={() => navigate(`/hackathons/${hackathonId}`)}>
              Back to Hackathon
            </Button>
          </Stack>
        </Center>
      </Container>
    )
  }

  const isLoading = criteriaLoading || ideasLoading
  const hasError = criteriaError ?? ideasError
  const ideas: Idea[] = ideasPage?.content ?? []
  const submittedIdeas = ideas.filter(
    (i) => i.status === 'submitted' || i.status === 'in-progress' || i.status === 'completed'
  )

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="sm" mb="xs">
              <ActionIcon
                variant="subtle"
                onClick={() => navigate(`/hackathons/${hackathonId}`)}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
              <ThemeIcon size="lg" variant="light" color="indigo">
                <IconTrophy size={20} />
              </ThemeIcon>
              <Title order={2}>Judging Panel</Title>
            </Group>
            <Text c="dimmed" ml={rem(76)}>
              Score each idea against the defined criteria. Scores are final once submitted.
            </Text>
          </div>
          <Tooltip label="View leaderboard">
            <Button
              variant="light"
              color="yellow"
              leftSection={<IconTrophy size={16} />}
              onClick={() => navigate(`/hackathons/${hackathonId}/leaderboard`)}
            >
              Leaderboard
            </Button>
          </Tooltip>
        </Group>

        {isLoading && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Loading ideas and criteria…</Text>
            </Stack>
          </Center>
        )}

        {hasError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {hasError instanceof Error ? hasError.message : 'Failed to load data.'}
          </Alert>
        )}

        {!isLoading && !hasError && criteria && criteria.length === 0 && (
          <Alert icon={<IconAlertCircle size={16} />} color="yellow">
            No voting criteria defined for this hackathon. Set up criteria in the hackathon
            settings before scoring ideas.
          </Alert>
        )}

        {!isLoading && !hasError && submittedIdeas.length === 0 && (ideas.length > 0 || ideasPage) && (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <ThemeIcon size={64} variant="light" color="blue" radius="xl">
                <IconBulb size={32} />
              </ThemeIcon>
              <Text fw={500}>No ideas to judge</Text>
              <Text size="sm" c="dimmed">
                There are no submitted ideas in this hackathon yet.
              </Text>
            </Stack>
          </Center>
        )}

        {!isLoading && !hasError && criteria && criteria.length > 0 && (
          <Stack gap="md">
            <Group gap="sm">
              <Badge size="lg" variant="light" color="indigo">
                {submittedIdeas.length} ideas to judge
              </Badge>
              <Badge size="lg" variant="light" color="green">
                {scoredIdeas.size} scored
              </Badge>
              {criteria.length > 0 && (
                <Badge size="lg" variant="light" color="gray">
                  {criteria.length} criteria
                </Badge>
              )}
            </Group>

            {submittedIdeas.map((idea) => (
              <IdeaJudgingCard
                key={idea.id}
                idea={idea}
                criteria={criteria}
                onScoreSubmit={handleScoreSubmit}
                isSubmitting={submittingIdea === idea.id}
                alreadyScored={scoredIdeas.has(idea.id)}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
