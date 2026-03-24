-- Admin users table for site administration
-- Username/password auth separate from Supabase Auth

CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default admin
-- Password: Admin@2026!
INSERT INTO public.admins (username, password_hash) VALUES (
  'admin',
  '$2b$10$VUKEziclXHIN3R5dStaqxOy1PKrhcuPq9DtXyufOjdOK.VsVAomiS'
) ON CONFLICT (username) DO NOTHING;
