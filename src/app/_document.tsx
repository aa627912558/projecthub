// _document.tsx - 百度验证 meta 标签
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        <meta name="baidu-site-verification" content="codeva-xBTSUoD9uu" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
