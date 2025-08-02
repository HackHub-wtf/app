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
  Image,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { OrganizationService } from '../utils/organizations'
import { ProfileService } from '../services/profileService'
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
      // Check if organization exists first
      const orgExists = !(await OrganizationService.isSlugAvailable(values.organization))
      console.log('Organization exists:', orgExists, 'for:', values.organization)
      
      // Create the user account and authenticate
      console.log('Starting signup process...')
      await signup(values.email, values.password, values.name)
      
      // Wait for auth state to stabilize
      console.log('Signup complete, waiting for auth state...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Verify user is authenticated and profile exists
      let currentUser = useAuthStore.getState().user
      console.log('Current user after signup:', currentUser)
      
      if (!currentUser) {
        console.log('No user in store, attempting to get profile directly...')
        // Try to get the profile directly from the database
        const profile = await ProfileService.getCurrentProfile()
        if (profile) {
          console.log('Found profile in database:', profile)
          // Update auth store with profile data
          useAuthStore.getState().setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            avatar: profile.avatar_url || undefined,
            skills: profile.skills
          })
          currentUser = profile
        } else {
          console.error('No profile found in database')
          notifications.show({
            title: 'Registration Issue',
            message: 'Account created but profile setup failed. Please try logging in.',
            color: 'orange',
          })
          navigate('/login')
          return
        }
      }
      
      if (!currentUser) {
        console.error('Failed to establish user session')
        notifications.show({
          title: 'Registration Issue',
          message: 'Account created but session failed. Please try logging in.',
          color: 'orange',
        })
        navigate('/login')
        return
      }
      
      console.log('User established successfully:', currentUser)
      
      if (orgExists) {
        // Organization exists - join it as a member
        console.log('Joining existing organization:', values.organization)
        const joined = await OrganizationService.joinOrganization(values.organization, currentUser.id)
        
        if (joined) {
          notifications.show({
            title: 'Account created!',
            message: `Welcome to HackHub! You've joined ${values.organization}.`,
            color: 'green',
          })
        } else {
          notifications.show({
            title: 'Warning',
            message: 'Account created but failed to join organization. You can join later.',
            color: 'orange',
          })
        }
        navigate('/')
      } else {
        // Organization doesn't exist - user will become manager after creating it
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
          <Image
            src="/assets/green_banner.svg"
            alt="HackHub"
            h={50}
            w="auto"
            fit="contain"
          />
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
      </Paper>
    </Container>
  )
}