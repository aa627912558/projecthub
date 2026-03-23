import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
