import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ExternalLink, Calendar, Newspaper } from 'lucide-react'
import type { Metadata } from 'next'
import type { NewsArticle } from '@/types'

export const metadata: Metadata = {
  title: 'AI资讯',
  description: '精选AI行业最新资讯，AI工具、生成式AI、大模型最新动态。资讯内容来自机器之心、量子位等优质媒体。',
  keywords: ['AI资讯', '人工智能新闻', 'AI工具', '大模型', '生成式AI'],
  openGraph: {
    title: 'AI资讯 - 项目派',
    description: '精选AI行业最新资讯，AI工具、生成式AI、大模型最新动态。',
    type: 'website',
  },
}

async function getNews(): Promise<NewsArticle[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
    return []
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('news_articles')
      .select('id, slug, title, summary, source_name, original_url, published_at, cover_image, tags, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50)

    return (data as NewsArticle[]) || []
  } catch (err) {
    console.error('Failed to fetch news:', err)
    return []
  }
}

export default async function NewsPage() {
  const news = await getNews()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xiangmupai.com'

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-10">
      {/* Page Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">AI资讯</h1>
        </div>
        <p className="text-gray-500 text-lg">
          精选AI行业最新资讯，AI工具、生成式AI、大模型动态。内容来自优质媒体，我们精心摘要。
        </p>
      </header>

      {news.length === 0 ? (
        <div className="text-center py-20">
          <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">暂无资讯</p>
          <p className="text-gray-400 text-sm">资讯正在抓取中，请稍后再来</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-card border border-border p-6 hover:shadow-md transition-shadow"
            >
              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {article.tags.slice(0, 3).map((tag) => (
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
              <h2 className="text-xl font-semibold text-gray-900 mb-3 hover:text-accent transition-colors">
                <Link href={`/news/${article.slug}`}>
                  {article.title}
                </Link>
              </h2>

              {/* Summary */}
              <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                {article.summary}
              </p>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium text-accent">{article.source_name}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(article.published_at)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/news/${article.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-accent hover:text-accent-hover border border-accent rounded-full hover:bg-accent-light transition-colors"
                  >
                    阅读摘要
                  </Link>
                  <a
                    href={article.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-full transition-colors"
                  >
                    原文链接
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Source attribution */}
              <p className="text-xs text-gray-400 mt-3">
                资讯内容来自 {article.source_name}，
                <a
                  href={article.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600"
                >
                  查看原文
                </a>
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
