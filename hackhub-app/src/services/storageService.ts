import { api } from '../lib/apiClient'

export interface UploadResult {
  key: string
  url: string
}

export type StorageBucket =
  | 'avatars'
  | 'team-files'
  | 'hackathon-assets'
  | 'project-attachments'
  | 'team-avatars'

export class StorageService {
  static async uploadFile(
    file: File,
    bucket: StorageBucket,
    prefix: string
  ): Promise<UploadResult> {
    const form = new FormData()
    form.append('file', file)
    form.append('prefix', prefix)

    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
    const { tokenStore } = await import('../lib/tokenStore')

    const res = await fetch(`${BASE_URL}/api/v1/storage/upload/${bucket}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenStore.getAccessToken() ?? ''}`,
      },
      body: form,
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)
    return res.json()
  }

  static async getPresignedUrl(bucket: StorageBucket, key: string): Promise<string> {
    const result = await api.get<{ url: string }>(
      `/api/v1/storage/url/${bucket}?key=${encodeURIComponent(key)}`
    )
    return result.url
  }

  static async uploadTeamFile(teamId: string, file: File): Promise<UploadResult> {
    return StorageService.uploadFile(file, 'team-files', `teams/${teamId}`)
  }

  static async uploadHackathonBanner(hackathonId: string, file: File): Promise<UploadResult> {
    return StorageService.uploadFile(file, 'hackathon-assets', `banners/${hackathonId}`)
  }

  static async uploadProfileAvatar(userId: string, file: File): Promise<UploadResult> {
    return StorageService.uploadFile(file, 'avatars', `avatars/${userId}`)
  }
}
