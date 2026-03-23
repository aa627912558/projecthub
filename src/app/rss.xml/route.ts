import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://projecthub.dev'

  try {
    const supabase = await createAdminClient()
    const { data: projects } = await supabase
      .from('projects')
      .select('title, description, slug, published_at, author:profiles(username)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50)

    const items = (projects || [])
      .map((p) => {
        const pubDate = new Date(p.published_at || '').toUTCString()
        const desc = p.description.replace(/[#*`>\[\]]/g, '').substring(0, 200)
        return `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${siteUrl}/projects/${p.slug}</link>
      <guid isPermaLink="true">${siteUrl}/projects/${p.slug}</guid>
      <description><![CDATA[${desc}...]]></description>
      <author>${(p.author as any)?.username || 'anonymous'}</author>
      <pubDate>${pubDate}</pubDate>
    </item>`
      })
      .join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ProjectHub</title>
    <link>${siteUrl}</link>
    <description>发现和分享有趣的项目</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  } catch (err) {
    console.error('RSS error:', err)
    return new NextResponse('<?xml version="1.0"?><rss version="2.0"><channel><title>Error</title></channel></rss>', {
      headers: { 'Content-Type': 'application/xml' },
    })
  }
}
