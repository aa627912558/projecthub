-- 项目派 Database Schema 更新
-- 添加 AI 内容审核相关字段

-- 1. 添加新字段到 projects 表
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS flagged_content jsonb,
ADD COLUMN IF NOT EXISTS flagged_reason text;

-- 2. 更新 status CHECK 约束（PostgreSQL 需要先删除旧约束）
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('pending', 'published', 'rejected', 'pending_review'));

-- 3. 更新 RLS 策略，让管理员可以查看 pending_review 的项目
-- 先删除旧策略
DROP POLICY IF EXISTS "Authors can view their own pending projects" ON public.projects;
DROP POLICY IF EXISTS "Authors can update their own pending projects" ON public.projects;

-- 管理员可以查看所有 pending_review 的项目
CREATE POLICY "Admin can view pending_review projects"
  ON public.projects FOR SELECT
  USING (
    status = 'published' 
    OR auth.uid() = author_id 
    OR (
      status IN ('pending', 'pending_review', 'rejected')
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
      )
    )
  );

-- 作者可以更新自己 pending_review 的项目（用于编辑后重新提交）
CREATE POLICY "Authors can update their own pending_review projects"
  ON public.projects FOR UPDATE
  USING (
    auth.uid() = author_id 
    AND status IN ('pending', 'pending_review')
  );

-- 4. 添加索引
CREATE INDEX IF NOT EXISTS projects_flagged_reason ON projects(flagged_reason) WHERE flagged_reason IS NOT NULL;

-- 5.（可选）创建函数用于内容审核通知
CREATE OR REPLACE FUNCTION public.notify_admin_on_flagged_project()
RETURNS TRIGGER AS $$
BEGIN
  -- 当新项目被标记为 pending_review 时，触发通知
  IF NEW.status = 'pending_review' AND NEW.flagged_reason IS NOT NULL THEN
    -- 这里可以添加发送邮件的逻辑
    -- 目前通过日志记录
    RAISE NOTICE 'Flagged project requires review: % - Reason: %', NEW.title, NEW.flagged_reason;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建 trigger（如果不存在）
DROP TRIGGER IF EXISTS on_project_flagged ON public.projects;
CREATE TRIGGER on_project_flagged
  AFTER INSERT OR UPDATE OF status ON public.projects
  FOR EACH ROW
  WHEN (NEW.status = 'pending_review')
  EXECUTE PROCEDURE public.notify_admin_on_flagged_project();

-- 注意：执行完此SQL后，需要在 Supabase Dashboard > Table Editor > projects 查看并确认字段已添加
