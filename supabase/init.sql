-- ===== Corrected schema with policy-safe creation (DROP IF EXISTS -> CREATE) =====

-- Enable pgcrypto extension for gen_random_uuid (Supabase usually has this)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Core tables (fixed order & no circular FK)
-- =========================

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  distance_estimate_m INTEGER,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create menu_images table
-- NOTE: removed ocr_result_id FK to avoid circular dependency.
CREATE TABLE IF NOT EXISTS menu_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  mime TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'ocr_pending', 'ocr_done', 'manual_review', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ocr_results table (references menu_images)
CREATE TABLE IF NOT EXISTS ocr_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES menu_images(id) ON DELETE CASCADE,
  raw_json JSONB NOT NULL,
  text TEXT NOT NULL,
  words JSONB,
  language TEXT NOT NULL DEFAULT 'eng',
  ocr_engine SMALLINT NOT NULL DEFAULT 3,
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_image_id UUID REFERENCES menu_images(id) ON DELETE SET NULL,
  menu_date DATE,
  content JSONB,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create daily_contributions table
CREATE TABLE IF NOT EXISTS daily_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_image_id UUID REFERENCES menu_images(id) ON DELETE CASCADE,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contribution_type TEXT NOT NULL DEFAULT 'upload' CHECK (contribution_type IN ('upload', 'edit', 'verify')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_color TEXT DEFAULT '#DCEB66',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_name)
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  rank_position INTEGER,
  total_karma INTEGER NOT NULL DEFAULT 0,
  weekly_karma INTEGER NOT NULL DEFAULT 0,
  monthly_karma INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Local credential storage for sign-in functionality
-- =========================

-- Create local_credentials table to store hashed credentials for offline sign-in
CREATE TABLE IF NOT EXISTS local_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_hash TEXT NOT NULL UNIQUE, -- Hashed email for security
  password_hash TEXT NOT NULL, -- Hashed password for security
  salt TEXT NOT NULL, -- Salt for password hashing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- =========================
-- Indexes for performance (used by RLS and joins)
-- =========================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name); -- For searching users by name
CREATE INDEX IF NOT EXISTS idx_daily_contributions_user_id ON daily_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_contributions_restaurant_id ON daily_contributions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_images_restaurant_id ON menu_images(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_karma ON leaderboard(total_karma DESC);
CREATE INDEX IF NOT EXISTS idx_local_credentials_user_id ON local_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_local_credentials_email_hash ON local_credentials(email_hash);

-- =========================
-- Seed restaurants (idempotent)
-- =========================
INSERT INTO restaurants (name, location, distance_estimate_m, slug) VALUES
('Fiesta Food Court', 'Near Gate-2', 500, 'fiesta'),
('Magna Food Court', 'Inside GEC-2', 300, 'magna'),
('Enroute Food Court', 'Near Academic Block', 600, 'enroute'),
('Oasis Food Court', 'Near Hostels', 800, 'oasis'),
('Multiplex Food Court', 'Near Recreation Center', 400, 'multiplex'),
('Gazebo Food Court', 'Near ECC', 700, 'gazebo'),
('Maitri Food Court', 'Near Hostels', 900, 'maitri'),
('Arena Food Court', 'Near Multiplex', 750, 'arena'),
('Amoeba Food Court', 'Near GEC-2', 650, 'amoeba'),
('Floating Restaurant', 'Premium Area', 1000, 'floating')
ON CONFLICT (slug) DO NOTHING;

-- =========================
-- Sample user_profiles (for local/dev only)
-- =========================


-- =========================
-- Row Level Security (RLS)
-- =========================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Restaurants: public read; only authenticated can insert/update
DROP POLICY IF EXISTS restaurants_select_public ON restaurants;
CREATE POLICY restaurants_select_public ON restaurants FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS restaurants_insert_auth ON restaurants;
CREATE POLICY restaurants_insert_auth ON restaurants FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS restaurants_update_auth ON restaurants;
CREATE POLICY restaurants_update_auth ON restaurants FOR UPDATE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

-- Menu images: public read; authenticated insert; uploader may update their own
DROP POLICY IF EXISTS menu_images_select_public ON menu_images;
CREATE POLICY menu_images_select_public ON menu_images FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS menu_images_insert_auth ON menu_images;
CREATE POLICY menu_images_insert_auth ON menu_images FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS menu_images_update_owner ON menu_images;
CREATE POLICY menu_images_update_owner ON menu_images FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = uploaded_by);

-- OCR results: public read; authenticated insert
DROP POLICY IF EXISTS ocr_results_select_public ON ocr_results;
CREATE POLICY ocr_results_select_public ON ocr_results FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS ocr_results_insert_auth ON ocr_results;
CREATE POLICY ocr_results_insert_auth ON ocr_results FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Menus: public read; authenticated insert/update
DROP POLICY IF EXISTS menus_select_public ON menus;
CREATE POLICY menus_select_public ON menus FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS menus_insert_auth ON menus;
CREATE POLICY menus_insert_auth ON menus FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS menus_update_auth ON menus;
CREATE POLICY menus_update_auth ON menus FOR UPDATE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

