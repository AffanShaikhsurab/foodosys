-- ===================================================================
-- ADMIN SYSTEM MIGRATION
-- Adds admin role and permissions for managing content
-- Run this migration in your Supabase SQL editor
-- ===================================================================

-- Step 1: Update user_profiles role constraint to include 'admin'
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('trainee', 'employee', 'admin'));

-- Step 2: Create or update admin credentials table for audit reference (optional)
-- Drop existing table if it doesn't have the email column
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_credentials') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'admin_credentials' 
                   AND column_name = 'email') THEN
      DROP TABLE admin_credentials CASCADE;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on admin_credentials
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin_credentials
DROP POLICY IF EXISTS admin_credentials_admin_only ON admin_credentials;
CREATE POLICY admin_credentials_admin_only ON admin_credentials 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Step 3: Store admin credentials reference
-- Email: admin@foodosys.app
-- Password: FdSys@2025!Adm1n$Secure#Mgmt
-- NOTE: You must create this user manually in Supabase Dashboard or use the script
INSERT INTO admin_credentials (username, email, password_hash)
VALUES (
  'foodosys_admin',
  'admin@foodosys.app',
  crypt('FdSys@2025!Adm1n$Secure#Mgmt', gen_salt('bf', 10))
)
ON CONFLICT (username) DO NOTHING;

-- Step 4: Create helper function to verify admin credentials
CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(is_valid BOOLEAN, admin_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (password_hash = crypt(p_password, password_hash)) AS is_valid,
    id AS admin_id
  FROM admin_credentials
  WHERE username = p_username OR email = p_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update RLS policies for menu_images to allow admin deletion
DROP POLICY IF EXISTS menu_images_delete_admin ON menu_images;
CREATE POLICY menu_images_delete_admin ON menu_images 
FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR uploaded_by = auth.uid()
);

-- Step 7: Update RLS policies for menus to allow admin deletion
DROP POLICY IF EXISTS menus_delete_admin ON menus;
CREATE POLICY menus_delete_admin ON menus 
FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Step 8: Create admin activity log table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('delete_menu', 'delete_image', 'ban_user', 'unban_user')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('menu', 'menu_image', 'user')),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on admin_activity_log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can read and write to activity log
DROP POLICY IF EXISTS admin_log_admin_only ON admin_activity_log;
CREATE POLICY admin_log_admin_only ON admin_activity_log 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Step 9: Create function for admin to delete menu with logging
CREATE OR REPLACE FUNCTION admin_delete_menu(
  p_menu_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  v_admin_id := auth.uid();

  INSERT INTO admin_activity_log (admin_user_id, action_type, target_id, target_type, reason)
  VALUES (v_admin_id, 'delete_menu', p_menu_id, 'menu', p_reason);

  DELETE FROM menus WHERE id = p_menu_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function for admin to delete menu_image with logging
CREATE OR REPLACE FUNCTION admin_delete_menu_image(
  p_image_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
  v_storage_path TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  v_admin_id := auth.uid();

  SELECT storage_path INTO v_storage_path
  FROM menu_images
  WHERE id = p_image_id;

  INSERT INTO admin_activity_log (
    admin_user_id, 
    action_type, 
    target_id, 
    target_type, 
    reason,
    metadata
  )
  VALUES (
    v_admin_id, 
    'delete_image', 
    p_image_id, 
    'menu_image', 
    p_reason,
    jsonb_build_object('storage_path', v_storage_path)
  );

  DELETE FROM menu_images WHERE id = p_image_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user 
ON admin_activity_log(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at 
ON admin_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role);

-- Step 12: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON admin_credentials TO authenticated;
GRANT ALL ON admin_activity_log TO authenticated;

-- ===================================================================
-- TO SET UP AN ADMIN USER (3 OPTIONS):
-- ===================================================================
-- 
-- OPTION 1: Use the Node.js script (EASIEST - RECOMMENDED)
-- ---------------------------------------------------------
-- node scripts/make-admin.js your-email@example.com
--
-- OPTION 2: Manual Setup in Supabase Dashboard
-- ----------------------------------------------
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Enter email: admin@foodosys.app
-- 4. Enter password: FdSys@2025!Adm1n$Secure#Mgmt
-- 5. Click "Create User"
-- 6. Copy the user's UUID
-- 7. Go to SQL Editor and run:
--
--    INSERT INTO user_profiles (user_id, display_name, role)
--    VALUES ('USER_UUID_HERE', 'Admin', 'admin')
--    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
--
-- OPTION 3: Update existing user to admin
-- ----------------------------------------
-- 1. Sign up with your email through the app
-- 2. Get your user UUID from Supabase Dashboard → Authentication → Users
-- 3. Run in SQL Editor:
--
--    UPDATE user_profiles 
--    SET role = 'admin' 
--    WHERE user_id = 'YOUR_USER_UUID_HERE';
--
-- ===================================================================
-- DEFAULT ADMIN CREDENTIALS (if you use Option 2):
-- ===================================================================
-- Email: admin@foodosys.app
-- Password: FdSys@2025!Adm1n$Secure#Mgmt
-- 
-- ⚠️ CHANGE THIS PASSWORD AFTER FIRST LOGIN!
-- ===================================================================
