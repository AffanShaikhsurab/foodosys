-- Migration: Add 'admin' to allowed roles in user_profiles
-- This migration updates the check constraint for the role column

DO $$
BEGIN
    -- Drop the existing constraint
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_profiles_role_check' AND table_name = 'user_profiles') THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_role_check;
    END IF;

    -- Add the new constraint including 'admin'
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('trainee', 'employee', 'admin'));
    
    -- Also update the comment if possible (optional)
    COMMENT ON COLUMN user_profiles.role IS 'User role: trainee, employee, or admin';
    
END $$;
