import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-secondary">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-gray-900 mb-4">
              <span className="text-accent">⬡</span>
              <span>ProjectHub</span>
            </div>
            <p className="text-gray-500 text-sm">
              发现和分享有趣的项目。让每一个好项目都被看见。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">导航</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-500 hover:text-accent transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-500 hover:text-accent transition-colors">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-gray-500 hover:text-accent transition-colors">
                  发布项目
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">关注我们</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-accent transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="/rss.xml"
                  className="text-gray-500 hover:text-accent transition-colors"
                >
                  RSS 订阅
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ProjectHub. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  )
}
