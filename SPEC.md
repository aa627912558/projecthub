# ProjectHub - 项目分享网站规格说明书

## 1. Concept & Vision

ProjectHub（项目阁）是一个开放的项目分享平台，任何人都可以发布和发现有趣的项目。设计理念是**极简、专业、AI友好**——让每个项目都能被搜索引擎和AI大模型准确理解。视觉风格借鉴ProductHunt的简洁干净，用少量强调色突出重点，让内容成为主角。

## 2. Design Language

### Aesthetic Direction
ProductHunt + Dev.to 的简约风格，大量留白，信息层次分明。

### Color Palette
```
--bg-primary:    #FFFFFF  (主背景)
--bg-secondary: #F9FAFB  (次级背景/卡片)
--text-primary: #111827  (主文字)
--text-secondary:#6B7280 (次级文字)
--accent:       #6366F1  (强调色-靛蓝)
--accent-hover: #4F46E5
--border:       #E5E7EB
--success:      #10B981
--warning:      #F59E0B
--error:        #EF4444
```

### Typography
- 主字体：`Inter`（英文）/ `Noto Sans SC`（中文）
- Fallback: `system-ui, -apple-system, sans-serif`
- 标题: 700 weight
- 正文: 400-500 weight
- 代码块: `JetBrains Mono`

### Spatial System
- 基础单位: 4px
- 间距: 4, 8, 12, 16, 24, 32, 48, 64, 96
- 最大内容宽度: 1280px
- 卡片圆角: 12px
- 按钮圆角: 8px

### Motion Philosophy
- 页面切换: 无（SSR）
- 微交互: `transition-all duration-200 ease-out`
- 悬停: scale(1.02) + shadow-md
- 加载状态: skeleton pulse animation

### Visual Assets
- Icons: Lucide React
- 图片: Next.js Image (自动优化)
- Logo: 文字 "ProjectHub" 或 "项目阁"

## 3. Layout & Structure

### 页面结构
```
├── /                    首页（项目列表）
├── /projects/[slug]     项目详情
├── /submit              发布项目
├── /u/[username]        用户主页
├── /admin               管理员后台
├── /about               关于页面
├── /sitemap.xml         sitemap
├── /robots.txt          robots
└── /rss.xml             RSS feed
```

### 首页布局
- Header: Logo + 导航 + 登录/注册
- Hero: 标题 + 搜索框
- 标签筛选栏
- 项目网格（3列 desktop / 2列 tablet / 1列 mobile）
- Footer: 版权 + 链接

### 项目详情页布局
- Header
- 项目封面大图
- 项目标题 + 作者 + 发布日期
- 标签
- 详细介绍（Markdown渲染）
- 截图Gallery
- 项目链接按钮
- Footer

### 响应式断点
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 4. Features & Interactions

### 用户系统
- 邮箱注册（Supabase Auth）
- 邮箱登录
- 用户名（唯一，用于个人主页URL）
- 头像（Gravatar或默认）
- Session管理（SSR cookie session）

### 项目发布
- 标题（必填，3-100字）
- 详细介绍（必填，Markdown格式，10-10000字）
- 封面图URL（必填，支持外部URL）
- 项目链接（必填，URL格式）
- 标签（可选，1-5个，每个最多20字）
- 截图Gallery（可选，最多10张，支持外部URL）
- 初始状态：pending（待审核）

### 项目列表
- 默认按最新发布时间排序
- 标签筛选（多选OR逻辑）
- 搜索（标题 + 描述模糊搜索）
- 分页（每页12个）

### 项目详情
- 完整Markdown渲染（支持代码高亮）
- 图片灯箱
- JSON-LD Schema.org 结构化数据

### 管理员后台
- 查看所有待审核项目
- 审核通过 → published
- 审核拒绝 → rejected（附带原因）
- 删除项目
- 管理员角色：is_admin 字段

