import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Canonical domain — always use xiangmupai.com for sitemap URLs
  const CANONICAL_DOMAIN = 'https://xiangmupai.com'

  const siteUrl = CANONICAL_DOMAIN

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
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

    // Fetch published projects
    const { data: projects } = await supabase
      .from('projects')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)

    const projectPages: MetadataRoute.Sitemap = (projects || []).map((p) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: new Date(p.published_at || p.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [...staticPages, ...projectPages]
  } catch (err) {
    console.error('Sitemap generation error:', err)
    return staticPages
  }
}
