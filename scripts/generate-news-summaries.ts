#!/usr/bin/env node
/**
 * AI News Summary Generator
 * 
 * Fetches AI news from RSS feeds, generates summaries using MiniMax API,
 * and stores them in Supabase as news_articles.
 */

import { createClient } from '@supabase/supabase-js'

// ============ CONFIG ============
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
const MINIMAX_API_KEY = process.env.MINIMAX_API_Key || process.env.MINIMAX_API_KEY || ''

// RSS feeds to fetch
const RSS_FEEDS = [
  {
    name: 'AI News',
    url: 'https://www.artificialintelligence-news.com/feed/',
    tags: ['AI', '人工智能', '行业动态'],
    source_url: 'https://www.artificialintelligence-news.com/',
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    tags: ['AI', '科技', '创业'],
    source_url: 'https://techcrunch.com/',
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    tags: ['AI', '科技', '数字文化'],
    source_url: 'https://www.wired.com/',
  },
  {
    name: 'MIT Tech Review',
    url: 'https://www.technologyreview.com/feed',
    tags: ['AI', '前沿科技', '深度分析'],
    source_url: 'https://www.technologyreview.com/',
  },
  {
    name: 'Science News',
    url: 'https://www.sciencenews.org/feed',
    tags: ['AI', '科学', '研究'],
    source_url: 'https://www.sciencenews.org/',
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

// Simple XML tag extractor
function extractTag(xml: string, tag: string): string {
  // Try CDATA: <tag><![CDATA[content]]></tag>
  const cdataPattern = '<' + tag + '[^>]*><![CDATA['
  const cdataStart = xml.indexOf('<![CDATA[')
  if (cdataStart !== -1) {
    const beforeCdata = xml.substring(0, cdataStart)
    const tagStart = beforeCdata.lastIndexOf('<' + tag)
    if (tagStart !== -1) {
      const cdataEnd = xml.indexOf(']]>', cdataStart)
      if (cdataEnd !== -1) {
        const content = xml.substring(cdataStart + 9, cdataEnd) // 9 = len('<![CDATA[')
        return content.trim()
      }
    }
  }
  
  // Try simple: <tag>content</tag>
  const simpleStart = xml.indexOf('<' + tag + '>')
  if (simpleStart !== -1) {
    const contentStart = simpleStart + tag.length + 2
    const endPattern = '</' + tag + '>'
    const endPos = xml.indexOf(endPattern, contentStart)
    if (endPos !== -1) {
      return xml.substring(contentStart, endPos).trim()
    }
  }
  
  // Try self-closing or attribute style: <tag attr="val">content</tag>
  const attrPattern = '<' + tag + ' '
  const attrStart = xml.indexOf(attrPattern)
  if (attrStart !== -1) {
    const contentStart = xml.indexOf('>', attrStart) + 1
    const endPattern = '</' + tag + '>'
    const endPos = xml.indexOf(endPattern, contentStart)
    if (endPos !== -1) {
      return xml.substring(contentStart, endPos).trim()
    }
  }
  
  return ''
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
    const items: RssItem[] = []
    
    // Extract items using simple string parsing
    let itemStart = 0
    while (true) {
      const itemTagStart = xml.indexOf('<item>', itemStart)
      if (itemTagStart === -1) break
      const itemTagEnd = xml.indexOf('</item>', itemTagStart)
      if (itemTagEnd === -1) break
      
      const itemXml = xml.substring(itemTagStart + 6, itemTagEnd)
      
      const title = extractTag(itemXml, 'title')
      const link = extractTag(itemXml, 'link')
      
      if (title && link) {
        items.push({
          title,
          link,
          pubDate: extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date') || new Date().toISOString(),
          description: extractTag(itemXml, 'description'),
          creator: extractTag(itemXml, 'dc:creator') || extractTag(itemXml, 'author'),
          content: extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'content'),
        })
      }
      
      itemStart = itemTagEnd + 7
    }
    
    // Fallback: atom format
    if (items.length === 0) {
      let entryStart = 0
      while (true) {
        const entryTagStart = xml.indexOf('<entry>', entryStart)
        if (entryTagStart === -1) break
        const entryTagEnd = xml.indexOf('</entry>', entryTagStart)
        if (entryTagEnd === -1) break
        
        const entryXml = xml.substring(entryTagStart + 7, entryTagEnd)
        
        const title = extractTag(entryXml, 'title')
        const link = extractTag(entryXml, 'link')
        
        if (title) {
          items.push({
            title,
            link: link || '',
            pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated') || new Date().toISOString(),
            description: extractTag(entryXml, 'summary') || extractTag(entryXml, 'content'),
          })
        }
        
        entryStart = entryTagEnd + 8
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
            role: 'user',
            sender_name: 'user',
            sender_type: 'USER',
            content: prompt
          }
        ],
        bot_setting: [{
          bot_name: 'assistant',
          content: '你是一个专业的中文科技资讯编辑，擅长撰写新闻摘要。'
        }],
        reply_constraints: {
          role: 'assistant',
          sender_type: 'BOT',
          sender_name: 'assistant'
        },
        temperature: 0.3,
        tokens_to_generate: 500,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errText = await response.text()
      console.error(`  ❌ MiniMax API error: ${response.status} - ${errText}`)
      return generateFallbackSummary(content)
    }

    const data = await response.json() as any
    const summary = (data?.reply || '').trim()

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
      .from('articles')
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
    .from('articles')
    .insert({
      title: article.title,
      content: article.summary,
      slug: article.slug,
      source: article.source_name,
      link: article.original_url,
      lang: 'zh',
      status: 'published',
      pub_date: article.published_at,
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
      console.error(`  ❌ Error processing: ${item.title.substring(0, 40)}`, err)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Done! Saved: ${saved}, Skipped: ${skipped}, Errors: ${errors}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})