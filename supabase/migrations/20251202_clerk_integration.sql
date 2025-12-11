-- Migration: Update user_profiles table for Clerk integration
-- This migration modifies the user_profiles table to support Clerk user IDs
-- which use a text format (user_xxx) instead of UUID

-- 1. Drop existing foreign key constraint if it exists
-- (This was likely pointing to a Supabase Auth users table)
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- 2. Alter user_id column to text type to support Clerk IDs
-- Clerk user IDs are in format: user_xxx (e.g., user_2abc123def456)
ALTER TABLE user_profiles 
ALTER COLUMN user_id TYPE TEXT;

-- 3. Add index for faster lookups on user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

-- 4. Add a comment for clarity
COMMENT ON COLUMN user_profiles.user_id IS 'Clerk user ID (format: user_xxx)';

-- 5. Optional: Add a check constraint to ensure Clerk ID format
-- Uncomment if you want to enforce the format
-- ALTER TABLE user_profiles 
-- ADD CONSTRAINT check_clerk_user_id_format 
-- CHECK (user_id ~ '^user_[a-zA-Z0-9]+$');
