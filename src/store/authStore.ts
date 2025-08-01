import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { ProfileService } from '../services/profileService'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'user'
  avatar?: string
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
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true })
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Get user profile
        const profile = await ProfileService.getCurrentProfile()
        if (profile) {
          set({
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              avatar: profile.avatar_url || undefined,
              skills: profile.skills
            }
          })
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await ProfileService.getCurrentProfile()
          if (profile) {
            set({
              user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                avatar: profile.avatar_url || undefined,
                skills: profile.skills
              }
            })
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null })
        }
      })

      set({ initialized: true })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set({ loading: false })
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ loading: true })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        const profile = await ProfileService.getCurrentProfile()
        if (profile) {
          set({
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              avatar: profile.avatar_url || undefined,
              skills: profile.skills
            }
          })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signup: async (email: string, password: string, name: string) => {
    try {
      set({ loading: true })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })

      if (error) throw error

      // Profile will be created automatically via database trigger
      if (data.user) {
        // Wait a moment for the trigger to create the profile
        setTimeout(async () => {
          const profile = await ProfileService.getCurrentProfile()
          if (profile) {
            set({
              user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                avatar: profile.avatar_url || undefined,
                skills: profile.skills
              }
            })
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    try {
      set({ loading: true })
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null })
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateProfile: async (updates: Partial<AuthUser>) => {
    try {
      const { user } = get()
      if (!user) throw new Error('No user logged in')

      set({ loading: true })

      const profileUpdates = {
        name: updates.name,
        avatar_url: updates.avatar,
        role: updates.role,
        skills: updates.skills
      }

      const updatedProfile = await ProfileService.updateProfile(user.id, profileUpdates)
      
      if (updatedProfile) {
        set({
          user: {
            id: updatedProfile.id,
            email: updatedProfile.email,
            name: updatedProfile.name,
            role: updatedProfile.role,
            avatar: updatedProfile.avatar_url || undefined,
            skills: updatedProfile.skills
          }
        })
      }
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  setUser: (user: AuthUser | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading })
}))
