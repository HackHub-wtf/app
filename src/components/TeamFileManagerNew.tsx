import {
  Stack,
  Group,
  Text,
  Card,
  Badge,
  ActionIcon,
  ScrollArea,
  Center,
  Loader,
  Paper,
} from '@mantine/core'
import {
  IconUpload,
  IconFile,
  IconPhoto,
  IconVideo,
  IconFileText,
  IconDownload,
  IconTrash,
  IconFileZip,
  IconFileCode,
} from '@tabler/icons-react'
import { Dropzone } from '@mantine/dropzone'
import type { FileWithPath } from '@mantine/dropzone'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { FileService, type FileUploadWithProfile } from '../services/fileService'
import { notifications } from '@mantine/notifications'

interface TeamFileManagerNewProps {
  teamId: string
}

export function TeamFileManagerNew({ teamId }: TeamFileManagerNewProps) {
  const [files, setFiles] = useState<FileUploadWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true)
        const teamFiles = await FileService.getTeamFiles(teamId)
        setFiles(teamFiles)
      } catch (error) {
        console.error('Error loading files:', error)
        notifications.show({
          title: 'Error',
          message: 'Failed to load team files',
          color: 'red'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (teamId) {
      loadFiles()
    }
  }, [teamId])

  const handleFileDrop = async (droppedFiles: FileWithPath[]) => {
    if (!user?.id) return

    try {
      setIsUploading(true)
      
      for (const file of droppedFiles) {
        const uploadedFile = await FileService.uploadFile(teamId, user.id, file)
        if (uploadedFile) {
          // Add the uploaded file to the list with mock profile data
          const fileWithProfile: FileUploadWithProfile = {
            ...uploadedFile,
            profiles: {
              id: user.id,
              name: user.name || 'You',
              avatar_url: null
            }
          }
          setFiles(prev => [fileWithProfile, ...prev])
        }
      }

      notifications.show({
        title: 'Success!',
        message: `${droppedFiles.length} file(s) uploaded successfully`,
        color: 'green'
      })
    } catch (error) {
      console.error('Error uploading files:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to upload files',
        color: 'red'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      await FileService.deleteFile(fileId)
      setFiles(prev => prev.filter(f => f.id !== fileId))
      notifications.show({
        title: 'Success!',
        message: 'File deleted successfully',
        color: 'green'
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to delete file',
        color: 'red'
      })
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <IconPhoto size={20} />
    if (mimeType.startsWith('video/')) return <IconVideo size={20} />
    if (mimeType.includes('pdf') || mimeType.includes('text')) return <IconFileText size={20} />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <IconFileZip size={20} />
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) return <IconFileCode size={20} />
    return <IconFile size={20} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader size="md" />
        <Text c="dimmed">Loading files...</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Dropzone
        onDrop={handleFileDrop}
        loading={isUploading}
        accept={{
          'image/*': [],
          'application/pdf': [],
          'text/*': [],
          'application/json': [],
          'application/zip': [],
          'video/*': []
        }}
        maxSize={50 * 1024 * 1024} // 50MB
      >
        <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload size={50} color="var(--mantine-color-blue-6)" />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconUpload size={50} color="var(--mantine-color-red-6)" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconUpload size={50} color="var(--mantine-color-dimmed)" />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag files here or click to select
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Upload files to share with your team (max 50MB per file)
            </Text>
          </div>
        </Group>
      </Dropzone>

      {files.length === 0 ? (
        <Paper p="xl" withBorder radius="md">
          <Center>
            <Stack align="center" gap="sm">
              <IconFile size={48} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed" ta="center">
                No files uploaded yet. Drop files above to get started!
              </Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <ScrollArea h={400}>
          <Stack gap="sm">
            {files.map((file) => (
              <Card key={file.id} p="sm" withBorder radius="md">
                <Group justify="space-between" align="flex-start">
                  <Group gap="sm" align="flex-start" flex={1}>
                    <div style={{ color: 'var(--mantine-color-blue-6)' }}>
                      {getFileIcon(file.mime_type)}
                    </div>
                    <Stack gap={4} flex={1}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {file.original_name}
                      </Text>
                      <Group gap="xs">
                        <Badge variant="light" size="xs">
                          {formatFileSize(file.file_size)}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          by {file.profiles.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(file.created_at)}
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                  <Group gap="xs">
                    <ActionIcon 
                      variant="subtle" 
                      color="blue" 
                      size="sm"
                      onClick={() => window.open(file.file_url, '_blank')}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                    {file.user_id === user?.id && (
                      <ActionIcon 
                        variant="subtle" 
                        color="red" 
                        size="sm"
                        onClick={() => handleFileDelete(file.id)}
                      >
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
