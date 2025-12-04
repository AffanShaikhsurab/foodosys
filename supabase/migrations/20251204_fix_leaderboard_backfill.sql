-- =========================================
-- Complete Leaderboard and Karma Fix
-- =========================================
-- This migration ensures that:
-- 1. All users who uploaded photos get karma properly
-- 2. Leaderboard entries are created for all users with contributions
-- 3. Rank positions are calculated correctly
-- 4. Weekly and monthly karma is tracked accurately

-- First, let's check if karma_transactions table exists
-- If not, we need to backfill karma for existing uploads

-- Step 1: Ensure all users who uploaded photos have user_profiles entries
-- (This should already be handled by the webhook, but let's be safe)

-- Step 2: Backfill karma for users who uploaded photos but don't have karma
DO $$
DECLARE
  upload_record RECORD;
  user_profile_id UUID;
  karma_awarded INTEGER;
BEGIN
  -- Loop through all menu images that have uploaded_by set
  FOR upload_record IN 
    SELECT DISTINCT mi.uploaded_by, mi.id as image_id, mi.created_at
    FROM menu_images mi
    WHERE mi.uploaded_by IS NOT NULL
    AND mi.is_anonymous = FALSE
    ORDER BY mi.created_at ASC
  LOOP
    -- Get the user_profile_id for this clerk user_id
    SELECT id INTO user_profile_id
    FROM user_profiles
    WHERE user_id = upload_record.uploaded_by;
    
    -- If user profile exists, check if they have karma for this upload
    IF user_profile_id IS NOT NULL THEN
      -- Check if karma transaction already exists for this image
      IF NOT EXISTS (
        SELECT 1 FROM karma_transactions 
        WHERE user_id = user_profile_id 
        AND related_image_id = upload_record.image_id
      ) THEN
        -- Award base karma (10 points) for this upload
        INSERT INTO karma_transactions (user_id, points, transaction_type, reason, related_image_id, created_at)
        VALUES (user_profile_id, 10, 'upload', 'Photo upload', upload_record.image_id, upload_record.created_at);
        
        -- Update user's total karma
        UPDATE user_profiles
        SET 
          karma_points = karma_points + 10,
          level = CASE
            WHEN karma_points + 10 >= 2000 THEN 5
            WHEN karma_points + 10 >= 1500 THEN 4
            WHEN karma_points + 10 >= 1000 THEN 3
            WHEN karma_points + 10 >= 500 THEN 2
            ELSE 1
          END,
          updated_at = NOW()
        WHERE id = user_profile_id;
        
        RAISE NOTICE 'Awarded 10 karma to user % for image %', user_profile_id, upload_record.image_id;
      END IF;
    ELSE
      RAISE NOTICE 'User profile not found for clerk user %', upload_record.uploaded_by;
    END IF;
  END LOOP;
END $$;

-- Step 3: Create or update leaderboard entries for all users with karma
INSERT INTO leaderboard (user_id, total_karma, weekly_karma, monthly_karma, last_updated)
SELECT 
  up.id,
  up.karma_points,
  COALESCE((
    SELECT SUM(kt.points)
    FROM karma_transactions kt
    WHERE kt.user_id = up.id
    AND kt.created_at >= CURRENT_DATE - INTERVAL '7 days'
  ), 0)::INTEGER,
  COALESCE((
    SELECT SUM(kt.points)
    FROM karma_transactions kt
    WHERE kt.user_id = up.id
    AND kt.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ), 0)::INTEGER,
  NOW()
FROM user_profiles up
WHERE up.karma_points > 0
ON CONFLICT (user_id) DO UPDATE
SET 
  total_karma = (SELECT karma_points FROM user_profiles WHERE id = EXCLUDED.user_id),
  weekly_karma = (
    SELECT COALESCE(SUM(kt.points), 0)::INTEGER
    FROM karma_transactions kt
    WHERE kt.user_id = EXCLUDED.user_id
    AND kt.created_at >= CURRENT_DATE - INTERVAL '7 days'
  ),
  monthly_karma = (
    SELECT COALESCE(SUM(kt.points), 0)::INTEGER
    FROM karma_transactions kt
    WHERE kt.user_id = EXCLUDED.user_id
    AND kt.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ),
  last_updated = NOW();

-- Step 4: Update rank positions for all leaderboard entries
UPDATE leaderboard l
SET rank_position = t.rnk
FROM (
  SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_karma DESC, last_updated ASC) AS rnk
  FROM leaderboard
) t
WHERE l.user_id = t.user_id;

-- Step 5: Verify the fix
SELECT 
  l.rank_position,
  l.total_karma,
  l.weekly_karma,
  l.monthly_karma,
  up.display_name,
  up.karma_points as profile_karma,
  (SELECT COUNT(*) FROM karma_transactions WHERE user_id = up.id) as transaction_count
FROM leaderboard l
JOIN user_profiles up ON l.user_id = up.id
ORDER BY l.rank_position ASC NULLS LAST
LIMIT 20;
