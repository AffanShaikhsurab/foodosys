-- Migration: Add 'admin' to allowed roles in user_profiles
-- Simplified to avoid DO blocks which might fail in some RPC implementations

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('trainee', 'employee', 'admin'));

COMMENT ON COLUMN user_profiles.role IS 'User role: trainee, employee, or admin';
