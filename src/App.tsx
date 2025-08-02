import { Routes, Route } from 'react-router-dom'
import { AppShell, LoadingOverlay } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Hackathons } from './pages/Hackathons'
import HackathonDetail from './pages/HackathonDetail'
import CreateHackathon from './pages/CreateHackathon'
import { HackathonEdit } from './pages/HackathonEdit'
import { Teams } from './pages/Teams'
import { Ideas } from './pages/Ideas'
import { ProjectShowcase } from './pages/ProjectShowcase'
import { Profile } from './pages/Profile'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { OrganizationSetup } from './pages/OrganizationSetup'
import { AdminUsers } from './pages/AdminUsers'
import { AdminOrganizations } from './pages/AdminOrganizations'
import { useAuthStore } from './store/authStore'
import { RealtimeProvider } from './contexts/RealtimeContext'

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
        <Route path="/organization/setup" element={<OrganizationSetup />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <RealtimeProvider>
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
            <Route path="/hackathons/:id/edit" element={<HackathonEdit />} />
            <Route path="/hackathons/:id/teams" element={<Teams />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="/hackathons/:id/ideas" element={<Ideas />} />
            <Route path="/projects" element={<ProjectShowcase />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/organization/setup" element={<OrganizationSetup />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/organizations" element={<AdminOrganizations />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </RealtimeProvider>
  )
}

export default App
