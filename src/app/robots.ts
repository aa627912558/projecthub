import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'CCBot',
        allow: '/',
      },
      {
        userAgent: 'CommonCrawl',
        allow: '/',
      },
    ],
    // Always point sitemap to the canonical domain for SEO
    sitemap: 'https://jingxuanai.com/sitemap.xml',
  }
}
