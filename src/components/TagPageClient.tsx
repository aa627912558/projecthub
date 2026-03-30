'use client'

import Link from 'next/link'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project } from '@/types'

interface TagPageClientProps {
  tag: string
  projects: Project[]
  total: number
}

export function TagPageClient({ tag, projects, total }: TagPageClientProps) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-accent-light to-white py-12 sm:py-16">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <nav className="mb-4 text-sm flex items-center gap-1">
            <Link href="/" className="text-accent hover:text-accent-hover">
              首页
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-500">标签</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            标签: <span className="text-accent">#{tag}</span>
          </h1>
          <p className="text-gray-600">
            共 {total} 个项目带有此标签
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="max-w-content mx-auto px-4 sm:px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">暂无带此标签的项目</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-accent text-white rounded-btn hover:bg-accent-hover transition-colors"
            >
              返回首页
            </Link>
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
