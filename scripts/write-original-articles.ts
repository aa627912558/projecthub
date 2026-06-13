import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xxfpsmreaktaugrzsoto.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZnBzbXJlYWt0YXVncnpzb3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2Mzg2MywiZXhwIjoyMDg5ODM5ODYzfQ.qtKM6Tssl-GV2yEeSGsJ7gJp04J2tGKrnGH2ss7Va6s'
const MINIMAX_KEY = 'sk-cp-McAYOuw8edBZxgJXEg0_b5XdFmIoOEc_9qWBR4t-C2l2YtRypk2F0Css3IJf8gThyY0BTj6CbHSm1fudM5nNWNfx1q4FAaUGFw1717v30IbWCC5nPRPvOMA'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const ARTICLES = [
  {
    title: 'Anthropic发布Claude Fable 5：世界模型的下一个里程碑',
    tags: ['AI', 'Anthropic', '世界模型', 'Claude'],
    prompt: `请为以下主题写一篇500-800字的原创中文科技资讯文章，有观点有分析。

主题：Anthropic发布Claude Fable 5和Mythos 5，世界模型与具身智能的最新进展

要求：
1. 用中文撰写
2. 500-800字
3. 有深度分析，不是泛泛而谈
4. 结合实际应用场景
5. 结尾有思考和展望
6. 不要添加标题（标题已提供）

---
标题：Anthropic发布Claude Fable 5：世界模型的下一个里程碑
---`
  },
  {
    title: 'OpenAI产品线密集调整：GPT-4o API定价变化背后的战略意图',
    tags: ['AI', 'OpenAI', 'GPT', 'API'],
    prompt: `请为以下主题写一篇500-800字的原创中文科技资讯文章，有观点有分析。

主题：OpenAI近期多项产品调整，GPT-4o API定价变化，ChatGPT更新背后的战略意图

要求：
1. 用中文撰写
2. 500-800字
3. 有深度分析，不是泛泛而谈
4. 结合实际应用场景
5. 结尾有思考和展望
6. 不要添加标题（标题已提供）

---
标题：OpenAI产品线密集调整：GPT-4o API定价变化背后的战略意图
---`
  },
  {
    title: '世界模型+具身智能：当AI开始"理解"物理世界',
    tags: ['AI', '世界模型', '具身智能', '机器人'],
    prompt: `请为以下主题写一篇500-800字的原创中文科技资讯文章，有观点有分析。

主题：世界模型（World Models）与具身智能（Embodied AI）发展趋势，AI如何理解物理世界

要求：
1. 用中文撰写
2. 500-800字
3. 有深度分析，不是泛泛而谈
4. 结合实际应用场景（机器人、自动驾驶等）
5. 结尾有思考和展望
6. 不要添加标题（标题已提供）

---
标题：世界模型+具身智能：当AI开始"理解"物理世界
---`
  }
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}

async function generateContent(title: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_KEY}`,
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
        content: '你是一个专业的中文科技资讯编辑，擅长撰写有深度、有观点的科技分析文章。'
      }],
      reply_constraints: {
        role: 'assistant',
        sender_type: 'BOT',
        sender_name: 'assistant'
      },
      temperature: 0.7,
      tokens_to_generate: 1500,
    }),
  })

  const data = await response.json() as any
  const reply = data?.reply || ''
  // Strip markdown formatting that MiniMax sometimes adds
  // Strip markdown formatting that MiniMax sometimes adds
  let content = reply
    .replace(/^#+\s*/gm, '')  // Remove markdown headers
    .replace(/\*\*+/g, '')    // Remove bold markers
    .replace(/^### \d+\.?\s*/gm, '')  // Remove ### numbered headers
    .replace(/^\d+\.\s+/gm, '')       // Remove numbered list markers
    .replace(/\n{3,}/g, '\n\n')  // Remove excess newlines
    .trim()
  return content || reply.trim()
}

async function main() {
  console.log('✍️  Writing original articles...\n')
  
  for (const article of ARTICLES) {
    console.log(`📝 Writing: ${article.title}`)
    
    try {
      const content = await generateContent(article.title, article.prompt)
      
      if (!content || content.length < 50) {
        console.log(`  ❌ Failed to generate content for: ${article.title}`)
        console.log(`  Raw: ${content.substring(0, 100)}`)
        continue
      }
      
      const slug = slugify(article.title)
      
      const { error } = await supabase
        .from('articles')
        .insert({
          title: article.title,
          content: content,
          slug: slug,
          source: '精粹AI资讯',
          link: '',
          lang: 'zh',
          status: 'published',
          pub_date: new Date().toISOString(),
        })

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⏭️  Already exists: ${slug}`)
        } else {
          console.log(`  ❌ DB error: ${error.message}`)
        }
      } else {
        console.log(`  ✅ Saved: ${article.title} (${content.length} chars)`)
      }
      
      await new Promise(r => setTimeout(r, 3000))
    } catch (err) {
      console.log(`  ❌ Error: ${err}`)
    }
  }
  
  console.log('\n✅ All done!')
}

main().catch(console.error)