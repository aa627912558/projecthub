'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import type { Project, Profile } from '@/types'
import { formatDate } from '@/lib/utils'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<Profile | null>(null)
  const [pending, setPending] = useState<Project[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [meRes, pendingRes, allRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/pending'),
        fetch('/api/projects?all=1'),
      ])

      const meData = await meRes.json()
      if (!meRes.ok || !meData?.is_admin) {
        setError('无权限访问')
        return
      }
      setUser(meData)

      const pendingData = await pendingRes.json()
      setPending(pendingData || [])

      const allData = await allRes.json()
      setAllProjects(allData.data || [])
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '操作失败')
        return
      }
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('请输入拒绝原因：')
    if (!reason) return

    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reason }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '操作失败')
        return
      }
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return

    setActionLoading(id)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '删除失败')
        return
      }
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const published = allProjects.filter((p) => p.status === 'published')
  const rejected = allProjects.filter((p) => p.status === 'rejected')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">管理后台</h1>
      <p className="text-gray-500 mb-8">
        欢迎，{user?.username}
      </p>

      {/* Pending */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          待审核项目
          {pending.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无待审核项目</p>
        ) : (
          <div className="space-y-4">
            {pending.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-border rounded-card p-4"
              >
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.cover_image}
                    alt={project.title}
                    className="w-24 h-16 object-cover rounded-btn flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      by {project.author?.username} · {formatDate(project.created_at)}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description.substring(0, 150)}...
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-accent-light text-accent text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(project.id)}
                      loading={actionLoading === project.id}
                    >
                      <Check className="w-4 h-4" />
                      通过
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReject(project.id)}
                      loading={actionLoading === project.id}
                    >
                      <X className="w-4 h-4" />
                      拒绝
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Published */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          已发布项目 ({published.length})
        </h2>
        <div className="space-y-3">
          {published.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-border rounded-card p-4 flex items-center gap-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.cover_image}
                alt={project.title}
                className="w-16 h-12 object-cover rounded-btn flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <a
                  href={`/projects/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-900 hover:text-accent transition-colors"
                >
                  {project.title}
                </a>
                <p className="text-xs text-gray-500">
                  by {project.author?.username} · {formatDate(project.published_at || project.created_at)}
                </p>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(project.id)}
                loading={actionLoading === project.id}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            已拒绝项目 ({rejected.length})
          </h2>
          <div className="space-y-3">
            {rejected.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-border rounded-card p-4 flex items-center gap-4 opacity-60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.cover_image}
                  alt={project.title}
                  className="w-16 h-12 object-cover rounded-btn flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{project.title}</h3>
                  <p className="text-xs text-gray-500">
                    by {project.author?.username} · {formatDate(project.created_at)}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    拒绝原因: {project.rejection_reason}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(project.id)}
                  loading={actionLoading === project.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
