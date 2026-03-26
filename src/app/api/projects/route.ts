import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { projectSchema } from '@/lib/schemas'
import { generateSlug } from '@/lib/utils'
import { moderateProject, type FlaggedItem } from '@/lib/moderation'

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

  // Build prompt: use the title as-is for MiniMax to generate a relevant cover
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
      // Also match by tag as fallback — some articles store category as a tag
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

    // AI内容审核 (暂时禁用，让所有内容直接发布)
    const moderationResult = moderateProject({
      title: result.data.title,
      description: result.data.description,
      project_url: result.data.project_url || '',
      cover_image: result.data.cover_image || '',
      category: result.data.category,
    })

    // 暂时禁用审核，所有内容直接发布
    const moderationResultOverride = { ...moderationResult, isClean: true }

    console.log('[Content Moderation]', {
      isClean: moderationResultOverride.isClean,
      flaggedCount: moderationResultOverride.flaggedContent.length,
      reason: moderationResultOverride.reason,
    })

    // 自动生成封面图（基于标题）- 使用 MiniMax AI 生成
    // 如果用户提供了封面图则使用用户提供的，否则调用 MiniMax 生成
    let coverImage: string
    if (result.data.cover_image) {
      coverImage = result.data.cover_image
    } else {
      // 调用 MiniMax 生成封面图（异步，不阻塞发布流程）
      // 注意：封面图生成失败时会 fallback 到 picsum，不影响项目发布
      generateCoverImageWithMinimax(result.data.title)
        .then((url) => {
          // 异步更新已发布项目的封面图
          console.log('[CoverImage] Async cover update for slug:', slug, '->', url)
          createAdminClient().then((admin) => {
            admin.from('projects').update({ cover_image: url }).eq('slug', slug).then(({ error }) => {
              if (error) console.error('[CoverImage] Failed to update cover:', error)
            })
          })
        })
        .catch((err) => console.error('[CoverImage] Unexpected error:', err))
      // 立即返回一个占位图让项目发布不受影响
      coverImage = `https://picsum.photos/seed/${stringToSeed(result.data.title)}/1200/630`
    }

    const slug = generateSlug(result.data.title)
    const adminClient = await createAdminClient()

    // 确定状态：如果有违规内容，标记为待审核；否则直接发布
    const status = moderationResultOverride.isClean ? 'published' : 'pending_review'
    
    // 如果有违规内容，保存原始内容用于后台显示
    const flaggedContent = moderationResultOverride.isClean 
      ? null 
      : JSON.stringify(moderationResultOverride.flaggedContent)

    // Build insert object
    const insertData = {
      slug,
      title: moderationResultOverride.sanitizedContent.title,
      description: moderationResultOverride.sanitizedContent.description,
      cover_image: coverImage,
      project_url: result.data.project_url || '',
      tags: result.data.tags || [],
      gallery: result.data.gallery || [],
      author_id: user.id,
      status,
      flagged_content: flaggedContent,
      flagged_reason: moderationResultOverride.isClean ? null : moderationResultOverride.reason,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }

    let data, error

    // Try with category first
    const insertWithCategory = { ...insertData, category: result.data.category || '副业' }
    const { data: d1, error: e1 } = await adminClient
      .from('projects')
      .insert(insertWithCategory)
      .select('slug, status')
      .single()

    if (e1) {
      // If error is about missing column, retry without category
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

    // 如果有违规内容，发送管理员通知
    if (!moderationResultOverride.isClean) {
      try {
        // 获取管理员邮箱列表
        const { data: admins } = await adminClient
          .from('profiles')
          .select('email, username')
          .eq('is_admin', true)

        if (admins && admins.length > 0) {
          // 发送邮件通知（如果有邮件服务配置）
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xiangmupai.com'
          for (const admin of admins) {
            console.log(`[Admin Notification] 通知管理员 ${admin.username}: 项目 "${result.data.title}" 需要审核`)
          }
          
          // TODO: 实际发送邮件通知
          // 可以使用 Resend、SendGrid 等服务
          // await sendEmail({
          //   to: admin.email,
          //   subject: `【项目派】新项目待审核: ${result.data.title}`,
          //   html: `...`
          // })
        }
      } catch (notifyError) {
        console.error('[Admin Notification Error]', notifyError)
        // 不影响主流程
      }
    }

    return NextResponse.json({
      slug: data!.slug,
      status: data!.status,
      message: moderationResultOverride.isClean 
        ? '项目已发布' 
        : '项目已提交，需要管理员审核',
      flaggedCount: moderationResultOverride.flaggedContent.length,
    })
  } catch (err) {
    console.error('Projects POST error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
