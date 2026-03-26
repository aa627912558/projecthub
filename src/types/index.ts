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
  category?: string
  categories?: string[]
  cover_image: string
  project_url: string
  gallery: string[]
  tags: string[]
  author_id: string
  author?: Profile
  status: 'pending' | 'published' | 'rejected' | 'pending_review'
  rejection_reason?: string
  flagged_content?: FlaggedItem[] | null
  flagged_reason?: string | null
  created_at: string
  published_at?: string
}

export interface FlaggedItem {
  type: 'phone' | 'wechat' | 'qq' | 'email' | 'url' | 'address' | 'other'
  original: string
  replacement: string
  field: string
}

export interface ProjectFormData {
  title: string
  description: string
  category?: string
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

// News Articles
export interface NewsArticle {
  id: string
  slug: string
  title: string
  summary: string        // AI-generated summary (100-300 chars)
  source_name: string   // e.g. "机器之心"
  source_url: string    // RSS feed URL
  original_url: string  // Original article URL
  published_at: string  // Original publish date
  cover_image?: string   // Optional cover image
  tags: string[]
  status: 'draft' | 'published'
  created_at: string
}
