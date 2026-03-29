import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { projectSchema } from '@/lib/schemas'
import { generateSlug } from '@/lib/utils'
import { moderateProject } from '@/lib/moderation'

// 信任的作者ID：发布文章无需审核，直接发布
const TRUSTED_AUTHOR_IDS = [
  '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0', // 灵笔猴
]

// Generate a deterministic seed from a string
function stringToSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Generate a cover image using MiniMax AI based on the project title.
 * Falls back to deterministic picsum if MiniMax fails or is unavailable.
 */
async function generateCoverImageWithMinimax(title: string): Promise<string> {
  const apiKey = process.env.MINIMAX_API_Key || process.env.MINIMAX_API_KEY
  if (!apiKey) {
    console.warn('[CoverImage] MINIMAX_API_KEY not set, using fallback')
    return `https://picsum.photos/seed/${stringToSeed(title)}/1200/630`
  }

  const prompt = `项目封面图，主题：${title}，现代简约风格，高质量，没有文字`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const response = await fetch('https://api.minimaxi.com/v1/image_generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'image-01',
        prompt,
        aspect_ratio: '16:9',
        n: 1,
        response_format: 'url',
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errText = await response.text()
      console.error('[CoverImage] MiniMax API error:', response.status, errText)
      return `https://picsum.photos/seed/${stringToSeed(title)}/1200/630`
    }

    const data = await response.json()
    const imageUrl = data?.data?.image_urls?.[0]
    if (imageUrl) {
      console.log('[CoverImage] Generated with MiniMax:', imageUrl)
      return imageUrl
    } else {
      console.warn('[CoverImage] No image_url in response, using fallback')
      return `https://picsum.photos/seed/${stringToSeed(title)}/1200/630`
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[CoverImage] MiniMax request timed out, using fallback')
    } else {
      console.error('[CoverImage] MiniMax fetch error:', err)
    }
    return `https://picsum.photos/seed/${stringToSeed(title)}/1200/630`
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '12')
    const q = searchParams.get('q')
    const tag = searchParams.get('tag')
    const category = searchParams.get('category')
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

    if (category) {
      query = query.or(`category.eq.${category},tags.cs.{${category}}`)
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

    // 🔁 去重检查：同一作者不能重复发布同名项目
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id, title, status, published_at')
      .eq('author_id', user.id)
      .eq('title', result.data.title)
      .in('status', ['published', 'pending'])
      .maybeSingle()

    if (existingProject) {
      const statusMsg = existingProject.status === 'published' ? '已发布' : '待审核'
      return NextResponse.json(
        { error: `此项目已提交过（${statusMsg}），请勿重复发布。如需更新，请编辑已有项目。` },
        { status: 409 }
      )
    }

    // AI内容审核 - 检测敏感内容
    // 信任作者的发布直接通过，不走审核
    const isTrustedAuthor = TRUSTED_AUTHOR_IDS.includes(user.id)
    let moderationResult = { isClean: true, flaggedContent: [], reason: '' }
    if (!isTrustedAuthor) {
      moderationResult = moderateProject({
        title: result.data.title,
        description: result.data.description,
        project_url: result.data.project_url || '',
        cover_image: result.data.cover_image || '',
        category: result.data.category,
      })
      console.log('[Content Moderation]', {
        isClean: moderationResult.isClean,
        flaggedCount: moderationResult.flaggedContent.length,
        reason: moderationResult.reason,
      })
    } else {
      console.log('[Content Moderation] Trusted author, skipping check')
    }

    // 自动生成封面图
    let coverImage: string
    if (result.data.cover_image) {
      coverImage = result.data.cover_image
    } else {
      generateCoverImageWithMinimax(result.data.title)
        .then((url) => {
          console.log('[CoverImage] Async cover update for slug:', slug, '->', url)
          createAdminClient().then((admin) => {
            admin.from('projects').update({ cover_image: url }).eq('slug', slug).then(({ error }) => {
              if (error) console.error('[CoverImage] Failed to update cover:', error)
            })
          })
        })
        .catch((err) => console.error('[CoverImage] Unexpected error:', err))
      coverImage = `https://picsum.photos/seed/${stringToSeed(result.data.title)}/1200/630`
    }

    const slug = generateSlug(result.data.title)
    const adminClient = await createAdminClient()

    // 正常内容直接发布；有敏感词则进待审核，原始内容不过滤
    const status = moderationResult.isClean ? 'published' : 'pending'

    // 始终保存用户提交的原始内容（不过滤）
    const insertData = {
      slug,
      title: result.data.title,
      description: result.data.description,
      cover_image: coverImage,
      project_url: result.data.project_url || '',
      tags: result.data.tags || [],
      gallery: result.data.gallery || [],
      author_id: user.id,
      status,
      flagged_content: moderationResult.isClean ? null : JSON.stringify(moderationResult.flaggedContent),
      flagged_reason: moderationResult.isClean ? null : moderationResult.reason,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }

    let data, error

    const insertWithCategory = { ...insertData, category: result.data.category || '副业' }
    const { data: d1, error: e1 } = await adminClient
      .from('projects')
      .insert(insertWithCategory)
      .select('slug, status')
      .single()

    if (e1) {
      if (e1.message.includes('category') || e1.code === '42703') {
        console.log('[Category column missing, retrying without category]')
        const { data: d2, error: e2 } = await adminClient
          .from('projects')
          .insert(insertData)
          .select('slug, status')
          .single()
        data = d2
        error = e2
      } else {
        data = d1
        error = e1
      }
    } else {
      data = d1
    }

    if (error || !data) {
      console.error('[Project Insert Error]', error)
      return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
    }

    return NextResponse.json({
      slug: data!.slug,
      status: data!.status,
      message: moderationResult.isClean
        ? '项目已发布'
        : '提交成功，等待管理员审核后展示',
    })
  } catch (err) {
    console.error('Projects POST error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
