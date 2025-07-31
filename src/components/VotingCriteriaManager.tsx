import {
  Card,
  Stack,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  Textarea,
  NumberInput,
  Modal,
  ActionIcon,
  Badge,
  Alert,
  Progress,
  Table,
  Divider,
} from '@mantine/core'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { VotingService } from '../services/votingService'
import type { VotingCriteria } from '../services/ideaService'

interface VotingCriteriaManagerProps {
  hackathonId: string
  isManager: boolean
}

interface CriteriaForm {
  name: string
  description: string
  weight: number
  display_order: number
}

export function VotingCriteriaManager({ hackathonId, isManager }: VotingCriteriaManagerProps) {
  const [criteria, setCriteria] = useState<VotingCriteria[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCriteria, setEditingCriteria] = useState<VotingCriteria | null>(null)
  const [opened, { open, close }] = useDisclosure(false)

  const form = useForm<CriteriaForm>({
    initialValues: {
      name: '',
      description: '',
      weight: 25,
      display_order: 1,
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      weight: (value) => {
        if (value < 1 || value > 100) return 'Weight must be between 1 and 100'
        return null
      },
    },
  })

  const loadCriteria = useCallback(async () => {
    try {
      setLoading(true)
      const data = await VotingService.getVotingCriteria(hackathonId)
      setCriteria(data)
    } catch (error) {
      console.error('Failed to load voting criteria:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load voting criteria',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }, [hackathonId])

  useEffect(() => {
    loadCriteria()
  }, [hackathonId, loadCriteria])

  const totalWeight = useMemo(() => {
    return criteria.reduce((sum, c) => sum + c.weight, 0)
  }, [criteria])

  const isWeightValid = totalWeight === 100

  const handleSubmit = async (values: CriteriaForm) => {
    try {
      if (editingCriteria) {
        await VotingService.updateVotingCriteria(editingCriteria.id, values)
        notifications.show({
          title: 'Success',
          message: 'Voting criteria updated successfully',
          color: 'green',
        })
      } else {
        await VotingService.createVotingCriteria(hackathonId, values)
        notifications.show({
          title: 'Success',
          message: 'Voting criteria created successfully',
          color: 'green',
        })
      }
      
      await loadCriteria()
      close()
      setEditingCriteria(null)
      form.reset()
    } catch (error) {
      console.error('Failed to save voting criteria:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to save voting criteria',
        color: 'red',
      })
    }
  }

  const handleEdit = (criteriaItem: VotingCriteria) => {
    setEditingCriteria(criteriaItem)
    form.setValues({
      name: criteriaItem.name,
      description: criteriaItem.description || '',
      weight: criteriaItem.weight,
      display_order: criteriaItem.display_order,
    })
    open()
  }

  const handleDelete = async (id: string) => {
    try {
      await VotingService.deleteVotingCriteria(id)
      notifications.show({
        title: 'Success',
        message: 'Voting criteria deleted successfully',
        color: 'green',
      })
      await loadCriteria()
    } catch (error) {
      console.error('Failed to delete voting criteria:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to delete voting criteria',
        color: 'red',
      })
    }
  }

  const handleWeightChange = async (criteriaId: string, newWeight: number) => {
    try {
      // Update locally first for immediate feedback
      setCriteria(prev => prev.map(c => 
        c.id === criteriaId ? { ...c, weight: newWeight } : c
      ))
      
      await VotingService.updateVotingCriteria(criteriaId, { weight: newWeight })
    } catch (error) {
      console.error('Failed to update weight:', error)
      // Revert local change on error
      await loadCriteria()
      notifications.show({
        title: 'Error',
        message: 'Failed to update weight',
        color: 'red',
      })
    }
  }

  const handleAddNew = () => {
    setEditingCriteria(null)
    form.reset()
    form.setFieldValue('display_order', criteria.length + 1)
    open()
  }

  if (loading) {
    return (
      <Card withBorder p="lg">
        <Stack gap="md">
          <Title order={3}>Voting Criteria</Title>
          <Text c="dimmed">Loading...</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <>
      <Card withBorder p="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Title order={3}>Voting Criteria</Title>
              <Text c="dimmed" size="sm">
                Define how participants will evaluate team ideas
              </Text>
            </div>
            {isManager && (
              <Button leftSection={<IconPlus size={16} />} onClick={handleAddNew}>
                Add Criteria
              </Button>
            )}
          </Group>

          {/* Weight validation indicator */}
          <Group gap="sm">
            <Text size="sm" fw={500}>
              Total Weight: {totalWeight}%
            </Text>
            <Progress 
              value={totalWeight} 
              color={isWeightValid ? 'green' : totalWeight > 100 ? 'red' : 'yellow'}
              style={{ flex: 1 }}
            />
            {isWeightValid ? (
              <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                Valid
              </Badge>
            ) : (
              <Badge color="red" variant="light" leftSection={<IconAlertCircle size={12} />}>
                Invalid
              </Badge>
            )}
          </Group>

          {!isWeightValid && (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow">
              All criteria weights must sum to exactly 100%. 
              Current total: {totalWeight}%
            </Alert>
          )}

          {criteria.length === 0 ? (
            <Alert color="blue">
              No voting criteria defined yet. {isManager ? 'Add some criteria to get started.' : 'The hackathon manager will set up voting criteria.'}
            </Alert>
          ) : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Order</Table.Th>
                  <Table.Th>Criteria</Table.Th>
                  <Table.Th>Weight</Table.Th>
                  {isManager && <Table.Th>Actions</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {criteria.map((criteriaItem) => (
                  <Table.Tr key={criteriaItem.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconGripVertical size={14} color="gray" />
                        {criteriaItem.display_order}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={500}>{criteriaItem.name}</Text>
                        {criteriaItem.description && (
                          <Text size="xs" c="dimmed">
                            {criteriaItem.description}
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      {isManager ? (
                        <NumberInput
                          value={criteriaItem.weight}
                          onChange={(value) => 
                            typeof value === 'number' && handleWeightChange(criteriaItem.id, value)
                          }
                          min={1}
                          max={100}
                          suffix="%"
                          size="xs"
                          style={{ width: 80 }}
                        />
                      ) : (
                        <Badge variant="light">{criteriaItem.weight}%</Badge>
                      )}
                    </Table.Td>
                    {isManager && (
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            size="sm"
                            onClick={() => handleEdit(criteriaItem)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(criteriaItem.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {criteria.length > 0 && (
            <>
              <Divider />
              <Stack gap="xs">
                <Text size="sm" fw={500}>Scoring Scale:</Text>
                <Text size="xs" c="dimmed">
                  Each criteria will be scored from 1-10, where:
                  1-3 = Poor, 4-6 = Average, 7-8 = Good, 9-10 = Excellent
                </Text>
              </Stack>
            </>
          )}
        </Stack>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        opened={opened}
        onClose={() => {
          close()
          setEditingCriteria(null)
          form.reset()
        }}
        title={editingCriteria ? 'Edit Voting Criteria' : 'Add Voting Criteria'}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Criteria Name"
              placeholder="e.g., Innovation & Creativity"
              required
              {...form.getInputProps('name')}
            />

            <Textarea
              label="Description"
              placeholder="Explain what this criteria evaluates..."
              minRows={3}
              {...form.getInputProps('description')}
            />

            <NumberInput
              label="Weight (%)"
              placeholder="25"
              required
              min={1}
              max={100}
              suffix="%"
              description="Percentage weight for this criteria (all criteria must sum to 100%)"
              {...form.getInputProps('weight')}
            />

            <NumberInput
              label="Display Order"
              placeholder="1"
              required
              min={1}
              description="Order in which this criteria appears to voters"
              {...form.getInputProps('display_order')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCriteria ? 'Update' : 'Create'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  )
}
