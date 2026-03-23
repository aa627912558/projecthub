import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project, Profile } from '@/types'
import type { Metadata } from 'next'
import { User, Calendar } from 'lucide-react'

async function getUserProfile(username: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  return data as Profile | null
}

async function getUserProjects(authorId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('projects')
    .select('*, author:profiles(*)')
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (data || []) as Project[]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getUserProfile(username)
  if (!profile) return { title: '用户未找到' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://projecthub.dev'

  return {
    title: `${profile.username} 的项目`,
    description: `查看 ${profile.username} 在 ProjectHub 发布的所有项目`,
    openGraph: {
      type: 'profile',
      title: `${profile.username} | ProjectHub`,
      url: `${siteUrl}/u/${username}`,
    },
    alternates: {
      canonical: `${siteUrl}/u/${username}`,
    },
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const profile = await getUserProfile(username)

  if (!profile) notFound()

  const projects = await getUserProjects(profile.id)

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-12">
      {/* Profile Header */}
      <div className="flex items-start gap-4 mb-12 pb-8 border-b border-border">
        <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
          <User className="w-8 h-8 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.username}</h1>
          <p className="text-gray-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            加入于 {new Date(profile.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
            })}
          </p>
          {profile.is_admin && (
            <span className="inline-block mt-2 px-2.5 py-0.5 bg-accent text-white text-xs rounded-full">
              管理员
            </span>
          )}
        </div>
      </div>

      {/* Projects */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          已发布项目 ({projects.length})
        </h2>

        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>还没有发布任何项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
