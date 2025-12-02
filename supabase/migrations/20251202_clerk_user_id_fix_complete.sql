-- Migration: Complete fix for Clerk user_id - handles all policies and constraints
-- This migration safely converts all user_id columns from UUID to TEXT

-- ========================================
-- STEP 1: Drop all policies that depend on user_id columns
-- ========================================

-- User profiles policies
DROP POLICY IF EXISTS user_profiles_select_public ON user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_owner ON user_profiles;
DROP POLICY IF EXISTS user_profiles_update_owner ON user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_owner ON user_profiles;

-- Menu images policies
DROP POLICY IF EXISTS menu_images_select_public ON menu_images;
DROP POLICY IF EXISTS menu_images_insert_auth ON menu_images;
DROP POLICY IF EXISTS menu_images_update_owner ON menu_images;
DROP POLICY IF EXISTS menu_images_delete_owner ON menu_images;

-- Menus policies
DROP POLICY IF EXISTS menus_select_public ON menus;
DROP POLICY IF EXISTS menus_insert_auth ON menus;
DROP POLICY IF EXISTS menus_update_auth ON menus;
DROP POLICY IF EXISTS menus_delete_auth ON menus;

-- Daily contributions policies
DROP POLICY IF EXISTS daily_contributions_select_public ON daily_contributions;
DROP POLICY IF EXISTS daily_contributions_insert_auth ON daily_contributions;
DROP POLICY IF EXISTS daily_contributions_update_owner ON daily_contributions;
DROP POLICY IF EXISTS daily_contributions_delete_owner ON daily_contributions;

-- User badges policies
DROP POLICY IF EXISTS user_badges_select_public ON user_badges;
DROP POLICY IF EXISTS user_badges_insert_auth ON user_badges;
DROP POLICY IF EXISTS user_badges_update_owner ON user_badges;
DROP POLICY IF EXISTS user_badges_delete_owner ON user_badges;

-- Leaderboard policies
DROP POLICY IF EXISTS leaderboard_select_public ON leaderboard;
DROP POLICY IF EXISTS leaderboard_insert_auth ON leaderboard;
DROP POLICY IF EXISTS leaderboard_update_auth ON leaderboard;
DROP POLICY IF EXISTS leaderboard_delete_auth ON leaderboard;

-- Admin credentials policies (if exists)
DROP POLICY IF EXISTS admin_credentials_admin_only ON admin_credentials;
DROP POLICY IF EXISTS admin_credentials_select_admin ON admin_credentials;
DROP POLICY IF EXISTS admin_credentials_insert_admin ON admin_credentials;
DROP POLICY IF EXISTS admin_credentials_update_admin ON admin_credentials;
DROP POLICY IF EXISTS admin_credentials_delete_admin ON admin_credentials;

-- Local credentials policies (if exists)
DROP POLICY IF EXISTS local_credentials_select_owner ON local_credentials;
DROP POLICY IF EXISTS local_credentials_insert_owner ON local_credentials;
DROP POLICY IF EXISTS local_credentials_update_owner ON local_credentials;
DROP POLICY IF EXISTS local_credentials_delete_owner ON local_credentials;

-- Admin activity log policies (if exists)
DROP POLICY IF EXISTS admin_activity_log_select_admin ON admin_activity_log;
DROP POLICY IF EXISTS admin_activity_log_insert_admin ON admin_activity_log;

-- ========================================
-- STEP 2: Drop foreign key constraints
-- ========================================

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE daily_contributions DROP CONSTRAINT IF EXISTS daily_contributions_user_id_fkey;
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_user_id_fkey;
ALTER TABLE menu_images DROP CONSTRAINT IF EXISTS menu_images_uploaded_by_fkey;
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_verified_by_fkey;

-- ========================================
-- STEP 3: Alter columns to TEXT type
-- ========================================

-- User profiles
ALTER TABLE user_profiles ALTER COLUMN user_id TYPE TEXT;

-- Daily contributions
ALTER TABLE daily_contributions ALTER COLUMN user_id TYPE TEXT;

