'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Trash2, AlertCircle, Eye, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import type { Project, FlaggedItem } from '@/types'
import { formatDate } from '@/lib/utils'
import { getFlagTypeName } from '@/lib/moderation'

export default function AdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<{ id: string; username: string } | null>(null)
  const [pending, setPending] = useState<Project[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showFlaggedModal, setShowFlaggedModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [meRes, pendingRes, allRes] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/admin/pending'),
        fetch('/api/projects?all=1'),
      ])

      if (!meRes.ok) {
        router.replace('/admin/login')
        return
      }

      const meData = await meRes.json()
      setAdmin(meData)

      const pendingData = await pendingRes.json()
      setPending(Array.isArray(pendingData) ? pendingData : (pendingData.data || []))

      const allData = await allRes.json()
      setAllProjects(allData.data || [])
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

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

  const handleViewFlagged = (project: Project) => {
    setSelectedProject(project)
    setShowFlaggedModal(true)
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
  const pendingReview = pending.filter((p) => p.status === 'pending_review')
  const pendingInitial = pending.filter((p) => p.status === 'pending')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-500 mt-1">
            欢迎，{admin?.username}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
            ← 返回首页
          </Button>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            退出登录
          </Button>
        </div>
      </div>

      {/* AI Flagged - 需要管理员审核 */}
      {pendingReview.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            AI 标记待审核
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {pendingReview.length}
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            以下项目包含可能违规的内容，AI 已自动替换。请确认后决定通过或拒绝。
          </p>

          <div className="space-y-4">
            {pendingReview.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-amber-300 rounded-card p-4 shadow-sm"
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                        {project.flagged_reason || '包含可疑内容'}
                      </span>
                    </div>
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
                      onClick={() => handleViewFlagged(project)}
                    >
                      <Eye className="w-4 h-4" />
                      查看内容
                    </Button>
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
        </section>
      )}

      {/* Pending Initial - 初始待审核 */}
      {pendingInitial.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            待审核项目
            <span className="px-2 py-0.5 bg-gray-500 text-white text-xs rounded-full">
              {pendingInitial.length}
            </span>
          </h2>

          <div className="space-y-4">
            {pendingInitial.map((project) => (
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
        </section>
      )}

      {/* No pending */}
      {pending.length === 0 && (
        <section className="mb-12">
          <div className="bg-green-50 border border-green-200 rounded-card p-6 text-center">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">太棒了！暂无待审核项目</p>
          </div>
        </section>
      )}

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

      {/* Flagged Content Modal */}
      {showFlaggedModal && selectedProject && (
        <FlaggedContentModal
          project={selectedProject}
          onClose={() => {
            setShowFlaggedModal(false)
            setSelectedProject(null)
          }}
          onApprove={async () => {
            await handleApprove(selectedProject.id)
            setShowFlaggedModal(false)
            setSelectedProject(null)
          }}
          onReject={async () => {
            await handleReject(selectedProject.id)
            setShowFlaggedModal(false)
            setSelectedProject(null)
          }}
        />
      )}
    </div>
  )
}

// 违规内容查看弹窗
function FlaggedContentModal({
  project,
  onClose,
  onApprove,
  onReject,
}: {
  project: Project
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const flaggedContent: FlaggedItem[] = project.flagged_content 
    ? typeof project.flagged_content === 'string' 
      ? JSON.parse(project.flagged_content as unknown as string)
      : project.flagged_content
    : []

  // 按字段分组
  const groupedByField = flaggedContent.reduce((acc, item) => {
    if (!acc[item.field]) acc[item.field] = []
    acc[item.field].push(item)
    return acc
  }, {} as Record<string, FlaggedItem[]>)

  const fieldLabels: Record<string, string> = {
    title: '标题',
    description: '详细介绍',
    project_url: '项目链接',
    cover_image: '封面图',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">审核内容详情</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
            <p className="text-sm text-gray-500">
              by {project.author?.username} · {formatDate(project.created_at)}
            </p>
          </div>

          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-btn">
            <p className="text-amber-800 text-sm">
              <strong>AI 标记原因：</strong>{project.flagged_reason || '包含可疑内容'}
            </p>
            <p className="text-amber-600 text-xs mt-1">
              共发现 {flaggedContent.length} 处可疑内容
            </p>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedByField).map(([field, items]) => (
              <div key={field} className="border border-border rounded-btn p-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  {fieldLabels[field] || field}
                </h4>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                      <span className="text-red-600 font-medium">
                        [{getFlagTypeName(item.type)}]
                      </span>
                      <div className="mt-1">
                        <span className="text-gray-400 line-through mr-2">
                          {item.original}
                        </span>
                        <span className="text-green-600">→</span>
                        <span className="text-green-600 ml-2">
                          {item.replacement}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-medium text-gray-700 mb-2">审核后内容预览</h4>
            <div className="bg-gray-50 rounded-btn p-4 space-y-3">
              <div>
                <span className="text-xs text-gray-500">标题</span>
                <p className="text-gray-900">{project.title}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">详细介绍</span>
                <p className="text-gray-900 text-sm whitespace-pre-wrap">
                  {project.description.length > 300 
                    ? project.description.substring(0, 300) + '...' 
                    : project.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button variant="danger" onClick={onReject}>
            <X className="w-4 h-4" />
            拒绝
          </Button>
          <Button onClick={onApprove}>
            <Check className="w-4 h-4" />
            通过
          </Button>
        </div>
      </div>
    </div>
  )
}
