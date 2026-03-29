export const dynamic = 'force-dynamic'

import { MetadataRoute } from 'next'

const CANONICAL_DOMAIN = 'https://xiangmupai.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxfpsmreaktaugrzsoto.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_NLNYkDI4HGUn90D9BzmAqw_7sSeosxv'

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
    // Fetch published projects directly via REST API (published projects are publicly readable)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?select=slug,published_at,updated_at&status=eq.published&order=published_at.desc&limit=500`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 0 },
      }
    )

    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status}`)
    }

    const projects = await res.json()

    const projectPages: MetadataRoute.Sitemap = (projects || []).map((p: { slug: string; published_at?: string; updated_at?: string }) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: new Date(p.published_at || p.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [...staticPages, ...projectPages]
  } catch (err) {
    console.error('Sitemap generation error:', err)
    return staticPages
  }
}
