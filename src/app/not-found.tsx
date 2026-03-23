import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">页面未找到</h2>
      <p className="text-gray-500 mb-8">抱歉，你访问的页面不存在</p>
      <Link
        href="/"
        className="px-6 py-3 bg-accent text-white rounded-btn hover:bg-accent-hover transition-colors"
      >
        返回首页
      </Link>
    </div>
  )
}
