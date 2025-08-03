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
  IconDownload,
  IconTrash,
} from '@tabler/icons-react'
import { Dropzone } from '@mantine/dropzone'
import type { FileWithPath } from '@mantine/dropzone'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useRealtime } from '../hooks/useRealtime'
import { FileService, type FileMetadataWithProfile } from '../services/fileService'
import { notifications } from '@mantine/notifications'

interface TeamFileManagerNewProps {
  teamId: string
}

export function TeamFileManagerNew({ teamId }: TeamFileManagerNewProps) {
  const [files, setFiles] = useState<FileMetadataWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuthStore()
  const { subscribeToTeamFiles, unsubscribeFromChannel } = useRealtime()

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      const teamFiles = await FileService.getTeamFiles(teamId)
      setFiles(teamFiles)
    } catch (error) {
      console.error('Error loading files:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load files',
        color: 'red'
      })
    } finally {
      setIsLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    if (teamId) {
      loadFiles()
      
      // Subscribe to real-time file updates using PostgreSQL changes
      const channel = subscribeToTeamFiles(teamId, (payload) => {
        console.log('File update received:', payload)
        // Reload files whenever there's a file change for this team
        if (payload.event === 'INSERT' || payload.event === 'DELETE' || payload.event === 'UPDATE') {
          loadFiles()
        }
      })

      return () => {
        if (channel) {
          unsubscribeFromChannel(channel)
        }
      }
    }
  }, [teamId, subscribeToTeamFiles, unsubscribeFromChannel, loadFiles])

  const handleFileDrop = async (droppedFiles: FileWithPath[]) => {
    if (!user?.id) return

    try {
      setIsUploading(true)
      
      for (const file of droppedFiles) {
        const uploadedFile = await FileService.uploadFile(teamId, user.id, file)
        if (!uploadedFile) {
          throw new Error(`Failed to upload ${file.name}`)
        }
        // No need to call loadFiles() here - real-time subscription will handle the update
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
      // No need to manually update state - real-time subscription will handle the update
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

  const handleFileDownload = async (fileId: string) => {
    try {
      const downloadInfo = await FileService.downloadFile(fileId)
      if (downloadInfo) {
        // Create a temporary link to download the file
        const link = document.createElement('a')
        link.href = downloadInfo.url
        link.download = downloadInfo.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to get download link',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to download file',
        color: 'red'
      })
    }
  }

  const getFileIcon = (mimeType: string) => {
    return FileService.getFileIcon(mimeType)
  }

  const formatFileSize = (bytes: number) => {
    return FileService.formatFileSize(bytes)
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
                    <Text size="xl" style={{ lineHeight: 1 }}>
                      {getFileIcon(file.mime_type)}
                    </Text>
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
                      onClick={() => handleFileDownload(file.id)}
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
