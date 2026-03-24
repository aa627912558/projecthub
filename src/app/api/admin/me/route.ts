import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ADMIN_SESSION_COOKIE = 'admin_session'

const getSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET || 'projecthub-admin-secret-change-in-production'
  return new TextEncoder().encode(secret)
}

export async function GET() {
  try {
    const token = await getCookie('admin_session')
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, getSecret())
    
    return NextResponse.json({
      id: payload.adminId,
      username: payload.username,
    })
  } catch {
    return NextResponse.json({ error: '无效或过期的会话' }, { status: 401 })
  }
}

// Helper to read cookie from request headers
async function getCookie(name: string): Promise<string | null> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const cookie = cookieStore.get(name)
  return cookie?.value || null
}
