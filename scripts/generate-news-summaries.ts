#!/usr/bin/env node
/**
 * AI News Summary Generator
 * 
 * Fetches AI news from RSS feeds, generates summaries using MiniMax API,
 * and stores them in Supabase as news_articles.
 * 
 * Usage: npx ts-node scripts/generate-news-summaries.ts
 *        node scripts/generate-news-summaries.ts
 */

import { createClient } from '@supabase/supabase-js'

// ============ CONFIG ============
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
const MINIMAX_API_KEY = process.env.MINIMAX_API_Key || process.env.MINIMAX_API_KEY || ''

// RSS feeds to fetch
const RSS_FEEDS = [
  {
    name: '机器之心',
    url: 'https:// RSS Feed',
    tags: ['AI', '机器学习'],
    source_url: 'https://ai.google/',
  },
  {
    name: '量子位',
    url: 'https:// RSS Feed',
    tags: ['AI', '科技'],
    source_url: 'https://liangzibit.com/',
  },
  {
    name: 'AI研习社',
    url: 'https:// RSS Feed',
    tags: ['AI', '深度学习'],
    source_url: 'https://ai.google.dev/',
  },
  {
    name: 'OpenAI Blog',
    url: 'https:// RSS Feed',
    tags: ['AI', 'OpenAI'],
    source_url: 'https://openai.com/',
  },
  {
    name: 'Product Hunt',
    url: 'https:// RSS Feed',
    tags: ['AI工具', '产品'],
    source_url: 'https://producthunt.com/',
  },
]

// ============ TYPES ============
interface RssItem {
  title: string
  link: string
  pubDate: string
  description: string
  creator?: string
  content?: string
}

interface RssFeed {
  name: string
  url: string
  tags: string[]
  source_url: string
  items: RssItem[]
}

interface NewsArticle {
  slug: string
  title: string
  summary: string
  source_name: string
  source_url: string
  original_url: string
  published_at: string
  cover_image?: string
  tags: string[]
}

// ============ UTILS ============
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}

function generateSlug(title: string): string {
  const base = slugify(title)
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTextContent(item: RssItem): string {
  const raw = item.content || item.description || ''
  return stripHtml(raw).substring(0, 2000)
}

// ============ RSS FETCHER ============
async function fetchRss(feed: { name: string; url: string; tags: string[]; source_url: string }): Promise<RssFeed> {
  console.log(`📡 Fetching RSS: ${feed.name} (${feed.url})`)
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProjectHub/1.0; AI News Fetcher)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const xml = await response.text()
    
    // Simple RSS parser (no external dependencies)
    const items: RssItem[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let match
    
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1]
      
      const getTag = (tag: string): string => {
        const regex = new RegExp(`<${tag}[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/${tag}>|<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i')
        const m = itemXml.match(regex)
        return m ? (m[1] || m[2] || '').trim() : ''
      }
      
      const title = getTag('title')
      const link = getTag('link')
      
      if (title && link) {
        items.push({
          title,
          link,
          pubDate: getTag('pubDate') || getTag('dc:date') || new Date().toISOString(),
          description: getTag('description'),
          creator: getTag('dc:creator') || getTag('author'),
          content: getTag('content:encoded'),
        })
      }
    }
    
    // Fallback: try atom format
    if (items.length === 0) {
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi
      while ((match = entryRegex.exec(xml)) !== null) {
        const entryXml = match[1]
        const getTag = (tag: string): string => {
          const regex = new RegExp(`<${tag}[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/${tag}>|<${tag}[^>]*>([\s\S]*?)<\/${tag}>|<${tag}[^>]*href="([^"]*)"`, 'i')
          const m = entryXml.match(regex)
          return m ? (m[1] || m[2] || m[3] || '').trim() : ''
        }
        
        const title = getTag('title')
        const link = getTag('link')
        
        if (title) {
          items.push({
            title,
            link,
            pubDate: getTag('published') || getTag('updated') || new Date().toISOString(),
            description: getTag('summary') || getTag('content'),
            creator: getTag('author'),
          })
        }
      }
    }
    
    console.log(`  ✅ Found ${items.length} items from ${feed.name}`)
    return { ...feed, items }
  } catch (err) {
    console.error(`  ❌ Failed to fetch ${feed.name}:`, err instanceof Error ? err.message : err)
    return { ...feed, items: [] }
  }
}

