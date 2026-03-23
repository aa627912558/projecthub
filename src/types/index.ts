export interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string
  is_admin: boolean
  created_at: string
}

export interface Project {
  id: string
  slug: string
  title: string
  description: string
  content?: string
  cover_image: string
  project_url: string
  gallery: string[]
  tags: string[]
  author_id: string
  author?: Profile
  status: 'pending' | 'published' | 'rejected'
  rejection_reason?: string
  created_at: string
  published_at?: string
}

export interface ProjectFormData {
  title: string
  description: string
  cover_image: string
  project_url: string
  gallery: string[]
  tags: string[]
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
