'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Trash2, AlertCircle, Eye, RefreshCw, LogOut, Edit } from 'lucide-react'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import type { Project, FlaggedItem } from '@/types'
import { formatDate } from '@/lib/utils'
import { getFlagTypeName } from '@/lib/moderation'
import { getWorkingCoverImage } from '@/lib/image-utils'

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
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

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

  const handleEditClick = (project: Project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  const handleEditSave = async (updated: { title?: string; description?: string; tags?: string[]; cover_image?: string; categories?: string[] }) => {
    if (!editingProject) return
    setActionLoading(editingProject.id)
    try {
      const res = await fetch(`/api/projects/${editingProject.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '保存失败')
        return
      }
      setShowEditModal(false)
      setEditingProject(null)
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
                    src={getWorkingCoverImage(project.cover_image, project.title)}
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
                    src={getWorkingCoverImage(project.cover_image, project.title)}
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
                src={getWorkingCoverImage(project.cover_image, project.title)}
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
                variant="secondary"
                onClick={() => handleEditClick(project)}
              >
                <Edit className="w-4 h-4" />
                编辑
              </Button>
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
                  src={getWorkingCoverImage(project.cover_image, project.title)}
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

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <ProjectEditModal
          project={editingProject}
          onClose={() => { setShowEditModal(false); setEditingProject(null) }}
          onSave={handleEditSave}
          saving={actionLoading === editingProject.id}
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

// 14个固定Tags选项
const TAG_OPTIONS = ['实体', '网创', '副业', '轻资产', '低成本', '线上', '线下', '蓝海', '热门', '冷门', '长期', '短期', '个人', '团队']

// Tags选择组件（带下拉选项的chips输入）
function TagSelectInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tags: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = TAG_OPTIONS.filter(
    tag =>
      !value.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  )

  const canAddMore = value.length < 6

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (value.includes(trimmed)) return
    if (value.length >= 6) return
    onChange([...value, trimmed])
    setInputValue('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag))
  }

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* 已选标签 + 输入框 */}
      <div
        className="flex flex-wrap gap-1.5 items-center border border-border rounded-btn px-3 py-2 min-h-[42px] cursor-text"
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-white text-xs rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="hover:text-red-200 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {canAddMore && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag(inputValue)
              }
              if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
                removeTag(value[value.length - 1])
              }
            }}
            placeholder={value.length === 0 ? '点击选择或输入标签' : ''}
            className="flex-1 min-w-[120px] text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
          />
        )}
        {!canAddMore && (
          <span className="text-xs text-gray-400">最多6个</span>
        )}
      </div>

      {/* 下拉选项列表 */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-btn shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-xs text-gray-400">推荐标签</p>
              {filteredOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    addTag(tag)
                    setOpen(false)
                    setInputValue('')
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-accent-light hover:text-accent transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          {inputValue.trim() && !TAG_OPTIONS.includes(inputValue.trim()) && (
            <div className="border-t border-border py-1">
              <p className="px-3 py-1 text-xs text-gray-400">自定义标签</p>
              <button
                type="button"
                onClick={() => {
                  addTag(inputValue)
                  setOpen(false)
                  setInputValue('')
                }}
                className="w-full text-left px-3 py-2 text-sm text-accent hover:bg-accent-light transition-colors"
              >
                + 添加「{inputValue.trim()}」
              </button>
            </div>
          )}
          {filteredOptions.length === 0 && !inputValue.trim() && (
            <p className="px-3 py-4 text-sm text-gray-400 text-center">无可用标签（已选满6个）</p>
          )}
        </div>
      )}
    </div>
  )
}

// 文章编辑弹窗
const CATEGORY_OPTIONS = ['实体项目', '网创项目', '副业', 'AI项目']

function ProjectEditModal({
  project,
  onClose,
  onSave,
  saving,
}: {
  project: Project
  onClose: () => void
  onSave: (data: { title?: string; description?: string; tags?: string[]; cover_image?: string; categories?: string[] }) => void
  saving: boolean
}) {
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description)
  const [tags, setTags] = useState<string[]>(project.tags || [])
  const [coverImage, setCoverImage] = useState(project.cover_image)
  const [categories, setCategories] = useState<string[]>(project.categories || [])

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleSave = () => {
    onSave({ title, description, tags, cover_image: coverImage, categories })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">编辑项目</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-border rounded-btn px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
              maxLength={100}
            />
          </div>

          {/* 封面图 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图 URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full border border-border rounded-btn px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="封面预览" className="mt-2 w-full max-h-40 object-cover rounded-btn" />
            )}
          </div>

          {/* 分类选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目分类（可多选）
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    categories.includes(cat)
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 标签选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              项目标签（最多选6个）
            </label>
            <TagSelectInput value={tags} onChange={setTags} />
            <p className="text-xs text-gray-400 mt-1">点击选择推荐标签，也可直接输入自定义标签后回车</p>
          </div>

          {/* 详细介绍 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细介绍</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              className="w-full border border-border rounded-btn px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent resize-vertical"
              maxLength={10000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/10000</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} loading={saving}>
            <Check className="w-4 h-4" />
            保存修改
          </Button>
        </div>
      </div>
    </div>
  )
}


