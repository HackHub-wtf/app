export interface FileUpload {
  id: string
  team_id: string
  user_id: string
  filename: string
  original_name: string
  file_url: string
  file_size: number
  mime_type: string
  created_at: string
}

export interface FileUploadWithProfile extends FileUpload {
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  }
}

export class FileService {
  // Get files for a team (mock data for now)
  static async getTeamFiles(teamId: string): Promise<FileUploadWithProfile[]> {
    // Mock data since table doesn't exist yet
    const mockFiles: FileUploadWithProfile[] = [
      {
        id: '1',
        team_id: teamId,
        user_id: '1',
        filename: 'project-wireframes.pdf',
        original_name: 'wireframes.pdf',
        file_url: '#',
        file_size: 2048576,
        mime_type: 'application/pdf',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        profiles: {
          id: '1',
          name: 'John Doe',
          avatar_url: null
        }
      },
      {
        id: '2',
        team_id: teamId,
        user_id: '2',
        filename: 'app-mockup.png',
        original_name: 'mockup.png',
        file_url: '#',
        file_size: 1024000,
        mime_type: 'image/png',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        profiles: {
          id: '2',
          name: 'Jane Smith',
          avatar_url: null
        }
      }
    ]

    return mockFiles
  }

  // Upload a file (mock implementation)
  static async uploadFile(
    teamId: string,
    userId: string,
    file: File
  ): Promise<FileUpload | null> {
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newFile: FileUpload = {
        id: Date.now().toString(),
        team_id: teamId,
        user_id: userId,
        filename: file.name,
        original_name: file.name,
        file_url: URL.createObjectURL(file),
        file_size: file.size,
        mime_type: file.type,
        created_at: new Date().toISOString()
      }

      return newFile
    } catch (error) {
      console.error('Error in uploadFile:', error)
      throw error
    }
  }

  // Delete a file (mock implementation)
  static async deleteFile(_fileId: string): Promise<boolean> {
    // Simulate delete
    await new Promise(resolve => setTimeout(resolve, 500))
    return true
  }
}
