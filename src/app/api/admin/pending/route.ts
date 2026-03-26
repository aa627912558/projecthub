import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
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

    const { data } = await supabase
      .from('projects')
      .select('*, author:profiles(*)')
      .in('status', ['pending', 'pending_review'])
      .order('created_at', { ascending: true })

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Admin pending error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
