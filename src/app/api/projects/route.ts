import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { projectSchema } from '@/lib/schemas'
import { generateSlug } from '@/lib/utils'
import { moderateProject, type FlaggedItem } from '@/lib/moderation'

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
      query = query.eq('category', category)
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

    // AI内容审核
    const moderationResult = moderateProject({
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

    // 自动生成封面图（基于标题）
    const encodedTitle = encodeURIComponent(result.data.title)
    const coverImage = result.data.cover_image || `https://image.pollinations.ai/prompt/${encodedTitle}?width=1200&height=630&seed=${Date.now()}&nologo=true`

    const slug = generateSlug(result.data.title)
    const adminClient = await createAdminClient()

    // 确定状态：如果有违规内容，标记为待审核；否则直接发布
    const status = moderationResult.isClean ? 'published' : 'pending_review'
    
    // 如果有违规内容，保存原始内容用于后台显示
    const flaggedContent = moderationResult.isClean 
      ? null 
      : JSON.stringify(moderationResult.flaggedContent)

    // Build insert object
    const insertData = {
      slug,
      title: moderationResult.sanitizedContent.title,
      description: moderationResult.sanitizedContent.description,
      cover_image: coverImage,
      project_url: result.data.project_url || '',
      tags: result.data.tags || [],
      gallery: result.data.gallery || [],
      author_id: user.id,
      status,
      flagged_content: flaggedContent,
      flagged_reason: moderationResult.isClean ? null : moderationResult.reason,
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

    if (error) {
      console.error('[Project Insert Error]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 如果有违规内容，发送管理员通知
    if (!moderationResult.isClean) {
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
      slug: data.slug,
      status: data.status,
      message: moderationResult.isClean 
        ? '项目已发布' 
        : '项目已提交，需要管理员审核',
      flaggedCount: moderationResult.flaggedContent.length,
    })
  } catch (err) {
    console.error('Projects POST error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