-- User badges
ALTER TABLE user_badges ALTER COLUMN user_id TYPE TEXT;

-- Leaderboard
ALTER TABLE leaderboard ALTER COLUMN user_id TYPE TEXT;

-- Menu images (uploaded_by)
ALTER TABLE menu_images ALTER COLUMN uploaded_by TYPE TEXT;

-- Menus (verified_by)
ALTER TABLE menus ALTER COLUMN verified_by TYPE TEXT;

-- Local credentials (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'local_credentials' AND column_name = 'user_id') THEN
        ALTER TABLE local_credentials ALTER COLUMN user_id TYPE TEXT;
    END IF;
END $$;

-- Admin credentials (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_credentials' AND column_name = 'user_id') THEN
        ALTER TABLE admin_credentials ALTER COLUMN user_id TYPE TEXT;
    END IF;
END $$;

-- Admin activity log (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_activity_log' AND column_name = 'admin_user_id') THEN
        ALTER TABLE admin_activity_log ALTER COLUMN admin_user_id TYPE TEXT;
    END IF;
END $$;

-- ========================================
-- STEP 4: Create indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_contributions_user_id ON daily_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_images_uploaded_by ON menu_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_menus_verified_by ON menus(verified_by);

-- ========================================
-- STEP 5: Recreate RLS policies
-- ========================================

-- User profiles policies
CREATE POLICY user_profiles_select_public ON user_profiles 
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY user_profiles_insert_owner ON user_profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) = user_id
  );

CREATE POLICY user_profiles_update_owner ON user_profiles 
  FOR UPDATE TO authenticated 
  USING (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) = user_id
  );

-- Menu images policies
CREATE POLICY menu_images_select_public ON menu_images 
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY menu_images_insert_auth ON menu_images 
  FOR INSERT TO authenticated 
  WITH CHECK (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) IS NOT NULL
  );

CREATE POLICY menu_images_update_owner ON menu_images 
  FOR UPDATE TO authenticated 
  USING (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) = uploaded_by
  );

-- Menus policies
CREATE POLICY menus_select_public ON menus 
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY menus_insert_auth ON menus 
  FOR INSERT TO authenticated 
  WITH CHECK (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) IS NOT NULL
  );

CREATE POLICY menus_update_auth ON menus 
  FOR UPDATE TO authenticated 
  USING (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) IS NOT NULL
  );

-- Daily contributions policies
CREATE POLICY daily_contributions_select_public ON daily_contributions 
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY daily_contributions_insert_auth ON daily_contributions 
  FOR INSERT TO authenticated 
  WITH CHECK (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) IS NOT NULL
  );

-- User badges policies
CREATE POLICY user_badges_select_public ON user_badges 
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY user_badges_insert_auth ON user_badges 
  FOR INSERT TO authenticated 
  WITH CHECK (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) IS NOT NULL
  );

-- Leaderboard policies
CREATE POLICY leaderboard_select_public ON leaderboard 
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY leaderboard_insert_auth ON leaderboard 
  FOR INSERT TO authenticated 
  WITH CHECK (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) IS NOT NULL
  );

CREATE POLICY leaderboard_update_auth ON leaderboard 
  FOR UPDATE TO authenticated 
  USING (
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) IS NOT NULL
  );

-- ========================================
-- STEP 6: Add comments for documentation
-- ========================================

COMMENT ON COLUMN user_profiles.user_id IS 'Clerk user ID (format: user_xxx)';
COMMENT ON COLUMN daily_contributions.user_id IS 'Clerk user ID (format: user_xxx)';
COMMENT ON COLUMN user_badges.user_id IS 'Clerk user ID (format: user_xxx)';
COMMENT ON COLUMN leaderboard.user_id IS 'Clerk user ID (format: user_xxx)';
COMMENT ON COLUMN menu_images.uploaded_by IS 'Clerk user ID (format: user_xxx)';
COMMENT ON COLUMN menus.verified_by IS 'Clerk user ID (format: user_xxx)';
