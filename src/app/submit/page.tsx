'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { Input, Textarea } from '@/components/Input'
import { TagBadge } from '@/components/TagBadge'
import { projectSchema } from '@/lib/schemas'

const AVAILABLE_TAGS = [
  '实体', '网创', '副业', '轻资产', '低成本',
  '线上', '线下', '蓝海', '热门', '冷门',
  '长期', '短期', '个人', '团队',
]

const CATEGORIES = ['实体项目', '网创项目', '副业', 'AI项目']

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})

    const result = projectSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '提交失败')
        return
      }

      router.push(`/projects/${data.slug}`)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">发布项目</h1>
      <p className="text-gray-500 mb-8">分享你的项目，让更多人看见</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-card text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="项目标题 *"
          placeholder="简洁明了的项目名称"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
          maxLength={100}
        />

        <Textarea
          label="详细介绍 *"
          placeholder="用 Markdown 格式介绍项目，支持代码块、列表等..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          error={errors.description}
          rows={12}
        />

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            项目分类 *
          </label>
          {errors.category && <p className="text-xs text-red-500 mb-2">{errors.category}</p>}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: form.category === cat ? '' : cat })}
                className={`px-4 py-2 rounded-btn text-sm border transition-colors ${
                  form.category === cat
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white text-gray-600 border-border hover:border-accent hover:text-accent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            项目标签（最多6个）
          </label>
          {errors.tags && <p className="text-xs text-red-500 mb-2">{errors.tags}</p>}
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => {
              const selected = form.tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })
                    } else if (form.tags.length < 6) {
                      setForm({ ...form, tags: [...form.tags, tag] })
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selected
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white text-gray-600 border-border hover:border-accent hover:text-accent'
                  } ${!selected && form.tags.length >= 6 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.tags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}
                  className="cursor-pointer"
                />
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" loading={loading} className="w-full">
            提交审核
          </Button>
          <p className="text-xs text-gray-400 text-center mt-3">
            提交后项目需要管理员审核才能显示
          </p>
        </div>
      </form>
    </div>
  )
}
