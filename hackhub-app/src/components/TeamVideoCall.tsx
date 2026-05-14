import {
  Stack,
  Card,
  Text,
  Alert,
} from '@mantine/core'
import { IconVideo } from '@tabler/icons-react'

interface TeamVideoCallProps {
  teamId: string
  teamName: string
}

export function TeamVideoCall({ teamName }: TeamVideoCallProps) {
  return (
    <Card withBorder p="lg" radius="md">
      <Stack align="center" gap="md">
        <IconVideo size={48} color="var(--mantine-color-blue-6)" />
        <Text fw={600} size="lg">Team Video Call</Text>
        <Alert color="blue" variant="light">
          Video calling for <strong>{teamName}</strong> is coming soon.
          Real-time video will be available in a future update.
        </Alert>
      </Stack>
    </Card>
  )
}
