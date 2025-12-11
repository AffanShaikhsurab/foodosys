-- Migration: Fix RLS policies for Clerk integration
-- This migration adds the helper function for extracting Clerk user IDs
-- and updates all RLS policies to work with Clerk authentication

-- 1. Create helper function to extract Clerk user ID from JWT
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$ LANGUAGE SQL STABLE;

-- 2. Update RLS policies for restaurants table
DROP POLICY IF EXISTS restaurants_select_public ON restaurants;
CREATE POLICY restaurants_select_public ON restaurants FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS restaurants_insert_auth ON restaurants;
CREATE POLICY restaurants_insert_auth ON restaurants FOR INSERT TO authenticated 
WITH CHECK (requesting_user_id() IS NOT NULL);

DROP POLICY IF EXISTS restaurants_update_auth ON restaurants;
CREATE POLICY restaurants_update_auth ON restaurants FOR UPDATE TO authenticated 
USING (requesting_user_id() IS NOT NULL);

-- 3. Update RLS policies for menu_images table
DROP POLICY IF EXISTS menu_images_select_public ON menu_images;
CREATE POLICY menu_images_select_public ON menu_images FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS menu_images_insert_auth ON menu_images;
CREATE POLICY menu_images_insert_auth ON menu_images FOR INSERT TO authenticated 
WITH CHECK (requesting_user_id() IS NOT NULL);

DROP POLICY IF EXISTS menu_images_update_owner ON menu_images;
CREATE POLICY menu_images_update_owner ON menu_images FOR UPDATE TO authenticated 
USING (requesting_user_id() = uploaded_by);

-- 4. Update RLS policies for ocr_results table
DROP POLICY IF EXISTS ocr_results_select_public ON ocr_results;
CREATE POLICY ocr_results_select_public ON ocr_results FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS ocr_results_insert_auth ON ocr_results;
CREATE POLICY ocr_results_insert_auth ON ocr_results FOR INSERT TO authenticated 
WITH CHECK (requesting_user_id() IS NOT NULL);

-- 5. Update RLS policies for menus table
DROP POLICY IF EXISTS menus_select_public ON menus;
CREATE POLICY menus_select_public ON menus FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS menus_insert_auth ON menus;
CREATE POLICY menus_insert_auth ON menus FOR INSERT TO authenticated 
WITH CHECK (requesting_user_id() IS NOT NULL);

DROP POLICY IF EXISTS menus_update_auth ON menus;
CREATE POLICY menus_update_auth ON menus FOR UPDATE TO authenticated 
USING (requesting_user_id() IS NOT NULL);

-- 6. Update RLS policies for user_profiles table
DROP POLICY IF EXISTS user_profiles_select_public ON user_profiles;
CREATE POLICY user_profiles_select_public ON user_profiles FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS user_profiles_insert_owner ON user_profiles;
CREATE POLICY user_profiles_insert_owner ON user_profiles FOR INSERT TO authenticated 
WITH CHECK (requesting_user_id() = user_id);

DROP POLICY IF EXISTS user_profiles_update_owner ON user_profiles;
CREATE POLICY user_profiles_update_owner ON user_profiles FOR UPDATE TO authenticated 
USING (requesting_user_id() = user_id);

-- 7. Update RLS policies for user_badges table
DROP POLICY IF EXISTS user_badges_select_public ON user_badges;
CREATE POLICY user_badges_select_public ON user_badges FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS user_badges_insert_auth ON user_badges;
CREATE POLICY user_badges_insert_auth ON user_badges FOR INSERT TO authenticated 
WITH CHECK (requesting_user_id() IS NOT NULL);

-- 8. Update RLS policies for daily_contributions table
DROP POLICY IF EXISTS daily_contributions_select_public ON daily_contributions;
CREATE POLICY daily_contributions_select_public ON daily_contributions FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS daily_contributions_insert_auth ON daily_contributions;
CREATE POLICY daily_contributions_insert_auth ON daily_contributions FOR INSERT TO authenticated 
WITH CHECK (requesting_user_id() = user_id);

-- 9. Update RLS policies for leaderboard table
DROP POLICY IF EXISTS leaderboard_select_public ON leaderboard;
CREATE POLICY leaderboard_select_public ON leaderboard FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS leaderboard_insert_auth ON leaderboard;
CREATE POLICY leaderboard_insert_auth ON leaderboard FOR INSERT TO authenticated 
WITH CHECK (requesting_user_id() IS NOT NULL);

