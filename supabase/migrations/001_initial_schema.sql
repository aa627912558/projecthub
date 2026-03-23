-- ProjectHub Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase Auth users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  cover_image text not null,
  project_url text not null,
  gallery jsonb default '[]',
  tags text[] default '{}',
  author_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  rejection_reason text,
  created_at timestamptz default now(),
  published_at timestamptz
);

-- Indexes
create index if not exists projects_status on projects(status);
create index if not exists projects_author on projects(author_id);
create index if not exists projects_tags on projects using gin(tags);
create index if not exists projects_published_at on projects(published_at desc);
create index if not exists profiles_username on profiles(username);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Profiles: anyone can read, users can update their own
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Projects: published are public, pending/rejected only for author or admin
create policy "Published projects are viewable by everyone"
  on public.projects for select
  using (status = 'published');

create policy "Authors can view their own pending projects"
  on public.projects for select
  using (auth.uid() = author_id);

create policy "Anyone can insert projects"
  on public.projects for insert
  with check (auth.uid() = author_id);

create policy "Authors can update their own pending projects"
  on public.projects for update
  using (auth.uid() = author_id and status = 'pending');

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profiles
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Admin function (run manually in SQL Editor to set a user as admin)
-- update public.profiles set is_admin = true where email = 'your@email.com';
