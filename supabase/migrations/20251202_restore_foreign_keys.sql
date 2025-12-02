-- Migration: Restore foreign key relationships after user_id type change
-- This fixes the relationships between leaderboard/daily_contributions and user_profiles

-- 1. Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS daily_contributions
DROP CONSTRAINT IF EXISTS daily_contributions_user_id_fkey;

ALTER TABLE IF EXISTS leaderboard
DROP CONSTRAINT IF EXISTS leaderboard_user_id_fkey;

ALTER TABLE IF EXISTS user_badges
DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;

-- 2. Re-add foreign key constraints pointing to user_profiles.id
-- Note: These tables store the UUID from user_profiles.id, not the Clerk user_id

ALTER TABLE daily_contributions
ADD CONSTRAINT daily_contributions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE leaderboard
ADD CONSTRAINT leaderboard_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_badges
ADD CONSTRAINT user_badges_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 3. Add helpful comments
COMMENT ON COLUMN daily_contributions.user_id IS 'References user_profiles.id (UUID), not Clerk user_id';
COMMENT ON COLUMN leaderboard.user_id IS 'References user_profiles.id (UUID), not Clerk user_id';
COMMENT ON COLUMN user_badges.user_id IS 'References user_profiles.id (UUID), not Clerk user_id';

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_contributions_user_id ON daily_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
