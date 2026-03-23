# ProjectHub - 项目分享网站

开放的项目分享平台，支持 SEO 和 AI 友好的结构化数据。

## 技术栈

- **Frontend**: Next.js 14 (App Router, SSR)
- **Database**: PostgreSQL (Supabase)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deploy**: Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo>
cd projecthub
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.local.example .env.local
```

填写以下变量：
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- `NEXT_PUBLIC_SITE_URL` - 网站 URL

### 4. 配置数据库

在 Supabase SQL Editor 中运行 `supabase/migrations/001_initial_schema.sql`。

### 5. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000

## 功能

- ✅ 项目发布（需审核）
- ✅ 用户注册/登录
- ✅ 用户个人主页
- ✅ 项目搜索和标签筛选
- ✅ SEO 优化（JSON-LD, sitemap, robots.txt）
- ✅ AI 友好的结构化数据
- ✅ RSS Feed
- ✅ 管理员后台

## 目录结构

```
src/
├── app/              # Next.js App Router 页面
│   ├── api/          # API 路由
│   ├── projects/     # 项目详情页
│   ├── u/           # 用户主页
│   ├── admin/       # 管理后台
│   └── ...
├── components/       # React 组件
├── lib/             # 工具函数
└── types/           # TypeScript 类型
```

## 部署到 Vercel

1. 在 GitHub 创建仓库并推送代码
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

## 设置管理员

在 Supabase SQL Editor 中执行：

```sql
update public.profiles set is_admin = true where email = 'your@email.com';
```
