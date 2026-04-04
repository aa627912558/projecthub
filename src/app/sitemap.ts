// Sitemap with ISR - revalidate every hour
export const revalidate = 3600

import { MetadataRoute } from 'next'

const CANONICAL_DOMAIN = 'https://xiangmupai.com'
const SUPABASE_URL = 'https://xxfpsmreaktaugrzsoto.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_NLNYkDI4HGUn90D9BzmAqw_7sSeosxv'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    console.log('[sitemap] Fetching projects from Supabase...')
    
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?select=slug,published_at,updated_at&status=eq.published&order=published_at.desc&limit=500`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json',
          ' Prefer': 'count=exact',
        },
        next: { revalidate: 0 }, // Always fetch fresh data
      }
    )

    if (!res.ok) {
      console.error(`[sitemap] Supabase error: ${res.status} ${res.statusText}`)
      throw new Error(`Supabase error: ${res.status}`)
    }

    const projects = await res.json()
    console.log(`[sitemap] Received ${Array.isArray(projects) ? projects.length : 'non-array'} projects`)

    if (!Array.isArray(projects) || projects.length === 0) {
      console.error('[sitemap] No projects returned, using fallback')
      // Return known project slugs as fallback
      const fallbackSlugs = [
        'cps-sui0mk', 'ai95-adb3bb', 'ai-me0f7e', '8000-ntq175', '8000-t9pthb',
        '0-ahvwmd', '30-pazkud', 'aiai8000-qhydd8', '01-6khx7q', '-61tw03'
      ]
      const fallbackPages = fallbackSlugs.map(slug => ({
        url: `${siteUrl}/projects/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
      return [...staticPages, ...fallbackPages]
    }

    const projectPages: MetadataRoute.Sitemap = projects.map((p: { slug: string; published_at?: string; updated_at?: string }) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: new Date(p.published_at || p.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const allPages = [...staticPages, ...projectPages]
    console.log(`[sitemap] Generated ${allPages.length} URLs`)
    return allPages
  } catch (err) {
    console.error('[sitemap] Fatal error:', err)
    // Return static pages only on error
    return staticPages
  }
}
