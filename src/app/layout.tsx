// 2026-03-30 百度SEO验证
import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { headers } from 'next/headers'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const canonical = headersList.get('x-forwarded-proto') + '://' + headersList.get('host')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || canonical

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: '项目派 - 发现和分享有趣的项目',
      template: '%s | 项目派',
    },
    description: '项目派是一个开放的项目分享平台，让每一个好项目都被看见。',
    keywords: ['项目分享', '开源项目', '产品推荐', '开发者作品'],
    authors: [{ name: '项目派' }],
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: siteUrl,
      siteName: '项目派',
      title: '项目派 - 发现和分享有趣的项目',
      description: '项目派是一个开放的项目分享平台，让每一个好项目都被看见。',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ProjectHub',
      description: '发现和分享有趣的项目',
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      'baidu-site-verification': 'codeva-5NtTrGRHab',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let profile = null

  if (supabaseUrl && supabaseKey && supabaseUrl !== 'your-supabase-url') {
    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        profile = data
      }
    } catch {
      // Supabase not available, continue without auth
    }
  }

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Header user={profile} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
