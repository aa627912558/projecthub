import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { jwtVerify } from 'jose'

const ADMIN_SESSION_COOKIE = 'admin_session'

const getSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET || 'projecthub-admin-secret-change-in-production'
  return new TextEncoder().encode(secret)
}

// Helper to read admin session cookie
async function getAdminCookie(name: string): Promise<string | null> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const cookie = cookieStore.get(name)
  return cookie?.value || null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('projects')
      .select('*, author:profiles(*)')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Project GET error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // slug can be actual slug or id
    const { slug } = await params

    // Check admin session JWT cookie first
    const adminToken = await getAdminCookie(ADMIN_SESSION_COOKIE)
    const isAdminByJWT = adminToken
      ? await verifyAdminJWT(adminToken)
      : false

    // If not authenticated via admin JWT, fall back to Supabase auth
    if (!isAdminByJWT) {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 })
      }

      // Check admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.json({ error: '无权限' }, { status: 403 })
      }
    }

    const adminClient = await createAdminClient()
    
    // Try to delete by id first (uuid), then by slug
    await adminClient
      .from('projects')
      .delete()
      .eq('id', slug)
      .select()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Project DELETE error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

async function verifyAdminJWT(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return !!payload.adminId
  } catch {
    return false
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Check admin session JWT cookie first
    const adminToken = await getAdminCookie(ADMIN_SESSION_COOKIE)
    const isAdminByJWT = adminToken
      ? await verifyAdminJWT(adminToken)
      : false

    if (!isAdminByJWT) {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 })
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      if (!profile?.is_admin) {
        return NextResponse.json({ error: '无权限' }, { status: 403 })
      }
    }

    const body = await req.json()
    const adminClient = await createAdminClient()

    // Build update object - allow title, description, tags, cover_image, category, categories, status, published_at
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.cover_image !== undefined) updateData.cover_image = body.cover_image
    if (body.category !== undefined) updateData.category = body.category
    if (body.categories !== undefined) updateData.categories = body.categories
    // 发布时更新状态和发布时间
    if (body.publish === true) {
      updateData.status = 'published'
      updateData.published_at = new Date().toISOString()
      updateData.flagged_content = null
      updateData.flagged_reason = null
    }

    const { data, error } = await adminClient
      .from('projects')
      .update(updateData)
      .eq('slug', slug)
      .select('slug, title, description, tags, cover_image, category, categories')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, slug: data.slug })
  } catch (err) {
    console.error('Project PATCH error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