### SEO + AI 优化
- 每个项目页面包含完整JSON-LD
- /sitemap.xml 包含所有已发布项目
- /robots.txt 允许爬取
- /rss.xml Atom feed
- 每页完整OG meta tags
- 每页 canonical URL
- 每页 description meta

## 5. Component Inventory

### ProjectCard
- 封面图（aspect-video，object-cover）
- 标题（单行省略）
- 作者 + 日期
- 标签（最多显示3个）
- 悬停：阴影加深，轻微上浮

### Button
- Primary: bg-accent, text-white
- Secondary: bg-white, border, text-primary
- Ghost: transparent, text-primary
- States: hover(darker), disabled(opacity-50), loading(spinner)

### Input
- border rounded-lg
- focus: ring-2 ring-accent/50
- Error: border-error, text below

### Tag
- 小圆角，浅色背景，文字颜色
- 可点击（筛选）或静态

### SearchBar
- 放大镜图标
- Placeholder: "搜索项目..."
- Debounce 300ms

### MarkdownRenderer
- 支持: h1-h6, p, ul, ol, code, pre, blockquote, img, a, table
- 代码块: 语法高亮（highlight.js）
- 图片: 响应式，可点击放大

### UserAvatar
- 圆形，32px
- Fallback: 首字母

### Navigation
- Logo
- 链接: 首页 / 关于
- Auth: 登录/注册 或 用户名下拉

## 6. Technical Approach

### Framework
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS

### Database Schema (Supabase PostgreSQL)

```sql
-- 用户表 (扩展 Supabase Auth)
create table public.profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  email text unique not null,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- 项目表
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,  -- Markdown
  cover_image text not null,
  project_url text not null,
  gallery jsonb default '[]',
  tags text[] default '{}',
  author_id uuid references public.profiles(id),
  status text not null default 'pending',  -- pending | published | rejected
  rejection_reason text,
  created_at timestamptz default now(),
  published_at timestamptz
);

-- 索引
create index projects_status on projects(status);
create index projects_author on projects(author_id);
create index projects_tags on projects using gin(tags);

-- RLS 策略
-- profiles: 公开读，自己可写
-- projects: pending只admin可见，published公开读，作者可更新自己
```

### API Routes
```
POST   /api/auth/register     注册
POST   /api/auth/login        登录
POST   /api/auth/logout       登出
GET    /api/auth/me           当前用户
GET    /api/projects          列表（支持分页/搜索/标签）
POST   /api/projects          创建项目（需登录）
GET    /api/projects/[slug]   详情
PUT    /api/projects/[id]     更新（需作者或admin）
DELETE /api/projects/[id]      删除（需admin）
GET    /api/admin/pending     待审核列表（需admin）
POST   /api/admin/approve     审核通过（需admin）
POST   /api/admin/reject      审核拒绝（需admin）
GET    /api/users/[username]  用户信息+项目
```

### 环境变量
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

### SEO 文件
- `app/sitemap.ts` - 动态生成 sitemap.xml
- `app/robots.ts` - 动态生成 robots.txt
- `app/rss.xml/route.ts` - RSS feed
- 每个页面 `generateMetadata` 输出完整OG tags

### JSON-LD 示例
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "项目名",
  "description": "项目描述",
  "author": { "@type": "Person", "name": "作者名" },
  "datePublished": "2024-01-01",
  "keywords": "标签1, 标签2",
  "image": "封面图URL",
  "url": "项目链接"
}
```

## 7. Deployment

- Vercel ( hobby plan )
- 自动部署 from GitHub
- 环境变量在 Vercel Dashboard 配置
- Supabase 数据库独立

## 8. 文件结构

```
projecthub/
├── SPEC.md
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── about/page.tsx
│   │   ├── submit/page.tsx
│   │   ├── admin/page.tsx
│   │   ├── projects/[slug]/page.tsx
│   │   ├── u/[username]/page.tsx
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── api/
│   │       └── ...
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── TagBadge.tsx
│   │   ├── Button.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   └── schemas.ts
│   └── types/
│       └── index.ts
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```
