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
  Select,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconTrophy } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  hackathonKey: string
  role: 'user'
}

export function Register() {
  const navigate = useNavigate()
  const { signup } = useAuthStore()

  const form = useForm<RegisterFormData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      hackathonKey: '',
      role: 'user',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords did not match' : null,
      hackathonKey: (value) => (value.length < 1 ? 'Hackathon key is required' : null),
    },
  })

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      await signup(values.email, values.password, values.name)
      
      notifications.show({
        title: 'Account created!',
        message: 'Welcome to HackHub! Please check your email to verify your account.',
        color: 'green',
      })

      // Note: In production, you might want to redirect to email verification page
      // For now, we'll redirect to login
      navigate('/login')
    } catch (error) {
      console.error('Registration error:', error)
      notifications.show({
        title: 'Registration failed',
        message: error instanceof Error ? error.message : 'Failed to create account. Please try again.',
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
          Join the innovation!
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
          Create your account to participate in hackathons
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              {...form.getInputProps('name')}
            />

            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
            />

            <TextInput
              label="Hackathon Key"
              placeholder="Enter the hackathon access key"
              required
              description="Get this key from your hackathon organizer"
              {...form.getInputProps('hackathonKey')}
            />

            <Select
              label="Role"
              data={[
                { value: 'user', label: 'Participant' },
              ]}
              required
              {...form.getInputProps('role')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              {...form.getInputProps('confirmPassword')}
            />

            <Button type="submit" fullWidth mt="xl" size="md">
              Create Account
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt={20}>
          Already have an account?{' '}
          <Anchor size="sm" component={Link} to="/login">
            Sign in
          </Anchor>
        </Text>

        <Text c="dimmed" size="xs" ta="center" mt="lg">
          <Text fw={500} span>Demo key:</Text> HACK2024
        </Text>
      </Paper>
    </Container>
  )
}
