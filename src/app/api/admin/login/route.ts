import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_EXPIRY_DAYS = 7

// Use a secret for JWT signing - in production this should be an env var
const getSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET || 'projecthub-admin-secret-change-in-production'
  return new TextEncoder().encode(secret)
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single()

    if (!admin) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // Create a signed JWT session token
    const token = await new SignJWT({ adminId: admin.id, username: admin.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
      .sign(getSecret())

    const response = NextResponse.json({ ok: true, username: admin.username })
    
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Admin login error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
