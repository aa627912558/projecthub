import type { Metadata } from 'next'
import { Mail, Github, Twitter } from 'lucide-react'

export const metadata: Metadata = {
  title: '关于',
  description: '了解 ProjectHub — 一个开放的项目分享平台',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">关于 ProjectHub</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">我们是谁</h2>
          <p className="text-gray-700 leading-relaxed">
            ProjectHub（项目阁）是一个开放的项目分享平台。我们相信每一个好项目都值得被看见，
            无论是开发者的小工具、设计师的作品集，还是创业者的产品原型。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">我们的使命</h2>
          <p className="text-gray-700 leading-relaxed">
            降低项目展示的门槛，让创作者能够专注于创作本身。我们构建了一个
            SEO 友好、AI 友好的平台，确保你的项目不仅能被人类发现，
            也能被 AI 搜索引擎和大模型理解和索引。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">核心特性</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>简单易用的项目发布流程</li>
            <li>支持 Markdown 的详细介绍</li>
            <li>完整的 SEO 优化（JSON-LD、sitemap、OG tags）</li>
            <li>AI 友好的结构化数据，让大模型能理解你的项目</li>
            <li>项目审核机制，确保内容质量</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">联系我们</h2>
          <p className="text-gray-700 mb-4">
            有任何问题或建议，欢迎通过以下方式联系我们：
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:hello@projecthub.dev"
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-btn text-gray-700 hover:bg-accent-light hover:text-accent transition-colors"
            >
              <Mail className="w-4 h-4" />
              hello@projecthub.dev
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-btn text-gray-700 hover:bg-accent-light hover:text-accent transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-btn text-gray-700 hover:bg-accent-light hover:text-accent transition-colors"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">使用条款</h2>
          <p className="text-gray-700 leading-relaxed">
            我们欢迎所有合法、有创意的项目在此展示。但请确保：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
            <li>项目内容真实，不含有虚假信息</li>
            <li>不侵犯他人知识产权</li>
            <li>遵守当地法律法规</li>
            <li>项目链接指向真实可用的内容</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
