import { supabase } from '../lib/supabase'
import type { FileObject } from '@supabase/storage-js'

export type FileUploadOptions = {
  bucket: string
  folder?: string
  fileName?: string
}

export interface UploadResult {
  url: string
  path: string
  error?: string
}

export class StorageService {
  // Upload a file to Supabase Storage
  static async uploadFile(
    file: File,
    options: FileUploadOptions
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = options.fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName

      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { url: '', path: '', error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path)

      return {
        url: urlData.publicUrl,
        path: data.path
      }
    } catch (error) {
      console.error('Upload failed:', error)
      return { 
        url: '', 
        path: '', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }
    }
  }

  // Upload team file
  static async uploadTeamFile(
    teamId: string,
    file: File,
    fileName?: string
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: 'team-files',
      folder: `teams/${teamId}`,
      fileName
    })
  }

  // Upload hackathon banner
  static async uploadHackathonBanner(
    hackathonId: string,
    file: File
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: 'hackathon-assets',
      folder: `banners/${hackathonId}`,
      fileName: 'banner'
    })
  }

  // Upload user avatar
  static async uploadUserAvatar(
    userId: string,
    file: File
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: 'avatars',
      folder: userId,
      fileName: 'avatar'
    })
  }

  // Upload team avatar
  static async uploadTeamAvatar(
    teamId: string,
    file: File
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: 'team-avatars',
      folder: teamId,
      fileName: 'avatar'
    })
  }

  // Upload idea attachment
  static async uploadIdeaAttachment(
    ideaId: string,
    file: File,
    fileName?: string
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: 'idea-attachments',
      folder: `ideas/${ideaId}`,
      fileName
    })
  }

  // Delete a file
  static async deleteFile(bucket: string, path: string): Promise<boolean> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  }

  // Get signed URL for private files
  static async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return null
    }

    return data.signedUrl
  }

  // List files in a folder
  static async listFiles(
    bucket: string,
    folder?: string
  ): Promise<FileObject[]> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0
      })

    if (error) {
      console.error('List files error:', error)
      return []
    }

    return data || []
  }

  // Get file info
  static async getFileInfo(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      })

    if (error) {
      console.error('Get file info error:', error)
      return null
    }

    return data?.[0] || null
  }

  // Initialize storage buckets (call this once during setup)
  static async initializeBuckets(): Promise<void> {
    const buckets = [
      'team-files',
      'hackathon-assets', 
      'avatars',
      'team-avatars',
      'idea-attachments'
    ]

    for (const bucket of buckets) {
      const { error } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: [
          'image/*',
          'application/pdf',
          'text/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
          'application/x-zip-compressed'
        ],
        fileSizeLimit: 10485760 // 10MB
      })

      if (error && error.message !== 'Bucket already exists') {
        console.error(`Error creating bucket ${bucket}:`, error)
      }
    }
  }

  // Validate file type and size
  static validateFile(
    file: File,
    allowedTypes: string[] = ['image/*', 'application/pdf', 'text/*'],
    maxSizeMB: number = 10
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB` }
    }

    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })

    if (!isValidType) {
      return { valid: false, error: 'File type not allowed' }
    }

    return { valid: true }
  }
}
