import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { projectSchema } from '@/lib/schemas'
import { generateSlug } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '12')
    const q = searchParams.get('q')
    const tag = searchParams.get('tag')
    const showAll = searchParams.get('all') === '1'

    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('projects')
      .select('*, author:profiles(*)', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (!showAll) {
      query = query.range((page - 1) * pageSize, page * pageSize - 1)
    }

    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      pageSize,
    })
  } catch (err) {
    console.error('Projects GET error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await req.json()
    const result = projectSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const slug = generateSlug(result.data.title)
    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
      .from('projects')
      .insert({
        slug,
        title: result.data.title,
        description: result.data.description,
        cover_image: result.data.cover_image,
        project_url: result.data.project_url,
        tags: result.data.tags || [],
        gallery: result.data.gallery || [],
        author_id: user.id,
        status: 'pending',
      })
      .select('slug')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ slug: data.slug })
  } catch (err) {
    console.error('Projects POST error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
