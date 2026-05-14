import {
  Stack,
  Group,
  Text,
  Card,
  Badge,
  ActionIcon,
  ScrollArea,
  Center,
  Paper,
} from '@mantine/core'
import {
  IconFile,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react'
import { Dropzone } from '@mantine/dropzone'
import type { FileWithPath } from '@mantine/dropzone'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'

interface FileMetadata {
  id: string
  teamId: string
  userId: string
  originalName: string
  mimeType: string
  fileSize: number
  fileUrl: string
  createdAt: string
}

interface TeamFileManagerNewProps {
  teamId: string
}

export function TeamFileManagerNew({ teamId }: TeamFileManagerNewProps) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuthStore()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const handleFileDrop = async (droppedFiles: FileWithPath[]) => {
    if (!user?.id) return
    setIsUploading(true)
    try {
      // File upload to be wired to the Spring Boot API when endpoint is available
      const newFiles: FileMetadata[] = droppedFiles.map(f => ({
        id: crypto.randomUUID(),
        teamId,
        userId: user.id,
        originalName: f.name,
        mimeType: f.type,
        fileSize: f.size,
        fileUrl: URL.createObjectURL(f),
        createdAt: new Date().toISOString(),
      }))
      setFiles(prev => [...prev, ...newFiles])
      notifications.show({
        title: 'Uploaded',
        message: `${droppedFiles.length} file(s) added`,
        color: 'green',
      })
    } catch (error) {
      console.error('Error uploading files:', error)
      notifications.show({ title: 'Error', message: 'Failed to upload files', color: 'red' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileDelete = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    notifications.show({ title: 'Deleted', message: 'File removed', color: 'green' })
  }

  return (
    <Stack gap="md">
      <Dropzone onDrop={handleFileDrop} loading={isUploading} maxSize={50 * 1024 * 1024}>
        <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
          <Dropzone.Idle>
            <IconFile size={50} color="var(--mantine-color-dimmed)" />
          </Dropzone.Idle>
          <div>
            <Text size="xl" inline>Drag files here or click to select</Text>
            <Text size="sm" c="dimmed" inline mt={7}>Upload files to share with your team (max 50MB)</Text>
          </div>
        </Group>
      </Dropzone>

      {files.length === 0 ? (
        <Paper p="xl" withBorder radius="md">
          <Center>
            <Stack align="center" gap="sm">
              <IconFile size={48} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed" ta="center">No files uploaded yet.</Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <ScrollArea h={400}>
          <Stack gap="sm">
            {files.map(file => (
              <Card key={file.id} p="sm" withBorder radius="md">
                <Group justify="space-between" align="flex-start">
                  <Group gap="sm" flex={1}>
                    <IconFile size={24} />
                    <Stack gap={4} flex={1}>
                      <Text size="sm" fw={500} lineClamp={1}>{file.originalName}</Text>
                      <Group gap="xs">
                        <Badge variant="light" size="xs">{formatFileSize(file.fileSize)}</Badge>
                        <Text size="xs" c="dimmed">{formatDate(file.createdAt)}</Text>
                      </Group>
                    </Stack>
                  </Group>
                  <Group gap="xs">
                    <ActionIcon variant="subtle" color="blue" size="sm" component="a" href={file.fileUrl} download={file.originalName}>
                      <IconDownload size={16} />
                    </ActionIcon>
                    {file.userId === user?.id && (
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleFileDelete(file.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Stack>
  )
}
