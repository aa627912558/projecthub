import { getProjectsByCategory } from '@/lib/aggregation'
import { CategoryPageClient } from '@/components/CategoryPageClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  const decodedName = decodeURIComponent(name)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xiangmupai.com'

  return {
    title: `${decodedName}项目`,
    description: `浏览所有${decodedName}类项目，发现更多精彩作品。`,
    alternates: {
      canonical: `${siteUrl}/category/${encodeURIComponent(decodedName)}`,
    },
    openGraph: {
      title: `${decodedName}项目`,
      description: `浏览所有${decodedName}类项目，发现更多精彩作品。`,
      url: `${siteUrl}/category/${encodeURIComponent(decodedName)}`,
    },
    twitter: {
      title: `${decodedName}项目`,
      description: `浏览所有${decodedName}类项目，发现更多精彩作品。`,
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)
  const { projects, total } = await getProjectsByCategory(decodedName)

  return (
    <CategoryPageClient
      category={decodedName}
      projects={projects}
      total={total}
    />
  )
}
