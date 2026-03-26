import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Calendar, ArrowLeft, Newspaper } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import type { NewsArticle } from '@/types'

async function getNewsArticle(slug: string): Promise<NewsArticle | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
    return null
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('news_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  return data as NewsArticle | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsArticle(slug)

  if (!article) {
    return { title: '资讯未找到' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xiangmupai.com'
  const description = article.summary.substring(0, 160)

  return {
    title: article.title,
    description,
    keywords: article.tags,
    authors: [{ name: '项目派' }],
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      images: article.cover_image ? [{ url: article.cover_image, width: 1200, height: 630 }] : [],
      url: `${siteUrl}/news/${slug}`,
      publishedTime: article.published_at,
      authors: ['项目派'],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: article.cover_image ? [article.cover_image] : [],
    },
    alternates: {
      canonical: `${siteUrl}/news/${slug}`,
    },
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getNewsArticle(slug)

  if (!article) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xiangmupai.com'

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    author: {
      '@type': 'Organization',
      name: article.source_name,
      url: article.source_url || siteUrl,
    },
    datePublished: article.published_at,
    keywords: article.tags.join(', '),
    image: article.cover_image,
    url: `${siteUrl}/news/${slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm flex items-center gap-2">
          <Link href="/" className="text-accent hover:text-accent-hover">
            首页
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/news" className="text-accent hover:text-accent-hover flex items-center gap-1">
            <Newspaper className="w-3.5 h-3.5" />
            AI资讯
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500 truncate max-w-[200px]">{article.title}</span>
        </nav>

        <article className="max-w-3xl mx-auto">
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs font-medium bg-accent-light text-accent rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-border">
            <span className="flex items-center gap-1.5 text-accent font-medium">
              <Newspaper className="w-4 h-4" />
              {article.source_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(article.published_at)}
            </span>
            <span className="text-xs text-gray-400">
              摘要由项目派 AI 生成
            </span>
          </div>

          {/* Summary (main content) */}
          <div className="prose prose-lg max-w-none mb-10">
            <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
              {article.summary}
            </div>
          </div>

          {/* Source Attribution */}
          <div className="bg-accent-light rounded-card p-5 mb-8">
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-accent">📢 资讯来源：</span>
              本篇资讯内容来自{' '}
              <span className="font-semibold text-gray-800">{article.source_name}</span>
              ，由项目派 AI 精心摘要整理。
            </p>
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-full font-medium hover:bg-accent-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              阅读原文
            </a>
          </div>

          {/* Back link */}
          <div className="mb-10">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回资讯列表
            </Link>
          </div>

          {/* Disclaimer */}
          <footer className="text-xs text-gray-400 border-t border-border pt-6">
            <p>
              本页面内容为 AI 摘要，仅供参考。原文版权归 {article.source_name} 所有。
              如有侵权请联系删除。
            </p>
          </footer>
        </article>
      </div>
    </>
  )
}
