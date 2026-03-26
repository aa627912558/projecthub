import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { generateSlug } from '@/lib/utils'
import type { NewsArticle } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const tag = searchParams.get('tag')

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('news_articles')
      .select('id, slug, title, summary, source_name, original_url, published_at, cover_image, tags, created_at', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (tag) {
      query = query.contains('tags', [tag])
    }

    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('News GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data as NewsArticle[],
      total: count || 0,
      page,
      pageSize,
    })
  } catch (err) {
    console.error('News GET error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// Internal: generate news summaries from RSS (called by cron or manually)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'generate') {
      // This is called by a cron job or admin to trigger summary generation
      // The actual work is done by the scripts/generate-news-summaries.ts
      return NextResponse.json({ message: 'Use scripts/generate-news-summaries.ts to generate summaries' })
    }

    if (action === 'add') {
      // Add a single news article (used by the generation script)
      const { slug, title, summary, source_name, source_url, original_url, published_at, cover_image, tags } = body

      if (!title || !summary || !source_name || !original_url) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const adminClient = await createAdminClient()
      const finalSlug = slug || generateSlug(title)

      const { data, error } = await adminClient
        .from('news_articles')
        .insert({
          slug: finalSlug,
          title,
          summary,
          source_name,
          source_url: source_url || '',
          original_url,
          published_at: published_at || new Date().toISOString(),
          cover_image: cover_image || null,
          tags: tags || [],
          status: 'published',
        })
        .select('slug, id')
        .single()

      if (error) {
        console.error('News INSERT error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ slug: data.slug, id: data.id })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('News POST error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
