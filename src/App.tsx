import { Routes, Route } from 'react-router-dom'
import { AppShell, LoadingOverlay } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Hackathons } from './pages/Hackathons'
import { HackathonDetail } from './pages/HackathonDetail'
import { CreateHackathon } from './pages/CreateHackathon'
import { Teams } from './pages/Teams'
import { Ideas } from './pages/Ideas'
import { Profile } from './pages/Profile'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { useAuthStore } from './store/authStore'
import { SocketProvider } from './contexts/SocketContext'

function App() {
  const [opened, { toggle }] = useDisclosure()
  const { user, loading, initialized, initialize } = useAuthStore()

  // Initialize auth on app start
  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  // Show loading while initializing
  if (!initialized || loading) {
    return <LoadingOverlay visible />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <SocketProvider>
      <AppShell
        header={{ height: 70 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Header opened={opened} toggle={toggle} />
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Sidebar />
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hackathons" element={<Hackathons />} />
            <Route path="/hackathons/create" element={<CreateHackathon />} />
            <Route path="/hackathons/:id" element={<HackathonDetail />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </SocketProvider>
  )
}

export default App