// ============ MINIMAX SUMMARIZER ============
async function generateSummary(title: string, content: string, sourceName: string): Promise<string> {
  if (!MINIMAX_API_KEY) {
    console.warn('  ⚠️ MINIMAX_API_KEY not set, using fallback summary')
    return generateFallbackSummary(content)
  }

  const prompt = `你是一个专业的中文科技资讯编辑。请为以下新闻生成一段100-200字的摘要。

要求：
1. 用中文撰写
2. 客观、准确地概括新闻要点
3. 100-200字
4. 不要添加标题，直接输出摘要正文
5. 只摘录要点，不要全文复制

---
新闻标题：${title}
新闻来源：${sourceName}
正文内容：
${content.substring(0, 1500)}
---`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的中文科技资讯编辑，擅长撰写新闻摘要。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errText = await response.text()
      console.error(`  ❌ MiniMax API error: ${response.status} - ${errText}`)
      return generateFallbackSummary(content)
    }

    const data = await response.json()
    const summary = data?.choices?.[0]?.message?.content?.trim()

    if (summary) {
      return summary.substring(0, 300)
    }

    return generateFallbackSummary(content)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('  ⏰ MiniMax request timed out')
    } else {
      console.error('  ❌ MiniMax error:', err)
    }
    return generateFallbackSummary(content)
  }
}

function generateFallbackSummary(content: string): string {
  const text = content.replace(/\s+/g, ' ').trim()
  if (text.length <= 200) return text
  return text.substring(0, 200) + '...'
}

// ============ SUPABASE ============
function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

async function checkExisting(slug: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('news_articles')
      .select('id')
      .eq('slug', slug)
      .single()
    return !!data
  } catch {
    return false
  }
}

async function saveArticle(article: NewsArticle): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('news_articles')
    .insert({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      source_name: article.source_name,
      source_url: article.source_url,
      original_url: article.original_url,
      published_at: article.published_at,
      cover_image: article.cover_image || null,
      tags: article.tags,
      status: 'published',
    })

  if (error) {
    if (error.code === '23505') {
      console.log(`  ⏭️  Already exists: ${article.slug}`)
    } else {
      console.error(`  ❌ DB error:`, error.message)
    }
  } else {
    console.log(`  ✅ Saved: ${article.title.substring(0, 50)}...`)
  }
}

// ============ MAIN ============
async function main() {
  console.log('🚀 AI News Summary Generator')
  console.log('='.repeat(50))

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
    process.exit(1)
  }

  // 1. Fetch all RSS feeds
  console.log('\n📡 Step 1: Fetching RSS feeds...\n')
  const feeds = await Promise.all(RSS_FEEDS.map(feed => fetchRss(feed)))

  // 2. Collect all items
  const allItems: Array<{
    title: string
    link: string
    pubDate: string
    content: string
    source_name: string
    source_url: string
    tags: string[]
  }> = []

  for (const feed of feeds) {
    for (const item of feed.items.slice(0, 10)) { // max 10 per feed
      const textContent = extractTextContent(item)
      if (textContent.length > 50) {
        allItems.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: textContent,
          source_name: feed.name,
          source_url: feed.source_url,
          tags: feed.tags,
        })
      }
    }
  }

  console.log(`\n📰 Total articles to process: ${allItems.length}`)

  // 3. Process each article
  console.log('\n✍️  Step 2: Generating summaries with MiniMax...\n')
  
  let saved = 0
  let skipped = 0
  let errors = 0

  for (const item of allItems) {
    const slug = generateSlug(item.title)
    
    try {
      // Check if already exists
      const exists = await checkExisting(slug)
      if (exists) {
        skipped++
        console.log(`  ⏭️  Skipped (exists): ${item.title.substring(0, 40)}...`)
        continue
      }

      // Generate summary
      const summary = await generateSummary(item.title, item.content, item.source_name)
      
      // Parse publish date
      let publishedAt = new Date().toISOString()
      try {
        const parsed = new Date(item.pubDate)
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed.toISOString()
        }
      } catch {}

      // Save
      await saveArticle({
        slug,
        title: item.title,
        summary,
        source_name: item.source_name,
        source_url: item.source_url,
        original_url: item.link,
        published_at: publishedAt,
        tags: item.tags,
      })

      saved++
      
      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      errors++
      console.error(`  ❌ Error processing: ${item.title.substring(0, 40)}:`, err)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Done! Saved: ${saved}, Skipped: ${skipped}, Errors: ${errors}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
