import { supabase } from '../lib/supabase'

export interface FileMetadata {
  id: string
  team_id: string
  user_id: string
  filename: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
}

export interface FileMetadataWithProfile extends FileMetadata {
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  }
}

export class FileService {
  static readonly BUCKET_NAME = 'team-files'

  // Get files for a team
  static async getTeamFiles(teamId: string): Promise<FileMetadataWithProfile[]> {
    try {
      // First, get the file metadata
      const { data: files, error: filesError } = await supabase
        .from('file_metadata')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (filesError) {
        console.error('Error fetching team files:', filesError)
        throw filesError
      }

      if (!files || files.length === 0) {
        return []
      }

      // Get unique user IDs
      const userIds = [...new Set(files.map(file => file.user_id))]
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError)
        throw profilesError
      }

      // Combine files with profiles
      const filesWithProfiles: FileMetadataWithProfile[] = files.map(file => {
        const profile = profiles?.find(p => p.id === file.user_id) || {
          id: file.user_id,
          name: 'Unknown User',
          avatar_url: null
        }
        
        return {
          ...file,
          profiles: profile
        }
      })

      return filesWithProfiles
    } catch (error) {
      console.error('Error in getTeamFiles:', error)
      throw error
    }
  }

  // Upload a file to Supabase Storage
  static async uploadFile(
    teamId: string,
    userId: string,
    file: File
  ): Promise<FileMetadata | null> {
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${teamId}/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw uploadError
      }

      // Create metadata record
      const { data, error: metadataError } = await supabase
        .from('file_metadata')
        .insert([
          {
            team_id: teamId,
            user_id: userId,
            filename: fileName,
            original_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
          },
        ])
        .select()
        .single()

      if (metadataError) {
        console.error('Error creating file metadata:', metadataError)
        // Clean up the uploaded file if metadata creation fails
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath])
        throw metadataError
      }

      return data
    } catch (error) {
      console.error('Error in uploadFile:', error)
      throw error
    }
  }

  // Get file download URL
  static async getFileUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      return data?.signedUrl || null
    } catch (error) {
      console.error('Error getting file URL:', error)
      return null
    }
  }

  // Delete a file
  static async deleteFile(fileId: string): Promise<boolean> {
    try {
      // First, get the file metadata to know the file path
      const { data: fileMetadata, error: fetchError } = await supabase
        .from('file_metadata')
        .select('file_path')
        .eq('id', fileId)
        .single()

      if (fetchError || !fileMetadata) {
        console.error('Error fetching file metadata for deletion:', fetchError)
        return false
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileMetadata.file_path])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Continue to delete metadata even if storage deletion fails
      }

      // Delete metadata record
      const { error: metadataError } = await supabase
        .from('file_metadata')
        .delete()
        .eq('id', fileId)

      if (metadataError) {
        console.error('Error deleting file metadata:', metadataError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteFile:', error)
      return false
    }
  }

  // Get file info for download
  static async downloadFile(fileId: string): Promise<{ url: string; filename: string } | null> {
    try {
      const { data: fileMetadata, error: fetchError } = await supabase
        .from('file_metadata')
        .select('file_path, original_name')
        .eq('id', fileId)
        .single()

      if (fetchError || !fileMetadata) {
        console.error('Error fetching file metadata for download:', fetchError)
        return null
      }

      const url = await this.getFileUrl(fileMetadata.file_path)
      if (!url) {
        return null
      }

      return {
        url,
        filename: fileMetadata.original_name,
      }
    } catch (error) {
      console.error('Error in downloadFile:', error)
      return null
    }
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon based on mime type
  static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('document') || mimeType.includes('text')) return '📝'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📺'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
    return '📄'
  }
}