-- User profiles: public read; owners can insert/update their profile
DROP POLICY IF EXISTS user_profiles_select_public ON user_profiles;
CREATE POLICY user_profiles_select_public ON user_profiles FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS user_profiles_insert_owner ON user_profiles;
CREATE POLICY user_profiles_insert_owner ON user_profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS user_profiles_update_owner ON user_profiles;
CREATE POLICY user_profiles_update_owner ON user_profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- User badges: public read; only server/service or authorized roles should insert (we restrict to authenticated here)
DROP POLICY IF EXISTS user_badges_select_public ON user_badges;
CREATE POLICY user_badges_select_public ON user_badges FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS user_badges_insert_auth ON user_badges;
CREATE POLICY user_badges_insert_auth ON user_badges FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Daily contributions: public read; authenticated insert
DROP POLICY IF EXISTS daily_contributions_select_public ON daily_contributions;
CREATE POLICY daily_contributions_select_public ON daily_contributions FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS daily_contributions_insert_auth ON daily_contributions;
CREATE POLICY daily_contributions_insert_auth ON daily_contributions FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- Leaderboard: public read; only authenticated (or service_role) may insert/update leaderboard entries
DROP POLICY IF EXISTS leaderboard_select_public ON leaderboard;
CREATE POLICY leaderboard_select_public ON leaderboard FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS leaderboard_insert_auth ON leaderboard;
CREATE POLICY leaderboard_insert_auth ON leaderboard FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS leaderboard_update_auth ON leaderboard;
CREATE POLICY leaderboard_update_auth ON leaderboard FOR UPDATE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

-- =========================
-- Note: storage.objects/table policies depend on Supabase storage schema existing.
-- Only add storage policies if your Supabase project includes the storage schema (it usually does).
-- If your Supabase project has the storage schema, uncomment and run the following block:

-- DROP POLICY IF EXISTS storage_objects_select_menu_images ON storage.objects;
-- CREATE POLICY storage_objects_select_menu_images ON storage.objects FOR SELECT TO PUBLIC USING (bucket_id = 'menu-images');

-- DROP POLICY IF EXISTS storage_objects_insert_menu_images_auth ON storage.objects;
-- CREATE POLICY storage_objects_insert_menu_images_auth ON storage.objects FOR INSERT TO authenticated WITH CHECK (
--   bucket_id = 'menu-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
-- );

-- DROP POLICY IF EXISTS storage_objects_update_own ON storage.objects;
-- CREATE POLICY storage_objects_update_own ON storage.objects FOR UPDATE TO authenticated USING (
--   bucket_id = 'menu-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
-- );

-- =========================
-- Triggers for updated_at
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_profiles;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =========================
-- Functions: badges, karma, leaderboard
-- =========================

-- Helper: safe_get_karma returns current karma for a user
CREATE OR REPLACE FUNCTION safe_get_karma(user_uuid UUID) RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT COALESCE(karma_points, 0) FROM user_profiles WHERE id = $1;
$$;

-- Award badges function (keeps idempotency)
CREATE OR REPLACE FUNCTION award_badges(user_uuid UUID, contribution_type_param TEXT) RETURNS VOID AS $$
DECLARE
  upload_count INTEGER;
  total_karma INTEGER;
BEGIN
  SELECT COUNT(*) INTO upload_count FROM daily_contributions WHERE user_id = user_uuid AND contribution_type = 'upload';
  SELECT safe_get_karma(user_uuid) INTO total_karma;

  IF upload_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_name = 'First Upload'
  ) THEN
    INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
    VALUES (user_uuid, 'First Upload', 'ri-camera-lens-fill', '#E8F5E9');
  END IF;

  IF upload_count >= 7 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_name = '7 Day Streak'
  ) THEN
    INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
    VALUES (user_uuid, '7 Day Streak', 'ri-fire-fill', '#FFF3E0');
  END IF;

  IF total_karma >= 1000 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_name = 'Mess Legend'
  ) THEN
    INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
    VALUES (user_uuid, 'Mess Legend', 'ri-trophy-fill', '#DCEB66');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Main function to award karma and update leaderboard atomically
CREATE OR REPLACE FUNCTION award_karma_points(user_uuid UUID, points INTEGER, contribution_type_param TEXT) RETURNS VOID AS $$
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
  WHERE id = user_uuid
  RETURNING karma_points INTO new_total;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Upsert leaderboard row
  INSERT INTO leaderboard (user_id, total_karma, weekly_karma, monthly_karma, last_updated)
  VALUES (user_uuid, new_total, points, points, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_karma = EXCLUDED.total_karma,
    weekly_karma = leaderboard.weekly_karma + EXCLUDED.weekly_karma,
    monthly_karma = leaderboard.monthly_karma + EXCLUDED.monthly_karma,
    last_updated = NOW();

  -- Award badges (idempotent)
  PERFORM award_badges(user_uuid, contribution_type_param);
END;
$$ LANGUAGE plpgsql;

-- Update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_rankings() RETURNS VOID AS $$
BEGIN
  UPDATE leaderboard l
  SET rank_position = t.rnk
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_karma DESC, last_updated ASC) AS rnk
    FROM leaderboard
  ) t
  WHERE l.user_id = t.user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for contributions
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

DROP TRIGGER IF EXISTS trigger_award_points ON daily_contributions;
CREATE TRIGGER trigger_award_points
  AFTER INSERT ON daily_contributions
  FOR EACH ROW
  EXECUTE FUNCTION on_contribution_created();

-- =========================
-- Utility function: today's contributors
-- =========================
CREATE OR REPLACE FUNCTION get_today_contributors(restaurant_uuid UUID)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  contribution_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.display_name,
    up.avatar_url,
    dc.created_at
  FROM daily_contributions dc
  JOIN user_profiles up ON dc.user_id = up.id
  WHERE dc.restaurant_id = restaurant_uuid
    AND dc.contribution_date = CURRENT_DATE
    AND dc.contribution_type = 'upload'
  ORDER BY dc.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;
