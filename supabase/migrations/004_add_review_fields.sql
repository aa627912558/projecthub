-- Add review tracking fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);
