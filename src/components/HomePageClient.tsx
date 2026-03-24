'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Filter } from 'lucide-react'
import { ProjectCard } from '@/components/ProjectCard'
import { TagBadge } from '@/components/TagBadge'
import type { Project } from '@/types'

interface HomePageClientProps {
  initialProjects: Project[]
  initialTags: string[]
  initialSearchParams: { q?: string; tag?: string; page?: string; category?: string }
  total: number
  page: number
  pageSize: number
}

export function HomePageClient({
  initialProjects,
  initialTags,
  initialSearchParams,
  total,
  page,
  pageSize,
}: HomePageClientProps) {
  const router = useRouter()
  const totalPages = Math.ceil(total / pageSize)

  const handleTagClick = (tag: string | null) => {
    const params = new URLSearchParams()
    if (initialSearchParams.q) params.set('q', initialSearchParams.q)
    if (initialSearchParams.category) params.set('category', initialSearchParams.category)
    if (tag) params.set('tag', tag)
    router.push(`/?${params.toString()}`)
  }

  const handleCategoryClick = (category: string | null) => {
    const params = new URLSearchParams()
    if (initialSearchParams.q) params.set('q', initialSearchParams.q)
    if (initialSearchParams.tag) params.set('tag', initialSearchParams.tag)
    if (category) params.set('category', category)
    router.push(`/?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q') as string
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (initialSearchParams.tag) params.set('tag', initialSearchParams.tag)
    if (initialSearchParams.category) params.set('category', initialSearchParams.category)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-accent-light to-white py-16 sm:py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            发现和分享<span className="text-accent">有趣的项目</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            这里是开发者、创作者和梦想家的聚集地。分享你的作品，让更多人看见。
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={initialSearchParams.q}
                placeholder="搜索项目..."
                className="w-full pl-12 pr-4 py-3 border border-border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Category filter */}
      <section className="border-b border-border sticky top-16 bg-white/80 backdrop-blur-md z-40">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide py-1.5">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                !initialSearchParams.category
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部项目
            </button>
            {[
              { value: '实体项目', label: '实体类' },
              { value: '网创项目', label: '网创类' },
              { value: '副业', label: '副业类' },
              { value: 'AI项目', label: 'AI类' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleCategoryClick(initialSearchParams.category === value ? null : value)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  initialSearchParams.category === value
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tags filter row */}
          {initialTags.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1.5">
              <Filter className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <button
                onClick={() => handleTagClick(null)}
                className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  !initialSearchParams.tag
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {initialTags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  active={initialSearchParams.tag === tag}
                  onClick={() =>
                    handleTagClick(initialSearchParams.tag === tag ? null : tag)
                  }
                  className="flex-shrink-0 cursor-pointer"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Projects Grid */}
      <section className="max-w-content mx-auto px-4 sm:px-6 py-8">
        {initialSearchParams.q && (
          <div className="mb-6">
            <p className="text-gray-600">
              搜索结果: <span className="font-semibold">&ldquo;{initialSearchParams.q}&rdquo;</span>
              {initialSearchParams.tag && (
                <>，标签: <span className="font-semibold">{initialSearchParams.tag}</span></>
              )}
              {initialSearchParams.category && (
                <>，分类: <span className="font-semibold">{initialSearchParams.category}</span></>
              )}
              ，共 {total} 个项目
            </p>
          </div>
        )}

        {initialProjects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">还没有项目</p>
            <Link
              href="/submit"
              className="inline-flex items-center px-4 py-2 bg-accent text-white rounded-btn hover:bg-accent-hover transition-colors"
            >
              成为第一个发布者
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {page > 1 && (
                  <button
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (initialSearchParams.q) params.set('q', initialSearchParams.q)
                      if (initialSearchParams.tag) params.set('tag', initialSearchParams.tag)
                      if (initialSearchParams.category) params.set('category', initialSearchParams.category)
                      params.set('page', String(page - 1))
                      router.push(`/?${params.toString()}`)
                    }}
                    className="px-4 py-2 border border-border rounded-btn text-sm hover:bg-surface-secondary transition-colors"
                  >
                    上一页
                  </button>
                )}
                <span className="px-4 py-2 text-sm text-gray-500">
                  第 {page} / {totalPages} 页
                </span>
                {page < totalPages && (
                  <button
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (initialSearchParams.q) params.set('q', initialSearchParams.q)
                      if (initialSearchParams.tag) params.set('tag', initialSearchParams.tag)
                      if (initialSearchParams.category) params.set('category', initialSearchParams.category)
                      params.set('page', String(page + 1))
                      router.push(`/?${params.toString()}`)
                    }}
                    className="px-4 py-2 border border-border rounded-btn text-sm hover:bg-surface-secondary transition-colors"
                  >
                    下一页
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
