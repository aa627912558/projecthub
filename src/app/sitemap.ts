import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    : 'https://jingxuanai.com'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  try {
    const supabase = await createAdminClient()

    // Fetch tools
    const { data: tools } = await supabase
      .from('tools')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1000)

    const toolPages: MetadataRoute.Sitemap = (tools || []).map((t) => ({
      url: `${siteUrl}/tool/${t.slug}`,
      lastModified: new Date(t.published_at || t.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    // Fetch news articles
    const { data: news } = await supabase
      .from('news_articles')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)

    const newsPages: MetadataRoute.Sitemap = (news || []).map((n) => ({
      url: `${siteUrl}/news/${n.slug}`,
      lastModified: new Date(n.published_at || n.updated_at),
      changeFrequency: 'daily',
      priority: 0.6,
    }))

    return [...staticPages, ...toolPages, ...newsPages]
  } catch (err) {
    console.error('Sitemap generation error:', err)
    return staticPages
  }
}
