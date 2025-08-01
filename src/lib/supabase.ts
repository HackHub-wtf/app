import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
  }
})

// Database types (we'll generate these from the schema later)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url?: string
          role: 'admin' | 'manager' | 'participant'
          skills: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string
          role?: 'admin' | 'manager' | 'participant'
          skills?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string
          role?: 'admin' | 'manager' | 'participant'
          skills?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      hackathons: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string
          registration_key: string
          status: 'draft' | 'open' | 'running' | 'completed'
          max_team_size: number
          allowed_participants: number
          current_participants: number
          created_by: string
          banner_url?: string
          rules?: string
          prizes: string[]
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_date: string
          end_date: string
          registration_key: string
          status?: 'draft' | 'open' | 'running' | 'completed'
          max_team_size: number
          allowed_participants: number
          current_participants?: number
          created_by: string
          banner_url?: string
          rules?: string
          prizes?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          registration_key?: string
          status?: 'draft' | 'open' | 'running' | 'completed'
          max_team_size?: number
          allowed_participants?: number
          current_participants?: number
          created_by?: string
          banner_url?: string
          rules?: string
          prizes?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string
          hackathon_id: string
          created_by: string
          is_open: boolean
          skills: string[]
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          hackathon_id: string
          created_by: string
          is_open?: boolean
          skills?: string[]
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          hackathon_id?: string
          created_by?: string
          is_open?: boolean
          skills?: string[]
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'leader' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'leader' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'leader' | 'member'
          joined_at?: string
        }
      }
      ideas: {
        Row: {
          id: string
          title: string
          description: string
          hackathon_id: string
          team_id?: string
          created_by: string
          category: string
          tags: string[]
          votes: number
          status: 'draft' | 'submitted' | 'in-progress' | 'completed'
          attachments: string[]
          repository_url?: string
          demo_url?: string
          project_attachments?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          hackathon_id: string
          team_id?: string
          created_by: string
          category: string
          tags?: string[]
          votes?: number
          status?: 'draft' | 'submitted' | 'in-progress' | 'completed'
          attachments?: string[]
          repository_url?: string
          demo_url?: string
          project_attachments?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          hackathon_id?: string
          team_id?: string
          created_by?: string
          category?: string
          tags?: string[]
          votes?: number
          status?: 'draft' | 'submitted' | 'in-progress' | 'completed'
          attachments?: string[]
          repository_url?: string
          demo_url?: string
          project_attachments?: string
          created_at?: string
          updated_at?: string
        }
      }
      idea_votes: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          team_id: string
          user_id: string
          content: string
          message_type: 'text' | 'file' | 'system'
          file_url?: string
          file_name?: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          content: string
          message_type?: 'text' | 'file' | 'system'
          file_url?: string
          file_name?: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          content?: string
          message_type?: 'text' | 'file' | 'system'
          file_url?: string
          file_name?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          read: boolean
          action_url?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          action_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          action_url?: string
          created_at?: string
        }
      }
    }
  }
}
