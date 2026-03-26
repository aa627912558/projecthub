-- Add categories multi-select column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Index for efficient category filtering
CREATE INDEX IF NOT EXISTS idx_projects_categories ON public.projects USING GIN (categories);
