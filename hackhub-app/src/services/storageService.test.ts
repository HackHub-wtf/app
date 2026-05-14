import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from './storageService'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../lib/apiClient'
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
}

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPresignedUrl', () => {
    it('calls correct endpoint and returns url', async () => {
      mockApi.get.mockResolvedValueOnce({ url: 'https://minio/bucket/key?sig=abc' })
      const result = await StorageService.getPresignedUrl('avatars', 'avatars/user-1.png')
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/storage/url/avatars?key=avatars%2Fuser-1.png'
      )
      expect(result).toBe('https://minio/bucket/key?sig=abc')
    })

    it('encodes key with special characters', async () => {
      mockApi.get.mockResolvedValueOnce({ url: 'https://minio/url' })
      await StorageService.getPresignedUrl('team-files', 'teams/t-1/my file.pdf')
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/storage/url/team-files?key=teams%2Ft-1%2Fmy%20file.pdf'
      )
    })
  })

  describe('uploadTeamFile', () => {
    it('delegates to uploadFile with correct bucket and prefix', async () => {
      const uploadSpy = vi.spyOn(StorageService, 'uploadFile').mockResolvedValueOnce({
        key: 'teams/t-1/doc.pdf',
        url: 'https://minio/doc.pdf',
      })
      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
      await StorageService.uploadTeamFile('t-1', file)
      expect(uploadSpy).toHaveBeenCalledWith(file, 'team-files', 'teams/t-1')
      uploadSpy.mockRestore()
    })
  })

  describe('uploadHackathonBanner', () => {
    it('delegates to uploadFile with correct bucket and prefix', async () => {
      const uploadSpy = vi.spyOn(StorageService, 'uploadFile').mockResolvedValueOnce({
        key: 'banners/h-1/banner.png',
        url: 'https://minio/banner.png',
      })
      const file = new File(['img'], 'banner.png', { type: 'image/png' })
      await StorageService.uploadHackathonBanner('h-1', file)
      expect(uploadSpy).toHaveBeenCalledWith(file, 'hackathon-assets', 'banners/h-1')
      uploadSpy.mockRestore()
    })
  })

  describe('uploadProfileAvatar', () => {
    it('delegates to uploadFile with correct bucket and prefix', async () => {
      const uploadSpy = vi.spyOn(StorageService, 'uploadFile').mockResolvedValueOnce({
        key: 'avatars/u-1.jpg',
        url: 'https://minio/avatar.jpg',
      })
      const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' })
      await StorageService.uploadProfileAvatar('u-1', file)
      expect(uploadSpy).toHaveBeenCalledWith(file, 'avatars', 'avatars/u-1')
      uploadSpy.mockRestore()
    })
  })
})
