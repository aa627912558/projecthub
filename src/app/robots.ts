import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const CANONICAL_DOMAIN = 'https://www.xiangmupai.com'

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
    sitemap: `${CANONICAL_DOMAIN}/sitemap.xml`,
  }
}
