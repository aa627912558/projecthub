-- Add category column to projects table for single-category assignment
-- (tags[] is already used for multiple tags/labels)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS category text DEFAULT '副业';

-- Update RLS policy to allow admins to update any project
-- First check if admin update policy exists, if not create it
DROP POLICY IF EXISTS "Admin can update any project" ON public.projects;
CREATE POLICY "Admin can update any project"
  ON public.projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
