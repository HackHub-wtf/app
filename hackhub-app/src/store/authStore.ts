import { create } from 'zustand'
import { api } from '../lib/apiClient'
import { tokenStore } from '../lib/tokenStore'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'participant'
  avatar?: string
  skills: string[]
}

interface AuthResponse {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
    role: string
    avatarUrl: string | null
  }
}

interface ProfileResponse {
  id: string
  email: string
  name: string
  role: string
  avatarUrl: string | null
  skills: string[]
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>
  refreshProfile: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
}

function mapUser(u: AuthResponse['user'] | ProfileResponse): AuthUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as AuthUser['role'],
    avatar: 'avatarUrl' in u ? u.avatarUrl ?? undefined : undefined,
    skills: 'skills' in u ? u.skills : [],
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    set({ loading: true })
    try {
      // Try to restore session via refresh token cookie (httpOnly — automatic)
      if (!tokenStore.hasToken()) {
        const refreshed = await tryRefreshSilently()
        if (!refreshed) {
          set({ initialized: true, loading: false })
          return
        }
      }
      const profile = await api.get<ProfileResponse>('/api/v1/profiles/me')
      set({ user: mapUser(profile) })
    } catch {
      tokenStore.clear()
    } finally {
      set({ initialized: true, loading: false })
    }

    // Listen for session expiry events emitted by apiClient
    window.addEventListener('auth:session-expired', () => {
      set({ user: null })
    })
  },

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const data = await api.post<AuthResponse>('/api/v1/auth/login', { email, password },
        { skipAuth: true })
      tokenStore.setAccessToken(data.accessToken)
      // Fetch full profile (includes skills)
      const profile = await api.get<ProfileResponse>('/api/v1/profiles/me')
      set({ user: mapUser(profile) })
    } finally {
      set({ loading: false })
    }
  },

  signup: async (email: string, password: string, name: string) => {
    set({ loading: true })
    try {
      const data = await api.post<AuthResponse>('/api/v1/auth/register', { email, name, password },
        { skipAuth: true })
      tokenStore.setAccessToken(data.accessToken)
      set({ user: mapUser(data.user) })
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      await api.post('/api/v1/auth/logout')
    } finally {
      tokenStore.clear()
      set({ user: null, loading: false })
    }
  },

  updateProfile: async (updates: Partial<AuthUser>) => {
    set({ loading: true })
    try {
      const profile = await api.patch<ProfileResponse>('/api/v1/profiles/me', {
        name: updates.name,
        avatarUrl: updates.avatar,
        skills: updates.skills,
      })
      set({ user: mapUser(profile) })
    } finally {
      set({ loading: false })
    }
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return
    try {
      const profile = await api.get<ProfileResponse>('/api/v1/profiles/me')
      set({ user: mapUser(profile) })
    } catch { /* silent — user stays logged in */ }
  },

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

async function tryRefreshSilently(): Promise<boolean> {
  try {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return false
    const { accessToken } = await res.json()
    tokenStore.setAccessToken(accessToken)
    return true
  } catch {
    return false
  }
}
