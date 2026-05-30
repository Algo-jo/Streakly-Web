-- ====================================================================
-- STREAKLY DATABASE SCHEMA
-- Paste this script into your Supabase SQL Editor (SQL Editor > New Query)
-- ====================================================================

-- 1. ENABLE EXTENSIONS (If not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PROFILES TABLE (User Accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'Activity Enthusiast',
  bio TEXT DEFAULT 'I track consistency harian!',
  streak INT DEFAULT 0,
  highest_streak INT DEFAULT 0,
  last_submit_date TEXT, -- Formatted as YYYY-MM-DD
  avatar_url TEXT,
  followed_ids UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. CREATE CATEGORIES TABLE (Category lists like Gym, Reading)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  streak INT DEFAULT 0 NOT NULL,
  highest_streak INT DEFAULT 0 NOT NULL,
  last_submit_date TEXT, -- Formatted as YYYY-MM-DD
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add unique constraint for Category name per user
ALTER TABLE public.categories ADD CONSTRAINT unique_category_per_user UNIQUE (user_id, name);

-- 4. CREATE ACTIVITIES TABLE (Log logs)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  description TEXT, -- Optional description
  activity_level TEXT DEFAULT 'LOW' NOT NULL, -- LOW (Easy), MID (Medium), HIGH (Hard)
  files JSONB DEFAULT '[]'::jsonb NOT NULL, -- Array of attachments
  timestamp BIGINT NOT NULL, -- Date.now() timestamp
  date_str TEXT NOT NULL, -- Formatted as YYYY-MM-DD (crucial for timezones)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- A. PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- B. CATEGORIES POLICIES
CREATE POLICY "Public categories are viewable by everyone" 
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Users can insert their own categories" 
  ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
  ON public.categories FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
  ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- C. ACTIVITIES POLICIES
CREATE POLICY "Public activities are viewable by everyone" 
  ON public.activities FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activities" 
  ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" 
  ON public.activities FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" 
  ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- ====================================================================
-- AUTOMATED POSTGRES TRIGGER ON USER SIGNUP (OAUTH & EMAIL)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  avatar TEXT;
  display_name TEXT;
  counter INT := 0;
BEGIN
  -- 1. Grab Google avatar_url or generate empty
  avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );

  -- 2. Grab display name or use default
  display_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- 3. Auto-generate a unique username (very clean & failsafe)
  IF new.raw_user_meta_data->>'username' IS NOT NULL THEN
    base_username := lower(new.raw_user_meta_data->>'username');
  ELSE
    base_username := lower(split_part(new.email, '@', 1));
  END IF;

  -- Regex check to sanitize username to contain only alphanumeric & underscores
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  candidate_username := base_username;

  -- Loop to guarantee uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate_username) LOOP
    counter := counter + 1;
    candidate_username := base_username || counter::text;
  END LOOP;

  -- 4. Insert row into public.profiles
  INSERT INTO public.profiles (
    id,
    name,
    username,
    role,
    bio,
    avatar_url,
    streak,
    highest_streak,
    followed_ids
  ) VALUES (
    new.id,
    display_name,
    candidate_username,
    'Streakly Track Enthusiast',
    'Hello! Aku menggunakan Streakly untuk memantau konsistensiku harian.',
    avatar,
    0,
    0,
    '{}'::uuid[]
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    name = COALESCE(public.profiles.name, EXCLUDED.name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- DAILY CRON JOB STREAK CLEANUP (RUNS MIDNIGHT UTC)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.reset_broken_streaks()
RETURNS void AS $$
DECLARE
  today_str TEXT := to_char(current_date, 'YYYY-MM-DD');
  yesterday_str TEXT := to_char(current_date - 1, 'YYYY-MM-DD');
BEGIN
  -- Reset profile streaks where last submit was before yesterday
  UPDATE public.profiles
  SET streak = 0
  WHERE last_submit_date IS NOT NULL 
    AND last_submit_date != today_str 
    AND last_submit_date != yesterday_str;

  -- Reset category streaks where last submit was before yesterday
  UPDATE public.categories
  SET streak = 0
  WHERE last_submit_date IS NOT NULL 
    AND last_submit_date != today_str 
    AND last_submit_date != yesterday_str;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
