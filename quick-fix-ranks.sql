-- Quick Fix for Null Rank Positions in Leaderboard
-- Run this directly in Supabase SQL Editor

-- Step 1: Update rank positions for ALL users in leaderboard
UPDATE leaderboard l
SET rank_position = t.rnk
FROM (
  SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_karma DESC, last_updated ASC) AS rnk
  FROM leaderboard
) t
WHERE l.user_id = t.user_id;

-- Step 2: Verify the results
SELECT 
  l.rank_position,
  l.total_karma,
  up.display_name
FROM leaderboard l
JOIN user_profiles up ON l.user_id = up.id
ORDER BY l.rank_position ASC NULLS LAST
LIMIT 20;
