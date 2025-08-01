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
import { OrganizationService } from '../utils/organizations'
import { notifications } from '@mantine/notifications'

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  organization: string
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
      organization: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords did not match' : null,
      organization: (value) => (value.length < 1 ? 'Organization is required' : null),
    },
  })

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      // First create the user account
      await signup(values.email, values.password, values.name)
      
      // Check if organization exists
      const orgExists = !(await OrganizationService.isSlugAvailable(values.organization))
      
      if (orgExists) {
        // Join existing organization as member
        // Note: We'll need to get the user ID after signup
        notifications.show({
          title: 'Account created!',
          message: `Welcome to HackHub! You've been added to ${values.organization}.`,
          color: 'green',
        })
        navigate('/login')
      } else {
        // Redirect to organization setup with suggested name
        notifications.show({
          title: 'Account created!',
          message: 'Welcome to HackHub! Let\'s set up your organization.',
          color: 'green',
        })
        navigate(`/organization/setup?org=${encodeURIComponent(values.organization)}`)
      }
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
              label="Organization"
              placeholder="your-company"
              required
              description="Enter your organization name. If it doesn't exist, you'll become the manager and set it up."
              {...form.getInputProps('organization')}
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
