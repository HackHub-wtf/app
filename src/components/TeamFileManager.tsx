import {
  Stack,
  Group,
  Text,
  Card,
  Badge,
  ActionIcon,
  Menu,
  Progress,
  Alert,
  Center,
  rem,
} from '@mantine/core'
import {
  IconUpload,
  IconFile,
  IconPhoto,
  IconVideo,
  IconFileText,
  IconDownload,
  IconTrash,
  IconDots,
  IconShare,
  IconEye,
  IconX,
} from '@tabler/icons-react'
import { Dropzone } from '@mantine/dropzone'
import type { FileWithPath } from '@mantine/dropzone'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'

interface FileUpload {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedBy: string
  uploadedByName: string
  uploadedAt: Date
  progress?: number
  status: 'uploading' | 'completed' | 'error'
}

interface TeamFileManagerProps {
  teamId: string
  teamName: string
}

export function TeamFileManager({ teamId, teamName }: TeamFileManagerProps) {
  const [files, setFiles] = useState<FileUpload[]>([])
  const { user } = useAuthStore()

  // Use teamId and teamName for future API calls
  console.log('Managing files for team:', teamId, teamName)

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <IconPhoto size={20} />
    if (type.startsWith('video/')) return <IconVideo size={20} />
    if (type.includes('pdf') || type.includes('document')) return <IconFileText size={20} />
    return <IconFile size={20} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (!user) return

    acceptedFiles.forEach((file) => {
      const fileUpload: FileUpload = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedBy: user.id,
        uploadedByName: user.name,
        uploadedAt: new Date(),
        progress: 0,
        status: 'uploading',
      }

      setFiles(prev => [...prev, fileUpload])

      // Simulate file upload progress
      const interval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileUpload.id && f.progress !== undefined && f.progress < 100) {
            const newProgress = f.progress + Math.random() * 30
            if (newProgress >= 100) {
              clearInterval(interval)
              return { ...f, progress: 100, status: 'completed' as const }
            }
            return { ...f, progress: newProgress }
          }
          return f
        }))
      }, 200)

      // Complete upload after simulation
      setTimeout(() => {
        clearInterval(interval)
        setFiles(prev => prev.map(f => 
          f.id === fileUpload.id 
            ? { ...f, progress: 100, status: 'completed' as const }
            : f
        ))
        
        notifications.show({
          title: 'File Uploaded',
          message: `${file.name} has been uploaded successfully`,
          color: 'green',
        })
      }, 2000 + Math.random() * 2000)
    })
  }, [user])

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    notifications.show({
      title: 'File Deleted',
      message: 'File has been removed from the team',
      color: 'red',
    })
  }

  const downloadFile = (file: FileUpload) => {
    // In a real app, this would be a proper download link
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareFile = (file: FileUpload) => {
    navigator.clipboard.writeText(file.url)
    notifications.show({
      title: 'Link Copied',
      message: 'File link has been copied to clipboard',
      color: 'blue',
    })
  }

  return (
    <Stack gap="md">
      {/* Upload Zone */}
      <Dropzone
        onDrop={handleDrop}
        onReject={(files) => {
          notifications.show({
            title: 'Upload Failed',
            message: `Failed to upload ${files.length} file(s)`,
            color: 'red',
          })
        }}
        maxSize={50 * 1024 ** 2} // 50MB
        multiple
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconUpload
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag files here or click to select files
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach files for your team to access. Files should not exceed 50MB
            </Text>
          </div>
        </Group>
      </Dropzone>

      {/* Files List */}
      {files.length > 0 && (
        <Stack gap="xs">
          <Text fw={600} size="lg">Team Files ({files.length})</Text>
          
          {files.map((file) => (
            <Card key={file.id} withBorder p="md">
              <Group justify="space-between" align="flex-start">
                <Group gap="md" flex={1}>
                  {getFileIcon(file.type)}
                  <Stack gap={4} flex={1}>
                    <Text fw={500} size="sm" lineClamp={1}>
                      {file.name}
                    </Text>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        {formatFileSize(file.size)}
                      </Text>
                      <Text size="xs" c="dimmed">•</Text>
                      <Text size="xs" c="dimmed">
                        by {file.uploadedByName}
                      </Text>
                      <Text size="xs" c="dimmed">•</Text>
                      <Text size="xs" c="dimmed">
                        {file.uploadedAt.toLocaleDateString()}
                      </Text>
                    </Group>
                    
                    {file.status === 'uploading' && (
                      <Stack gap={4}>
                        <Progress value={file.progress || 0} size="sm" animated />
                        <Text size="xs" c="dimmed">
                          Uploading... {Math.round(file.progress || 0)}%
                        </Text>
                      </Stack>
                    )}
                    
                    {file.status === 'completed' && (
                      <Badge variant="light" color="green" size="sm" w="fit-content">
                        Uploaded
                      </Badge>
                    )}
                    
                    {file.status === 'error' && (
                      <Alert color="red" variant="light" p="xs">
                        <Text size="xs">Upload failed</Text>
                      </Alert>
                    )}
                  </Stack>
                </Group>

                {file.status === 'completed' && (
                  <Group gap="xs">
                    <ActionIcon variant="light" size="sm" onClick={() => downloadFile(file)}>
                      <IconDownload size={14} />
                    </ActionIcon>
                    
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="light" size="sm">
                          <IconDots size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size={14} />}>
                          Preview
                        </Menu.Item>
                        <Menu.Item 
                          leftSection={<IconShare size={14} />}
                          onClick={() => shareFile(file)}
                        >
                          Copy Link
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => deleteFile(file.id)}
                          disabled={file.uploadedBy !== user?.id}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      {files.length === 0 && (
        <Center p="xl">
          <Stack align="center" gap="sm">
            <IconFile size={48} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" ta="center">
              No files uploaded yet.
              <br />
              Drag and drop files above to get started.
            </Text>
          </Stack>
        </Center>
      )}
    </Stack>
  )
}
