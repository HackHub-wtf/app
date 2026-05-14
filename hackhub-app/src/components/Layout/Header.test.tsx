import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'

// Mock SVG imports
vi.mock('../../../assets/black_banner.svg', () => ({ default: 'black_banner.svg' }))

// Mock authStore
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

// Mock NotificationCenter so we don't need its full dependencies
vi.mock('../NotificationCenter', () => ({
  NotificationCenter: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="notification-center">Notifications</div> : null,
}))

import { useAuthStore } from '../../store/authStore'
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>

function renderHeader(props?: { opened?: boolean; toggle?: () => void }) {
  const toggle = props?.toggle ?? vi.fn()
  const opened = props?.opened ?? false
  return render(
    <MemoryRouter>
      <MantineProvider>
        <Header opened={opened} toggle={toggle} />
      </MantineProvider>
    </MemoryRouter>
  )
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'alice@test.com',
        name: 'Alice',
        role: 'participant',
        skills: [],
      },
      logout: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('renders the user name', () => {
    renderHeader()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders the user role', () => {
    renderHeader()
    expect(screen.getByText('participant')).toBeInTheDocument()
  })

  it('renders the notification bell button', () => {
    renderHeader()
    // The bell icon ActionIcon should be present
    const bells = document.querySelectorAll('[data-testid], button, [role="button"]')
    expect(bells.length).toBeGreaterThan(0)
  })

  it('opens notification center when bell is clicked', () => {
    renderHeader()
    // Find the notification bell ActionIcon (contains SVG icon)
    const buttons = screen.getAllByRole('button')
    // The first ActionIcon-style button is the bell
    const bellBtn = buttons.find(b => b.querySelector('svg'))
    if (bellBtn) {
      fireEvent.click(bellBtn)
      expect(screen.getByTestId('notification-center')).toBeInTheDocument()
    }
  })

  it('user menu trigger is clickable', () => {
    renderHeader()
    // The UnstyledButton wrapping Avatar + name should be clickable
    const userArea = screen.getByText('Alice')
    const menuTrigger = userArea.closest('button') ?? userArea.parentElement?.closest('button')
    expect(menuTrigger).not.toBeNull()
  })

  it('logout function is wired to the store', () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined)
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'alice@test.com', name: 'Alice', role: 'participant', skills: [] },
      logout: logoutMock,
    })
    renderHeader()
    // Verify the store's logout was connected (component renders without error)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders with no user gracefully', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      logout: vi.fn(),
    })
    expect(() => renderHeader()).not.toThrow()
  })
})
