import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Calendar, User } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { TagBadge } from '@/components/TagBadge'
import { formatDate } from '@/lib/utils'
import { getWorkingCoverImage } from '@/lib/image-utils'
import type { Project } from '@/types'
import type { Metadata } from 'next'

// Demo project
const DEMO_PROJECT: Project = {
  id: '1',
  slug: 'ai-photo-enhancer',
  title: 'AI Photo Enhancer',
  description: '基于 Stable Diffusion 的老照片修复与增强工具，一键提升图片质量。支持黑白照片上色、模糊图片变清晰。\n\n## 功能特点\n\n- AI 智能修复老照片\n- 黑白照片一键上色\n- 图片分辨率提升 4 倍\n- 支持批量处理\n- 完全隐私保护，本地处理',
  category: 'AI项目',
  cover_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
  project_url: 'https://example.com/ai-photo',
  gallery: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
  ],
  tags: ['AI', '图片处理', '开源'],
  author_id: 'demo-user',
  status: 'published',
  published_at: '2026-03-20T10:00:00Z',
  created_at: '2026-03-20T10:00:00Z',
  author: {
    id: 'demo-user',
    username: 'techguy',
    email: 'demo@example.com',
    avatar_url: undefined,
    is_admin: false,
    created_at: '2026-03-01T00:00:00Z',
  },
}

const DEMO_SLUGS = ['ai-photo-enhancer', 'cursor-ai-ide', 'notion-api-helper', 'voice2json']

async function getProject(slug: string): Promise<Project | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
    // Demo mode
    if (DEMO_SLUGS.includes(slug)) {
      return { ...DEMO_PROJECT, slug }
    }
    return null
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('projects')
    .select('*, author:profiles(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  return data as Project | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: '项目未找到' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://projecthub.dev'

  return {
    title: project.title,
    description: project.description.substring(0, 160).replace(/[#*`>\[\]]/g, ''),
    authors: [{ name: project.author?.username || '匿名' }],
    openGraph: {
      type: 'article',
      title: project.title,
      description: project.description.substring(0, 160).replace(/[#*`>\[\]]/g, ''),
      images: [{ url: getWorkingCoverImage(project.cover_image, project.title), width: 1200, height: 630 }],
      url: `${siteUrl}/projects/${slug}`,
      publishedTime: project.published_at || project.created_at,
      authors: [project.author?.username || '匿名'],
      tags: project.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description.substring(0, 160).replace(/[#*`>\[\]]/g, ''),
      images: [getWorkingCoverImage(project.cover_image, project.title)],
    },
    alternates: {
      canonical: `${siteUrl}/projects/${slug}`,
    },
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://projecthub.dev'

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.title,
    description: project.description.substring(0, 500).replace(/[#*`>\[\]]/g, ''),
    author: {
      '@type': 'Person',
      name: project.author?.username || '匿名',
    },
    datePublished: project.published_at || project.created_at,
    keywords: project.tags.join(', '),
    image: getWorkingCoverImage(project.cover_image, project.title),
    url: project.project_url || siteUrl + `/projects/${slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-content mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-accent hover:text-accent-hover">
            首页
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-500">{project.title}</span>
        </nav>

        {/* Cover */}
        <div className="relative w-full aspect-video rounded-card overflow-hidden mb-8 bg-surface-secondary">
          <Image
            src={getWorkingCoverImage(project.cover_image, project.title)}
            alt={project.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {project.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            <Link
              href={`/u/${project.author?.username}`}
              className="flex items-center gap-1.5 text-accent hover:text-accent-hover"
            >
              <User className="w-4 h-4" />
              {project.author?.username || '匿名'}
            </Link>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(project.published_at || project.created_at)}
            </span>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Project Link */}
          {project.project_url && (
            <a
              href={project.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-accent text-white rounded-btn font-medium hover:bg-accent-hover transition-colors"
            >
              访问项目
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </header>

        {/* Gallery */}
        {project.gallery && project.gallery.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">截图预览</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {project.gallery.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-full aspect-video rounded-card overflow-hidden bg-surface-secondary"
                >
                  <Image
                    src={img}
                    alt={`截图 ${idx + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Content */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">详细介绍</h2>
          <MarkdownRenderer content={project.description} />
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-border">
          {project.project_url && (
            <a
              href={project.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-btn font-medium hover:bg-accent-hover transition-colors"
            >
              访问项目
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </footer>
      </article>
    </>
  )
}
