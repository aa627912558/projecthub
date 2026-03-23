import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
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

    const { id } = await req.json()
    const adminClient = await createAdminClient()

    await adminClient
      .from('projects')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin approve error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
