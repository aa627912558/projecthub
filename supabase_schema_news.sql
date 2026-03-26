-- News Articles Table for AI News Summaries
-- Run this in Supabase SQL Editor to create the news_articles table

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,                    -- AI-generated summary (100-300 chars)
  source_name TEXT NOT NULL,               -- e.g. '机器之心'
  source_url TEXT,                          -- RSS feed URL
  original_url TEXT NOT NULL,               -- Original article URL
  published_at TIMESTAMPTZ,                -- Original publish date
  cover_image TEXT,                         -- Optional cover image URL
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_tags ON news_articles USING GIN(tags);

-- RLS
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Public read access to published articles
CREATE POLICY "Public read published news" ON news_articles
  FOR SELECT USING (status = 'published');

-- Only service role can insert/update/delete
CREATE POLICY "Service role full access" ON news_articles
  FOR ALL USING (auth.role() = 'service_role');

-- No direct public insert/update/delete
CREATE POLICY "No public insert" ON news_articles FOR INSERT WITH CHECK (false);
CREATE POLICY "No public update" ON news_articles FOR UPDATE USING (false);
CREATE POLICY "No public delete" ON news_articles FOR DELETE USING (false);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_news_articles_updated_at ON news_articles;
CREATE TRIGGER set_news_articles_updated_at
  BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
