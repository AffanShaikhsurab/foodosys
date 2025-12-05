-- Fix Leaderboard Rankings
-- This script will:
-- 1. Ensure all users with karma have leaderboard entries
-- 2. Update all rank positions based on total_karma
-- 3. Reset weekly/monthly karma if needed

-- Step 1: Ensure all users with karma_points > 0 have leaderboard entries
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
  total_karma = EXCLUDED.total_karma,
  last_updated = NOW();

-- Step 2: Update all rank positions based on total_karma
UPDATE leaderboard l
SET rank_position = t.rnk
FROM (
  SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_karma DESC, last_updated ASC) AS rnk
  FROM leaderboard
  WHERE total_karma > 0
) t
WHERE l.user_id = t.user_id;

-- Step 3: Verify the results
SELECT 
  l.rank_position,
  l.total_karma,
  l.weekly_karma,
  l.monthly_karma,
  up.display_name,
  up.karma_points
FROM leaderboard l
JOIN user_profiles up ON l.user_id = up.id
WHERE l.total_karma > 0
ORDER BY l.rank_position ASC
LIMIT 20;
