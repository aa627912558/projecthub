import { getProjectsByTag } from '@/lib/aggregation'
import { TagPageClient } from '@/components/TagPageClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xiangmupai.com'

  return {
    title: `标签 #${decodedTag}`,
    description: `浏览所有带有「${decodedTag}」标签的项目，发现更多精彩作品。`,
    alternates: {
      canonical: `${siteUrl}/tags/${encodeURIComponent(decodedTag)}`,
    },
    openGraph: {
      title: `标签 #${decodedTag}`,
      description: `浏览所有带有「${decodedTag}」标签的项目，发现更多精彩作品。`,
      url: `${siteUrl}/tags/${encodeURIComponent(decodedTag)}`,
    },
    twitter: {
      title: `标签 #${decodedTag}`,
      description: `浏览所有带有「${decodedTag}」标签的项目，发现更多精彩作品。`,
    },
  }
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const { projects, total } = await getProjectsByTag(decodedTag)

  return (
    <TagPageClient
      tag={decodedTag}
      projects={projects}
      total={total}
    />
  )
}
