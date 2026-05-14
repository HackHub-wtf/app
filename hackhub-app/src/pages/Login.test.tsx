import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './Login'

// Mock SVG imports
vi.mock('../../assets/black_banner.svg', () => ({ default: 'black_banner.svg' }))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock authStore
const mockLogin = vi.fn()
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    login: mockLogin,
  })),
}))

// Mock mantine notifications
vi.mock('@mantine/notifications', async () => {
  const actual = await vi.importActual<typeof import('@mantine/notifications')>('@mantine/notifications')
  return {
    ...actual,
    notifications: {
      show: vi.fn(),
    },
  }
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <MantineProvider>
        <Notifications />
        <Login />
      </MantineProvider>
    </MemoryRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email input', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders password input', () => {
    renderLogin()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows link to register page', () => {
    renderLogin()
    expect(screen.getByText(/create account/i)).toBeInTheDocument()
  })

  it('calls login with entered credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@hackhub.wtf' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Admin1234!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@hackhub.wtf', 'Admin1234!')
    })
  })

  it('navigates to / after successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@hackhub.wtf' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Admin1234!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('does not navigate when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'bad@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpw' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
    expect(mockNavigate).not.toHaveBeenCalledWith('/')
  })

  it('shows validation error for invalid email format', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('shows validation error for short password', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'abc' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })
})
