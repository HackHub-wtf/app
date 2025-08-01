import React, { useState } from 'react'
import {
  Stack,
  Group,
  Button,
  Text,
  Card,
  Image,
  ActionIcon,
  TextInput,
  Textarea,
  Modal,
  Select,
  SimpleGrid,
  Badge,
  Tooltip,
  Alert
} from '@mantine/core'
import { IconPlus, IconTrash, IconExternalLink, IconUpload, IconBrandGithub, IconWorldWww } from '@tabler/icons-react'
import type { ProjectAttachment } from '../store/hackathonStore'

interface ProjectAttachmentsProps {
  attachments: ProjectAttachment[]
  onAttachmentsChange: (attachments: ProjectAttachment[]) => void
  repositoryUrl?: string
  onRepositoryUrlChange: (url: string) => void
  demoUrl?: string
  onDemoUrlChange: (url: string) => void
  readonly?: boolean
  // Add error props for form validation
  repositoryUrlError?: string
  demoUrlError?: string
  attachmentsError?: string
}

export const ProjectAttachments: React.FC<ProjectAttachmentsProps> = ({
  attachments,
  onAttachmentsChange,
  repositoryUrl = '',
  onRepositoryUrlChange,
  demoUrl = '',
  onDemoUrlChange,
  readonly = false,
  repositoryUrlError,
  demoUrlError,
  attachmentsError
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAttachment, setEditingAttachment] = useState<ProjectAttachment | null>(null)
  const [newAttachment, setNewAttachment] = useState<Partial<ProjectAttachment>>({
    type: 'screenshot',
    title: '',
    description: '',
    url: ''
  })

  const handleAddAttachment = () => {
    if (!newAttachment.title || !newAttachment.url) return

    const attachment: ProjectAttachment = {
      id: crypto.randomUUID(),
      type: newAttachment.type as 'screenshot' | 'repository' | 'demo',
      url: newAttachment.url,
      title: newAttachment.title,
      description: newAttachment.description,
      display_order: attachments.length
    }

    onAttachmentsChange([...attachments, attachment])
    setNewAttachment({ type: 'screenshot', title: '', description: '', url: '' })
    setModalOpen(false)
  }

  const handleUpdateAttachment = () => {
    if (!editingAttachment) return

    const updated = attachments.map(att => 
      att.id === editingAttachment.id ? editingAttachment : att
    )
    onAttachmentsChange(updated)
    setEditingAttachment(null)
    setModalOpen(false)
  }

  const handleDeleteAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== id))
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'repository': return <IconBrandGithub size={16} />
      case 'demo': return <IconWorldWww size={16} />
      default: return <IconUpload size={16} />
    }
  }

  const getAttachmentColor = (type: string) => {
    switch (type) {
      case 'repository': return 'dark'
      case 'demo': return 'blue'
      default: return 'green'
    }
  }

  const bannerImage = attachments.find(att => att.type === 'screenshot')?.url

  return (
    <Stack gap="md">
      {/* Repository and Demo URLs */}
      {!readonly && (
        <SimpleGrid cols={2} spacing="md">
          <TextInput
            label="Repository URL"
            placeholder="https://github.com/username/repo"
            value={repositoryUrl}
            onChange={(e) => onRepositoryUrlChange(e.target.value)}
            leftSection={<IconBrandGithub size={16} />}
            error={repositoryUrlError}
          />
          <TextInput
            label="Demo URL"
            placeholder="https://your-demo.app"
            value={demoUrl}
            onChange={(e) => onDemoUrlChange(e.target.value)}
            leftSection={<IconWorldWww size={16} />}
            error={demoUrlError}
          />
        </SimpleGrid>
      )}

      {/* Show attachments error if present */}
      {attachmentsError && (
        <Alert color="red" variant="light" mt="xs">
          {attachmentsError}
        </Alert>
      )}

      {/* Banner Image */}
      {bannerImage && (
        <Card withBorder>
          <Text size="sm" fw={500} mb="xs">Project Banner</Text>
          <Image
            src={bannerImage}
            alt="Project banner"
            radius="md"
            height={200}
            fit="cover"
          />
        </Card>
      )}

      {/* Repository and Demo Links Display */}
      {readonly && (repositoryUrl || demoUrl) && (
        <Group gap="md">
          {repositoryUrl && (
            <Button
              variant="outline"
              leftSection={<IconBrandGithub size={16} />}
              component="a"
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Repository
            </Button>
          )}
          {demoUrl && (
            <Button
              variant="outline"
              leftSection={<IconWorldWww size={16} />}
              component="a"
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Live Demo
            </Button>
          )}
        </Group>
      )}

      {/* Attachments */}
      <div>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Project Attachments</Text>
          {!readonly && (
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => setModalOpen(true)}
              type="button"
            >
              Add Attachment
            </Button>
          )}
        </Group>

        {attachments.length === 0 ? (
          <Alert color="gray" variant="light">
            No attachments added yet. Add screenshots, additional repositories, or demo links to showcase your project.
          </Alert>
        ) : (
          <SimpleGrid cols={1} spacing="xs">
            {attachments.map((attachment) => (
              <Card key={attachment.id} withBorder p="sm">
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                      <Badge
                        color={getAttachmentColor(attachment.type)}
                        leftSection={getAttachmentIcon(attachment.type)}
                        size="sm"
                      >
                        {attachment.type}
                      </Badge>
                      <Text fw={500} size="sm">{attachment.title}</Text>
                    </Group>
                    
                    {attachment.description && (
                      <Text size="xs" c="dimmed" mb="xs">
                        {attachment.description}
                      </Text>
                    )}
                    
                    {attachment.type === 'screenshot' && attachment.url && (
                      <Image
                        src={attachment.url}
                        alt={attachment.title}
                        radius="sm"
                        height={120}
                        fit="cover"
                        mb="xs"
                      />
                    )}
                    
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconExternalLink size={12} />}
                        component="a"
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </Button>
                    </Group>
                  </div>
                  
                  {!readonly && (
                    <Group gap="xs">
                      <Tooltip label="Edit">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => {
                            setEditingAttachment(attachment)
                            setModalOpen(true)
                          }}
                        >
                          <IconUpload size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )}
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingAttachment(null)
          setNewAttachment({ type: 'screenshot', title: '', description: '', url: '' })
        }}
        title={editingAttachment ? 'Edit Attachment' : 'Add Attachment'}
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Type"
            data={[
              { value: 'screenshot', label: 'Screenshot' },
              { value: 'repository', label: 'Repository' },
              { value: 'demo', label: 'Demo Link' }
            ]}
            value={editingAttachment?.type || newAttachment.type}
            onChange={(value) => {
              const attachmentType = value as 'screenshot' | 'repository' | 'demo'
              if (editingAttachment) {
                setEditingAttachment({ ...editingAttachment, type: attachmentType })
              } else {
                setNewAttachment({ ...newAttachment, type: attachmentType })
              }
            }}
          />
          
          <TextInput
            label="Title"
            placeholder="Attachment title"
            value={editingAttachment?.title || newAttachment.title}
            onChange={(e) => {
              if (editingAttachment) {
                setEditingAttachment({ ...editingAttachment, title: e.target.value })
              } else {
                setNewAttachment({ ...newAttachment, title: e.target.value })
              }
            }}
          />
          
          <TextInput
            label="URL"
            placeholder="https://..."
            value={editingAttachment?.url || newAttachment.url}
            onChange={(e) => {
              if (editingAttachment) {
                setEditingAttachment({ ...editingAttachment, url: e.target.value })
              } else {
                setNewAttachment({ ...newAttachment, url: e.target.value })
              }
            }}
          />
          
          <Textarea
            label="Description (optional)"
            placeholder="Brief description of this attachment"
            value={editingAttachment?.description || newAttachment.description}
            onChange={(e) => {
              if (editingAttachment) {
                setEditingAttachment({ ...editingAttachment, description: e.target.value })
              } else {
                setNewAttachment({ ...newAttachment, description: e.target.value })
              }
            }}
          />
          
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false)
                setEditingAttachment(null)
                setNewAttachment({ type: 'screenshot', title: '', description: '', url: '' })
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={editingAttachment ? handleUpdateAttachment : handleAddAttachment}
              disabled={!(editingAttachment?.title || newAttachment.title) || !(editingAttachment?.url || newAttachment.url)}
              type="button"
            >
              {editingAttachment ? 'Update' : 'Add'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
