import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Container,
  Center,
  Stack,
  Group,
  ThemeIcon,
  rem,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconTrophy } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'

interface LoginFormData {
  email: string
  password: string
}

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  })

  const handleSubmit = async (values: LoginFormData) => {
    try {
      await login(values.email, values.password)
      notifications.show({
        title: 'Welcome back!',
        message: 'Successfully logged in to HackHub',
        color: 'green',
      })
      navigate('/')
    } catch (error) {
      notifications.show({
        title: 'Login failed',
        message: error instanceof Error ? error.message : 'Invalid email or password',
        color: 'red',
      })
    }
  }

  return (
    <Container size={420} my={40}>
      <Center mb={30}>
        <Group>
          <ThemeIcon size={50} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconTrophy style={{ width: rem(30), height: rem(30) }} />
          </ThemeIcon>
          <Title order={1} c="blue">
            HackHub
          </Title>
        </Group>
      </Center>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" order={2} mb="md">
          Welcome back!
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
          Sign in to your hackathon account
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth mt="xl" size="md">
              Sign in
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt={20}>
          Don't have an account yet?{' '}
          <Anchor size="sm" component={Link} to="/register">
            Create account
          </Anchor>
        </Text>

        <Text c="dimmed" size="xs" ta="center" mt="lg">
          <Text fw={500} span>Demo accounts:</Text><br />
          Manager: manager@example.com | password<br />
          Participant: user@example.com | password
        </Text>
      </Paper>
    </Container>
  )
}
