import Image from 'next/image'
import Link from 'next/link'
import { TagBadge } from './TagBadge'
import { formatDate } from '@/lib/utils'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block bg-white rounded-card border border-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
    >
      {/* Cover Image */}
      <div className="relative aspect-video overflow-hidden bg-surface-secondary">
        <Image
          src={project.cover_image}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-accent transition-colors mb-2">
          {project.title}
        </h3>

        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {project.description.replace(/[#*`>\[\]]/g, '').substring(0, 100)}...
        </p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {project.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{project.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{project.author?.username || '匿名'}</span>
          <span>{project.published_at ? formatDate(project.published_at) : formatDate(project.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
