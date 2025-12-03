-- Migration: Ensure user_profiles table exists and is complete for onboarding
-- This migration is idempotent and safe to run multiple times

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE, -- Changed to TEXT for Clerk compatibility
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'trainee' CHECK (role IN ('trainee', 'employee')),
  base_location TEXT,
  dietary_preference TEXT NOT NULL DEFAULT 'vegetarian' CHECK (dietary_preference IN ('vegetarian', 'non-veg')),
  karma_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ensure columns exist (in case table existed but was incomplete)
DO $$
BEGIN
    -- user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id') THEN
        ALTER TABLE user_profiles ADD COLUMN user_id TEXT UNIQUE;
    ELSE
        -- Ensure it's TEXT
        ALTER TABLE user_profiles ALTER COLUMN user_id TYPE TEXT;
    END IF;

    -- display_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'display_name') THEN
        ALTER TABLE user_profiles ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- role
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
        ALTER TABLE user_profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'trainee';
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('trainee', 'employee'));
    END IF;

    -- base_location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'base_location') THEN
        ALTER TABLE user_profiles ADD COLUMN base_location TEXT;
    END IF;

    -- dietary_preference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'dietary_preference') THEN
        ALTER TABLE user_profiles ADD COLUMN dietary_preference TEXT NOT NULL DEFAULT 'vegetarian';
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_dietary_preference_check CHECK (dietary_preference IN ('vegetarian', 'non-veg'));
    END IF;

    -- karma_points
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'karma_points') THEN
        ALTER TABLE user_profiles ADD COLUMN karma_points INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'level') THEN
        ALTER TABLE user_profiles ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- 4. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Re-apply Policies (Drop first to avoid conflicts)
DROP POLICY IF EXISTS user_profiles_select_public ON user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_owner ON user_profiles;
DROP POLICY IF EXISTS user_profiles_update_owner ON user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_owner ON user_profiles;

-- Public read access
CREATE POLICY user_profiles_select_public ON user_profiles 
  FOR SELECT TO PUBLIC USING (true);

-- Owner insert access (using Clerk ID from JWT or Supabase Auth UID)
CREATE POLICY user_profiles_insert_owner ON user_profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) = user_id
  );

-- Owner update access
CREATE POLICY user_profiles_update_owner ON user_profiles 
  FOR UPDATE TO authenticated 
  USING (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) = user_id
  );

-- 6. Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;
GRANT SELECT ON user_profiles TO anon;
