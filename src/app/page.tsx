import { createServerSupabaseClient } from '@/lib/supabase-server'
import { HomePageClient } from '@/components/HomePageClient'
import type { Project } from '@/types'
import type { Metadata } from 'next'

interface SearchParams {
  q?: string
  tag?: string
  page?: string
  category?: string
}

// Demo data when Supabase is not configured
const DEMO_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'AI Photo Enhancer',
    slug: 'ai-photo-enhancer',
    description: '基于 Stable Diffusion 的老照片修复与增强工具，一键提升图片质量。支持黑白照片上色、模糊图片变清晰。',
    content: '## 功能特点\n\n- AI 智能修复老照片\n- 黑白照片一键上色\n- 图片分辨率提升 4 倍\n- 支持批量处理',
    cover_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    project_url: 'https://example.com/ai-photo',
    gallery: [],
    tags: ['AI', '图片处理', '开源'],
    category: 'AI项目',
    author_id: 'demo-user',
    status: 'published',
    created_at: '2026-03-20T10:00:00Z',
    published_at: '2026-03-20T10:00:00Z',
    author: {
      id: 'demo-user',
      username: 'techguy',
      email: 'techguy@example.com',
      avatar_url: undefined,
      is_admin: false,
      created_at: '2026-03-01T00:00:00Z',
    },
  },
  {
    id: '2',
    title: 'Cursor AI IDE',
    slug: 'cursor-ai-ide',
    description: '专为 AI 时代打造的代码编辑器，集成 GPT-4 / Claude 等大模型，实时辅助编程。',
    content: '## 为什么选择 Cursor\n\n- 内置 AI 代码补全\n- 自然语言编辑功能\n- 代码库级别的 AI 理解\n- 支持所有主流编程语言',
    cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    project_url: 'https://cursor.sh',
    gallery: [],
    tags: ['AI', '开发工具', '代码编辑器'],
    category: 'AI项目',
    author_id: 'demo-user-2',
    status: 'published',
    created_at: '2026-03-19T15:30:00Z',
    published_at: '2026-03-19T15:30:00Z',
    author: {
      id: 'demo-user-2',
      username: 'devenv',
      email: 'devenv@example.com',
      avatar_url: undefined,
      is_admin: false,
      created_at: '2026-03-01T00:00:00Z',
    },
  },
  {
    id: '3',
    title: 'Notion API 助手',
    slug: 'notion-api-helper',
    description: '可视化 Notion API 操作工具，无需写代码即可管理你的 Notion 数据库。',
    content: '## 功能\n\n- 拖拽式数据库操作\n- 模板市场\n- 自动同步\n- 多工作区支持',
    cover_image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    project_url: 'https://notiontools.dev',
    gallery: [],
    tags: ['Notion', '效率工具', '无代码'],
    category: '副业',
    author_id: 'demo-user-3',
    status: 'published',
    created_at: '2026-03-18T09:00:00Z',
    published_at: '2026-03-18T09:00:00Z',
    author: {
      id: 'demo-user-3',
      username: 'producthunt',
      email: 'producthunt@example.com',
      avatar_url: undefined,
      is_admin: false,
      created_at: '2026-03-01T00:00:00Z',
    },
  },
  {
    id: '4',
    title: 'Voice2JSON',
    slug: 'voice2json',
    description: '开源语音转 JSON 工具，支持自定义语法，适合搭建本地语音助手。',
    content: '## 亮点\n\n- 完全本地运行\n- 自定义语音指令\n- 输出结构化 JSON\n- 支持 20+ 语言',
    cover_image: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&q=80',
    project_url: 'https://voice2json.org',
    gallery: [],
    tags: ['语音助手', '开源', 'JSON'],
    category: 'AI项目',
    author_id: 'demo-user-4',
    status: 'published',
    created_at: '2026-03-17T14:00:00Z',
    published_at: '2026-03-17T14:00:00Z',
    author: {
      id: 'demo-user-4',
      username: 'aigeeks',
      email: 'aigeeks@example.com',
      avatar_url: undefined,
      is_admin: false,
      created_at: '2026-03-01T00:00:00Z',
    },
  },
]

const DEMO_TAGS = ['AI', '开发工具', '图片处理', '效率工具', '开源', '无代码', '语音助手', 'Notion', '代码编辑器', 'JSON']

async function getProjects(searchParams: SearchParams) {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
    // Demo mode - filter demo projects by search params
    let filtered = [...DEMO_PROJECTS]
    if (searchParams.q) {
      const q = searchParams.q.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    }
    if (searchParams.tag) {
      filtered = filtered.filter(p => p.tags.includes(searchParams.tag!))
    }
    if (searchParams.category) {
      filtered = filtered.filter(p => p.category === searchParams.category)
    }
    return { projects: filtered, total: filtered.length, page: 1, pageSize: 12, isDemo: true }
  }

  const supabase = await createServerSupabaseClient()
  const page = parseInt(searchParams.page || '1')
  const pageSize = 12
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('projects')
    .select('*, author:profiles(*)', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (searchParams.q) {
    query = query.or(`title.ilike.%${searchParams.q}%,description.ilike.%${searchParams.q}%`)
  }

  if (searchParams.tag) {
    query = query.contains('tags', [searchParams.tag])
  }

  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  const { data, count } = await query

  return {
    projects: (data || []) as Project[],
    total: count || 0,
    page,
    pageSize,
    isDemo: false,
  }
}

async function getAllTags() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
    return DEMO_TAGS
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('projects')
    .select('tags')
    .eq('status', 'published')

  const tagCounts: Record<string, number> = {}
  data?.forEach((project) => {
    project.tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag]) => tag)
}

export const metadata: Metadata = {
  title: 'ProjectHub - 发现和分享有趣的项目',
  description: 'ProjectHub 是一个开放的项目分享平台，让每一个好项目都被看见。',
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [{ projects, total, page, pageSize, isDemo }, tags] = await Promise.all([
    getProjects(params),
    getAllTags(),
  ])

  return (
    <main>
      {isDemo && (
        <div className="bg-amber-50 border-b border-amber-200 py-2 text-center text-sm text-amber-800">
          🎨 演示模式 — 配置 Supabase 后显示真实数据
        </div>
      )}
      <HomePageClient
        initialProjects={projects}
        initialTags={tags}
        initialSearchParams={params}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </main>
  )
}
