export const dynamic = 'force-dynamic'

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
    // Fetch with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?select=slug,published_at,updated_at&status=eq.published&order=published_at.desc&limit=500`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status} ${res.statusText}`)
    }

    const projects = await res.json()

    if (!Array.isArray(projects)) {
      throw new Error(`Unexpected response: ${JSON.stringify(projects)?.slice(0, 200)}`)
    }

    const projectPages: MetadataRoute.Sitemap = projects.map((p: { slug: string; published_at?: string; updated_at?: string }) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: new Date(p.published_at || p.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const allPages = [...staticPages, ...projectPages]
    console.log(`[sitemap] Generated ${allPages.length} URLs (${projectPages.length} projects)`)
    return allPages
  } catch (err: any) {
    console.error('[sitemap] Error:', err?.message || err)
    // Return static pages + empty array instead of just static pages
    // This ensures at least the article structure is correct
    return staticPages
  }
}
