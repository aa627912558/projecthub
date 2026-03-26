'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, User, LogOut } from 'lucide-react'
import type { Profile } from '@/types'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'


interface HeaderProps {
  user?: Profile | null
}

export function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-content mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-bold text-xl text-gray-900">
              <span className="text-accent">ProjectHub</span>
              <span className="text-accent font-bold ml-1">项目派</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-accent transition-colors">
              首页
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-accent transition-colors">
              关于
            </Link>
            {user && (
              <Link href="/submit" className="text-gray-600 hover:text-accent transition-colors">
                发布项目
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={`/u/${user.username}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                  <span className="font-medium">{user.username}</span>
                </Link>
                {user.is_admin && (
                  <Link
                    href="/admin"
                    className="text-sm text-gray-500 hover:text-accent transition-colors"
                  >
                    管理后台
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {loggingOut ? '退出中...' : '退出登录'}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-accent transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-accent text-white rounded-btn hover:bg-accent-hover transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block text-gray-700 hover:text-accent"
              onClick={() => setMobileOpen(false)}
            >
              首页
            </Link>
            <Link
              href="/about"
              className="block text-gray-700 hover:text-accent"
              onClick={() => setMobileOpen(false)}
            >
              关于
            </Link>
            {user && (
              <Link
                href="/submit"
                className="block text-gray-700 hover:text-accent"
                onClick={() => setMobileOpen(false)}
              >
                发布项目
              </Link>
            )}
            {user?.is_admin && (
              <Link
                href="/admin"
                className="block text-gray-700 hover:text-accent"
                onClick={() => setMobileOpen(false)}
              >
                管理后台
              </Link>
            )}
            <button
              onClick={() => { handleLogout(); setMobileOpen(false) }}
              disabled={loggingOut}
              className="flex items-center gap-2 text-red-500 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? '退出中...' : '退出登录'}
            </button>
            <div className="pt-3 border-t border-border">
              {user ? (
                <Link
                  href={`/u/${user.username}`}
                  className="flex items-center gap-2 text-gray-700"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {user.username}
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block text-gray-700 hover:text-accent"
                    onClick={() => setMobileOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-2 bg-accent text-white rounded-btn text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
