import {
  Card,
  Stack,
  Text,
  Button,
  Group,
  Rating,
  Modal,
  Alert,
  Badge,
  Divider,
  Progress,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconStar,
  IconStarFilled,
  IconCheck,
  IconX,
  IconInfoCircle,
} from '@tabler/icons-react'
import { useState, useEffect, useCallback } from 'react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { VotingService } from '../services/votingService'
import type { VotingCriteria, UserScores } from '../services/ideaService'

interface FlexibleVotingInterfaceProps {
  ideaId: string
  hackathonId: string
  userId?: string
  currentTotalScore?: number
  currentVoteCount?: number
  onVoteSubmitted?: () => void
}

export function FlexibleVotingInterface({
  ideaId,
  hackathonId,
  userId,
  currentTotalScore = 0,
  currentVoteCount = 0,
  onVoteSubmitted,
}: FlexibleVotingInterfaceProps) {
  const [criteria, setCriteria] = useState<VotingCriteria[]>([])
  const [userScores, setUserScores] = useState<UserScores>({})
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [opened, { open, close }] = useDisclosure(false)

  const loadVotingData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load voting criteria
      const criteriaData = await VotingService.getVotingCriteria(hackathonId)
      setCriteria(criteriaData)

      if (userId) {
        // Load user's existing scores
        const scores = await VotingService.getUserScores(ideaId, userId)
        setUserScores(scores)
        
        // Check if user has voted
        const voted = await VotingService.hasUserVoted(ideaId, userId)
        setHasVoted(voted)
      }
    } catch (error) {
      console.error('Failed to load voting data:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load voting information',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }, [ideaId, hackathonId, userId])

  useEffect(() => {
    loadVotingData()
  }, [loadVotingData])

  const handleScoreChange = (criteriaId: string, score: number) => {
    setUserScores(prev => ({
      ...prev,
      [criteriaId]: score
    }))
  }

  const handleSubmitVote = async () => {
    if (!userId) {
      notifications.show({
        title: 'Login Required',
        message: 'Please log in to vote on ideas',
        color: 'orange',
      })
      return
    }

    // Validate all criteria have scores
    const missingScores = criteria.filter(c => !userScores[c.id])
    if (missingScores.length > 0) {
      notifications.show({
        title: 'Incomplete Scores',
        message: `Please provide scores for: ${missingScores.map(c => c.name).join(', ')}`,
        color: 'yellow',
      })
      return
    }

    try {
      setSubmitting(true)
      await VotingService.submitIdeaScores(ideaId, userId, userScores)
      
      setHasVoted(true)
      close()
      
      notifications.show({
        title: 'Vote Submitted!',
        message: 'Your scores have been recorded successfully',
        color: 'green',
      })

      onVoteSubmitted?.()
    } catch (error) {
      console.error('Failed to submit vote:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to submit your vote',
        color: 'red',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveVote = async () => {
    if (!userId) return

    try {
      await VotingService.removeUserVote(ideaId, userId)
      setHasVoted(false)
      setUserScores({})
      
      notifications.show({
        title: 'Vote Removed',
        message: 'Your vote has been removed',
        color: 'blue',
      })

      onVoteSubmitted?.()
    } catch (error) {
      console.error('Failed to remove vote:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to remove your vote',
        color: 'red',
      })
    }
  }

  const calculateWeightedScore = () => {
    if (criteria.length === 0) return 0
    
    return criteria.reduce((total, criterium) => {
      const score = userScores[criterium.id] || 0
      return total + (score * criterium.weight / 100)
    }, 0)
  }

  const isComplete = criteria.every(c => userScores[c.id] > 0)
  const weightedScore = calculateWeightedScore()

  if (loading) {
    return (
      <Group gap="xs">
        <Text size="sm" c="dimmed">Loading voting...</Text>
      </Group>
    )
  }

  if (criteria.length === 0) {
    return (
      <Alert color="blue" icon={<IconInfoCircle size={16} />}>
        Voting criteria not yet configured by the hackathon manager.
      </Alert>
    )
  }

  return (
    <>
      <Group gap="sm" wrap="nowrap">
        {/* Current Score Display */}
        <Group gap="xs">
          <IconStar size={16} />
          <Text size="sm" fw={500}>
            {currentTotalScore.toFixed(1)}
          </Text>
          <Text size="xs" c="dimmed">
            ({currentVoteCount} {currentVoteCount === 1 ? 'vote' : 'votes'})
          </Text>
        </Group>

        {/* Vote Button */}
        {hasVoted ? (
          <Group gap="xs">
            <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
              Voted
            </Badge>
            <Tooltip label="Edit your vote">
              <ActionIcon variant="light" size="sm" onClick={open}>
                <IconStar size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Remove your vote">
              <ActionIcon variant="light" color="red" size="sm" onClick={handleRemoveVote}>
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : (
          <Button
            size="xs"
            variant="light"
            leftSection={<IconStar size={14} />}
            onClick={open}
          >
            Vote
          </Button>
        )}
      </Group>

      {/* Voting Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Rate This Idea"
        size="md"
      >
        <Stack gap="lg">
          <Text size="sm" c="dimmed">
            Rate each criteria from 1-10. Your final score will be calculated based on the weighted average.
          </Text>

          {criteria.map((criterium) => (
            <Card key={criterium.id} p="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={500}>{criterium.name}</Text>
                  <Badge variant="light">{criterium.weight}%</Badge>
                </Group>

                {criterium.description && (
                  <Text size="sm" c="dimmed">
                    {criterium.description}
                  </Text>
                )}

                <Group gap="md" align="center">
                  <Text size="sm">Score:</Text>
                  <Rating
                    value={userScores[criterium.id] || 0}
                    onChange={(value) => handleScoreChange(criterium.id, value)}
                    count={10}
                    size="sm"
                    emptySymbol={<IconStar size={16} />}
                    fullSymbol={<IconStarFilled size={16} />}
                  />
                  <Text size="sm" fw={500} c="blue">
                    {userScores[criterium.id] || 0}/10
                  </Text>
                </Group>
              </Stack>
            </Card>
          ))}

          {isComplete && (
            <Card p="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={500}>Weighted Score Preview</Text>
                  <Text fw={700} size="lg" c="blue">
                    {weightedScore.toFixed(1)}/10
                  </Text>
                </Group>
                <Progress value={(weightedScore / 10) * 100} />
                <Text size="xs" c="dimmed">
                  This is your final score based on the criteria weights
                </Text>
              </Stack>
            </Card>
          )}

          <Divider />

          <Group justify="space-between">
            <Button variant="subtle" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitVote}
              loading={submitting}
              disabled={!isComplete}
              leftSection={<IconCheck size={16} />}
            >
              {hasVoted ? 'Update Vote' : 'Submit Vote'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
