import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Project } from '@/types'

export interface AggregationProjectsResult {
  projects: Project[]
  total: number
  isDemo: boolean
}

export async function getProjectsByTag(tag: string): Promise<AggregationProjectsResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
    return { projects: [], total: 0, isDemo: true }
  }

  const supabase = await createServerSupabaseClient()
  const { data, count } = await supabase
    .from('projects')
    .select('*, author:profiles(*)', { count: 'exact' })
    .eq('status', 'published')
    .contains('tags', [tag])
    .order('published_at', { ascending: false })

  return {
    projects: (data || []) as Project[],
    total: count || 0,
    isDemo: false,
  }
}

export async function getProjectsByCategory(category: string): Promise<AggregationProjectsResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
    return { projects: [], total: 0, isDemo: true }
  }

  const supabase = await createServerSupabaseClient()
  const { data, count } = await supabase
    .from('projects')
    .select('*, author:profiles(*)', { count: 'exact' })
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false })

  return {
    projects: (data || []) as Project[],
    total: count || 0,
    isDemo: false,
  }
}
