-- Migration: Fix remaining user_id columns to TEXT type for Clerk integration
-- This migration updates any remaining user_id columns that are still UUID type

-- 1. Fix daily_contributions table user_id column
ALTER TABLE daily_contributions 
ALTER COLUMN user_id TYPE TEXT;

-- 2. Fix user_badges table user_id column  
ALTER TABLE user_badges 
ALTER COLUMN user_id TYPE TEXT;

-- 3. Fix leaderboard table user_id column
ALTER TABLE leaderboard 
ALTER COLUMN user_id TYPE TEXT;

-- 4. Fix local_credentials table user_id column
ALTER TABLE local_credentials 
ALTER COLUMN user_id TYPE TEXT;

-- 5. Fix admin_activity_log table admin_user_id column (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'admin_activity_log' 
        AND column_name = 'admin_user_id'
    ) THEN
        ALTER TABLE admin_activity_log 
        ALTER COLUMN admin_user_id TYPE TEXT;
    END IF;
END $$;

-- 6. Update foreign key constraints to remove references to auth.users since we're using Clerk
-- Note: We're keeping the user_profiles table as the central user reference

-- 7. Add comments for clarity
COMMENT ON COLUMN daily_contributions.user_id IS 'Clerk user ID (format: user_xxx)';
COMMENT ON COLUMN user_badges.user_id IS 'Clerk user ID (format: user_xxx)';
COMMENT ON COLUMN leaderboard.user_id IS 'Clerk user ID (format: user_xxx)';
COMMENT ON COLUMN local_credentials.user_id IS 'Clerk user ID (format: user_xxx)';