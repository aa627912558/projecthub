import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

const ARTICLES = [
  {
    slug: 'xianyu-wuhuo-yuer-guowan',
    title: '闲鱼无货源：二手平台卖货，月入过万的真实操作',
    description: '你有没有这种感觉——想买什么东西的时候，第一反应不是去淘宝，而是先去闲鱼看看。二手的东西便宜，有时候还能捡到全新的。\n\n这就是闲鱼的机会。在闲鱼上卖东西，货源不是你自己囤的，而是从拼多多、1688一件代发过来的。客户下单后，你再去上游下单，让厂家直接发给客户。你赚的是差价。\n\n2026年了，闲鱼月活用户超过5亿。流量大、门槛低、规则对新手友好。某鱼对无货源模式的管控比前几年松了很多，一个人在家就能跑通。',
    cover_image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    project_url: 'https://www.xiangmupai.com',
    gallery: [],
    tags: ['闲鱼', '二手', '副业', '电商', '无货源'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: new Date().toISOString()
  },
  {
    slug: 'siyu-bianxian-pengyouquan-maihuo',
    title: '私域流量变现：朋友圈卖货月入2万，见过真实的版本',
    description: '你有没有这种感觉——刷朋友圈的时候，看到某个人天天发，没觉得他烦，反而觉得他推荐的东西还挺靠谱的。有时候甚至会主动去问他最近有什么好推荐。\n\n这就是私域变现的样子。把对你有信任的人圈在你的微信里，然后持续提供价值，最终形成自动成交。你不需要每天找新客户，维护好老客户，让他们反复购买，顺便帮你介绍新客户。\n\n公域流量越来越贵，淘宝、抖音获取一个新客户动不动几十上百块。但私域——那些加了你微信的人——你可以免费触达。',
    cover_image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    project_url: 'https://www.xiangmupai.com',
    gallery: [],
    tags: ['私域', '微信', '朋友圈', '副业', '电商'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: new Date().toISOString()
  },
  {
    slug: 'zhishi-zhifu-kecheng-yuer-3wan',
    title: '知识付费：个人IP课程月入3万，实战路径拆解',
    description: '你有没有在某方面特别擅长的技能，却被别人请教时随便说两句就完了？\n\n知识付费，就是把你脑子里值钱的东西，变成能卖钱的产品。把你的专业技能、经验、资源整理成课程、专栏、训练营，通过线上平台销售。边际成本为零，卖多少份赚多少份。\n\n2026年知识付费市场超过2000亿，还在增长。职场焦虑、赚钱焦虑、育儿焦虑，所有焦虑都在驱动学习需求。但真正有结果、有案例、能落地的课，依然极度稀缺。',
    cover_image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80',
    project_url: 'https://www.xiangmupai.com',
    gallery: [],
    tags: ['知识付费', '课程', '个人IP', '副业', '变现'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: new Date().toISOString()
  },
  {
    slug: 'bendi-shenghuo-fuwu-3gongli-yuer-2wan',
    title: '本地生活服务：3公里内的小生意，月入2万的真实记录',
    description: '你有没有这种感觉——小区门口的包子铺开了十几年，老板换了两辆车。楼下那个洗鞋店，周末排队。社区团购的团长，每个月多赚三四千。\n\n这些都是本地生活服务，都是在3公里范围内做生意。立足社区，围绕周边居民的真实需求提供服务，不需要多么高大上，能解决身边人的实际问题，就能赚钱。\n\n大平台抢完流量红利，开始抢本地生活。美团、抖音都在做本地商家服务。但大平台服务不了所有人，社区周边的小生意，依然有大把机会留给普通人。',
    cover_image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80',
    project_url: 'https://www.xiangmupai.com',
    gallery: [],
    tags: ['本地生活', '社区', '副业', '小生意', '服务'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: new Date().toISOString()
  },
  {
    slug: 'xiaohongshu-guanggao-jiedan-yuer-guowan',
    title: '小红书博主接广告：从0粉到月入过万，接广告的正确姿势',
    description: '你有没有这种感觉——刷小红书的时候，看到某个博主接了广告，心想这东西也能接广告？那我是不是也可以？\n\n答案是：可以。在小红书上持续发布内容，积累粉丝和影响力，等品牌方找上门合作广告。2026年，单个粉丝的广告价值大约在0.5-3元之间。\n\n小红书月活超过2.6亿，用户以一二线城市年轻女性为主，消费力强。品牌在小红书的投放预算逐年增加，博主接广告的机会越来越多。',
    cover_image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80',
    project_url: 'https://www.xiangmupai.com',
    gallery: [],
    tags: ['小红书', '博主', '广告', '副业', '自媒体'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: new Date().toISOString()
  }
]

export async function POST() {
  try {
    const admin = await createAdminClient()

    const results = []
    for (const article of ARTICLES) {
      const { data, error } = await admin
        .from('projects')
        .upsert(article, { onConflict: 'slug' })
        .select('id, title')
        .single()

      if (error) {
        results.push({ slug: article.slug, title: article.title, error: error.message })
      } else {
        results.push({ id: data.id, title: data.title, success: true })
      }
    }

    const successCount = results.filter((r: any) => r.success).length
    return NextResponse.json({
      message: `Inserted ${successCount}/${ARTICLES.length} articles`,
      results
    })
  } catch (err) {
    console.error('Bulk insert error:', err)
    return NextResponse.json({ error: 'Insert failed', details: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Bulk insert endpoint - POST to run insert',
    articlesCount: ARTICLES.length
  })
}
