import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

const ARTICLES_TO_MIGRATE = [
  {
    id: '1f542caf-6935-48a3-aee3-359e5accb113',
    title: 'AI自动化外贸：一个人做跨境电商的新玩法',
    slug: 'ai-automation-cross-border-ecommerce-2026',
    description: '跨境电商不再是资金雄厚的大玩家专属领地。借助AI工具，一个人完全可以完成选品、翻译、客服、营销全部环节，把中国商品卖向全球。亚马逊FBA、TikTok Shop、Shopify独立站等多种变现方式全解析。',
    category: '副业',
    cover_image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
    tags: ['副业', '网创', 'AI项目'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: '2026-03-28T00:00:00+00:00',
    created_at: '2026-03-27T16:53:47.945148+00:00'
  },
  {
    id: '5493f7c2-334b-447e-a3c1-1821f608f4e1',
    title: 'AI简历优化服务：帮求职者和升职者卖出好价格',
    slug: 'ai-resume-optimization-service-2026',
    description: '简历是求职者的广告文案，一份好简历能让人获得面试机会甚至加薪10%到30%。AI简历优化服务就是帮人卖出自己的副业，成本极低，ROI可观。单次服务定价99-699元，月入可达数千。',
    category: '副业',
    cover_image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
    tags: ['副业', '网创', 'AI项目'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: '2026-03-28T00:00:00+00:00',
    created_at: '2026-03-27T16:53:45.788633+00:00'
  },
  {
    id: '85c52c66-70b8-47fa-b5bf-f4fad0dbf894',
    title: 'AI图片定制：T恤衫、手机壳的热销密码',
    slug: 'ai-image-custom-product-printing-2026',
    description: '用AI生成个性化图案，定制成T恤、手机壳等实体商品销售——这是2026年低成本创业的热门赛道。一个人在家，用AI工具生成图案，交工厂一件代发，几乎零库存创业。启动成本仅需50-200元。',
    category: '副业',
    cover_image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    tags: ['副业', '网创', 'AI项目'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: '2026-03-28T00:00:00+00:00',
    created_at: '2026-03-27T16:53:44.479666+00:00'
  },
  {
    id: 'c642e287-eb1d-4dff-a250-dd1e8902be44',
    title: 'AI代写文章服务：一个人就能做的知识变现副业',
    slug: 'ai-article-writing-service-side-income-2026',
    description: 'AI代写文章服务是2026年门槛最低、变现最快的副业之一。不需要货源，不需要大额投入，只需要会用AI工具、会沟通，就能把写作能力变成稳定收入。演讲稿50-200元每篇，企业文案报价更高。',
    category: '副业',
    cover_image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&q=80',
    tags: ['副业', '网创', 'AI项目'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: '2026-03-28T00:00:00+00:00',
    created_at: '2026-03-27T16:53:42.334483+00:00'
  },
  {
    id: 'dcaffe27-85cc-4722-a70d-d60c57945799',
    title: 'AI数字人直播带货：一个人运营十个直播间的变现密码',
    slug: 'ai-shurengren-zhibojia-makes-money-2026',
    description: 'AI数字人直播带货正在成为2026年最火热的AI副业赛道。一个人同时运营十个虚拟直播间，不用真人出镜，24小时不间断带货。TikTok Shop内嵌数字人功能，2026年仍在红利期。',
    category: '副业',
    cover_image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
    tags: ['副业', '网创', 'AI项目'],
    author_id: '22ad0bcc-4b4d-4e11-a9af-3800ef3fcfd0',
    status: 'published',
    published_at: '2026-03-28T00:00:00+00:00',
    created_at: '2026-03-27T16:53:39.941114+00:00'
  }
]

export async function POST() {
  try {
    const admin = await createAdminClient()

    const results = []
    for (const article of ARTICLES_TO_MIGRATE) {
      const { data, error } = await admin
        .from('projects')
        .upsert(article, { onConflict: 'id' })
        .select('id, title')
        .single()

      if (error) {
        results.push({ id: article.id, title: article.title, error: error.message })
      } else {
        results.push({ id: data.id, title: data.title, success: true })
      }
    }

    const successCount = results.filter(r => r.success).length
    return NextResponse.json({
      message: `Migrated ${successCount}/${ARTICLES_TO_MIGRATE.length} articles`,
      results
    })
  } catch (err) {
    console.error('Migration error:', err)
    return NextResponse.json({ error: 'Migration failed', details: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Migration endpoint - POST to run migration',
    articlesCount: ARTICLES_TO_MIGRATE.length
  })
}
