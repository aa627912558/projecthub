'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/Button'
import { Input, Textarea } from '@/components/Input'
import { TagBadge } from '@/components/TagBadge'
import { projectSchema } from '@/lib/schemas'

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tagInput, setTagInput] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (!tag) return
    if (form.tags.includes(tag)) {
      setError('标签已存在')
      return
    }
    if (form.tags.length >= 5) {
      setError('最多添加5个标签')
      return
    }
    setForm({ ...form, tags: [...form.tags, tag] })
    setTagInput('')
    setError('')
  }

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })
  }

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

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            标签（最多5个）
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              placeholder="输入标签后按回车添加"
              className="flex-1 px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              maxLength={20}
            />
            <Button type="button" variant="secondary" onClick={handleAddTag}>
              <Plus className="w-4 h-4" />
              添加
            </Button>
          </div>
          {errors.tags && <p className="text-xs text-red-500 mb-2">{errors.tags}</p>}
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  onClick={() => handleRemoveTag(tag)}
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