DROP POLICY IF EXISTS leaderboard_update_auth ON leaderboard;
CREATE POLICY leaderboard_update_auth ON leaderboard FOR UPDATE TO authenticated 
USING (requesting_user_id() IS NOT NULL);

-- 10. Update functions that reference auth.uid() to use requesting_user_id()
DROP FUNCTION IF EXISTS safe_get_karma(UUID);
CREATE OR REPLACE FUNCTION safe_get_karma(user_uuid TEXT) RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT COALESCE(karma_points, 0) FROM user_profiles WHERE user_id = $1;
$$;

-- Update award_badges function to work with TEXT user IDs
DROP FUNCTION IF EXISTS award_badges(TEXT, TEXT);
CREATE OR REPLACE FUNCTION award_badges(user_id_text TEXT, contribution_type_param TEXT) RETURNS VOID AS $$
DECLARE
  upload_count INTEGER;
  total_karma INTEGER;
BEGIN
  SELECT COUNT(*) INTO upload_count FROM daily_contributions WHERE user_id = user_id_text AND contribution_type = 'upload';
  SELECT safe_get_karma(user_id_text) INTO total_karma;

  IF upload_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_id_text AND badge_name = 'First Upload'
  ) THEN
    INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
    VALUES (user_id_text, 'First Upload', 'ri-camera-lens-fill', '#E8F5E9');
  END IF;

  IF upload_count >= 7 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_id_text AND badge_name = '7 Day Streak'
  ) THEN
    INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
    VALUES (user_id_text, '7 Day Streak', 'ri-fire-fill', '#FFF3E0');
  END IF;

  IF total_karma >= 1000 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_id_text AND badge_name = 'Mess Legend'
  ) THEN
    INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
    VALUES (user_id_text, 'Mess Legend', 'ri-trophy-fill', '#DCEB66');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update award_karma_points function to work with TEXT user IDs
DROP FUNCTION IF EXISTS award_karma_points(TEXT, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION award_karma_points(user_id_text TEXT, points INTEGER, contribution_type_param TEXT) RETURNS VOID AS $$
DECLARE
  new_total INTEGER;
BEGIN
  -- Update user's karma and level atomically
  UPDATE user_profiles
  SET
    karma_points = karma_points + points,
    level = CASE
      WHEN karma_points + points >= 2000 THEN 5
      WHEN karma_points + points >= 1500 THEN 4
      WHEN karma_points + points >= 1000 THEN 3
      WHEN karma_points + points >= 500 THEN 2
      ELSE 1
    END,
    updated_at = NOW()
  WHERE user_id = user_id_text
  RETURNING karma_points INTO new_total;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Upsert leaderboard row
  INSERT INTO leaderboard (user_id, total_karma, weekly_karma, monthly_karma, last_updated)
  VALUES (user_id_text, new_total, points, points, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_karma = EXCLUDED.total_karma,
    weekly_karma = leaderboard.weekly_karma + EXCLUDED.weekly_karma,
    monthly_karma = leaderboard.monthly_karma + EXCLUDED.monthly_karma,
    last_updated = NOW();

  -- Award badges (idempotent)
  PERFORM award_badges(user_id_text, contribution_type_param);
END;
$$ LANGUAGE plpgsql;

-- Update on_contribution_created trigger function
DROP FUNCTION IF EXISTS on_contribution_created();
CREATE OR REPLACE FUNCTION on_contribution_created() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contribution_type = 'upload' THEN
    PERFORM award_karma_points(NEW.user_id, 10, 'upload');
  ELSIF NEW.contribution_type = 'edit' THEN
    PERFORM award_karma_points(NEW.user_id, 5, 'edit');
  ELSIF NEW.contribution_type = 'verify' THEN
    PERFORM award_karma_points(NEW.user_id, 3, 'verify');
  END IF;

  PERFORM update_leaderboard_rankings();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update get_today_contributors function to work with TEXT user IDs
DROP FUNCTION IF EXISTS get_today_contributors(UUID);
CREATE OR REPLACE FUNCTION get_today_contributors(restaurant_uuid UUID)
RETURNS TABLE(
  user_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  contribution_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    up.display_name,
    up.avatar_url,
    dc.created_at
  FROM daily_contributions dc
  JOIN user_profiles up ON dc.user_id = up.user_id
  WHERE dc.restaurant_id = restaurant_uuid
    AND dc.contribution_date = CURRENT_DATE
    AND dc.contribution_type = 'upload'
  ORDER BY dc.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;