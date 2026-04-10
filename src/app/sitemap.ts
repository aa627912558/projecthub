// Sitemap - generated on-demand
export const dynamic = 'force-dynamic'

import { MetadataRoute } from 'next'

const CANONICAL_DOMAIN = 'https://www.xiangmupai.com'
const SUPABASE_URL = 'https://xxfpsmreaktaugrzsoto.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_NLNYkDI4HGUn90D9BzmAqw_7sSeosxv'

async function getProjects() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/projects?select=slug,published_at,created_at&status=eq.published&order=published_at.desc&limit=500`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`[sitemap] HTTP error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[sitemap] Fetch error:', error)
    return null
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = CANONICAL_DOMAIN

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/submit`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ]

  const projects = await getProjects()
  
  if (!Array.isArray(projects) || projects.length === 0) {
    console.log('[sitemap] No projects from API, checking fallback...')
    // Even if API fails, we know about these published projects from prior queries
    const knownProjects = [
      { slug: 'cps-sui0mk', published_at: '2026-04-03T02:49:13.457Z' },
      { slug: 'ai95-adb3bb', published_at: '2026-04-03T02:49:11.365Z' },
      { slug: 'ai-me0f7e', published_at: '2026-04-03T02:49:09.492Z' },
      { slug: '8000-ntq175', published_at: '2026-03-31T02:11:50.560Z' },
      { slug: '8000-t9pthb', published_at: '2026-03-31T02:11:45.852Z' },
      { slug: '0-ahvwmd', published_at: '2026-03-31T02:11:41.343Z' },
      { slug: '30-pazkud', published_at: '2026-03-31T02:11:36.739Z' },
      { slug: 'aiai8000-qhydd8', published_at: '2026-03-31T02:11:31.840Z' },
      { slug: '01-6khx7q', published_at: '2026-03-31T02:04:18.015Z' },
      { slug: '-61tw03', published_at: '2026-03-31T02:04:08.800Z' },
    ]
    
    const projectPages = knownProjects.map(p => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: new Date(p.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
    
    console.log(`[sitemap] Using ${projectPages.length} fallback project URLs`)
    return [...staticPages, ...projectPages]
  }

  const projectPages: MetadataRoute.Sitemap = projects.map((p: any) => ({
    url: `${siteUrl}/projects/${p.slug}`,
    lastModified: new Date(p.published_at || p.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...projectPages]
}
