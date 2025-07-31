import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type ChatMessage = Database['public']['Tables']['chat_messages']['Row']

export interface ChatMessageWithProfile extends ChatMessage {
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  }
}

export class ChatService {
  // Get chat messages for a team
  static async getTeamMessages(teamId: string): Promise<ChatMessageWithProfile[]> {
    // First, get the chat messages
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching chat messages:', messagesError)
      return []
    }

    if (!messages || messages.length === 0) {
      return []
    }

    // Get unique user IDs
    const userIds = [...new Set(messages.map(msg => msg.user_id))]
    
    // Get user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching user profiles for chat:', profilesError)
      return messages.map(msg => ({
        ...msg,
        profiles: {
          id: msg.user_id,
          name: 'Unknown User',
          avatar_url: null
        }
      }))
    }

    // Combine messages with profiles
    const messagesWithProfiles: ChatMessageWithProfile[] = messages.map(msg => {
      const profile = profiles?.find(p => p.id === msg.user_id) || {
        id: msg.user_id,
        name: 'Unknown User',
        avatar_url: null
      }
      
      return {
        ...msg,
        profiles: profile
      }
    })

    return messagesWithProfiles
  }

  // Send a text message
  static async sendMessage(
    teamId: string,
    userId: string,
    content: string
  ): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        team_id: teamId,
        user_id: userId,
        content,
        message_type: 'text'
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }

    return data
  }

  // Send a file message
  static async sendFileMessage(
    teamId: string,
    userId: string,
    fileName: string,
    fileUrl: string
  ): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        team_id: teamId,
        user_id: userId,
        content: `Shared file: ${fileName}`,
        message_type: 'file',
        file_url: fileUrl,
        file_name: fileName
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending file message:', error)
      throw error
    }

    return data
  }

  // Send a system message
  static async sendSystemMessage(
    teamId: string,
    content: string
  ): Promise<ChatMessage | null> {
    // Use a system user ID (you might want to create a dedicated system user)
    const systemUserId = '00000000-0000-0000-0000-000000000000'
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        team_id: teamId,
        user_id: systemUserId,
        content,
        message_type: 'system'
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending system message:', error)
      throw error
    }

    return data
  }

  // Delete a message
  static async deleteMessage(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      throw error
    }

    return true
  }

  // Get latest message for a team (for preview)
  static async getLatestMessage(teamId: string): Promise<ChatMessageWithProfile | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching latest message:', error)
      return null
    }

    return data as ChatMessageWithProfile
  }
}
