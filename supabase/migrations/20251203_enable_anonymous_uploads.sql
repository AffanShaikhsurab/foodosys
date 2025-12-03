-- Migration: Enable anonymous menu uploads with incentives to sign up
-- This migration allows anonymous users to upload menu photos while encouraging sign-ups

-- ========================================
-- STEP 1: Add is_anonymous column to menu_images
-- ========================================
ALTER TABLE menu_images ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_menu_images_is_anonymous ON menu_images(is_anonymous);

-- ========================================
-- STEP 2: Update RLS policies to allow anonymous inserts
-- ========================================

-- Drop existing menu_images_insert_auth policy
DROP POLICY IF EXISTS menu_images_insert_auth ON menu_images;

-- Create new policy that allows both authenticated and anonymous users
CREATE POLICY menu_images_insert_all ON menu_images 
  FOR INSERT TO PUBLIC 
  WITH CHECK (
    -- Allow authenticated users (existing behavior)
    (COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    ) IS NOT NULL AND is_anonymous = false)
    OR
    -- Allow anonymous users with is_anonymous flag
    (is_anonymous = true AND uploaded_by IS NULL)
  );

-- ========================================
-- STEP 3: Add anonymous user display name
-- ========================================

-- Add a column to store display name for anonymous posts
ALTER TABLE menu_images ADD COLUMN IF NOT EXISTS anonymous_display_name TEXT;

-- ========================================
-- STEP 4: Update existing records to set is_anonymous flag
-- ========================================

-- Mark all existing records as non-anonymous (they were uploaded by authenticated users)
UPDATE menu_images SET is_anonymous = false WHERE is_anonymous IS NULL;

-- ========================================
-- STEP 5: Add comment for documentation
-- ========================================

COMMENT ON COLUMN menu_images.is_anonymous IS 'Flag to identify anonymous uploads (true = anonymous, false = authenticated user)';
COMMENT ON COLUMN menu_images.anonymous_display_name IS 'Optional display name for anonymous users (future feature)';

-- ========================================
-- STEP 6: Create function to handle anonymous uploads
-- ========================================

CREATE OR REPLACE FUNCTION handle_menu_image_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an anonymous upload, ensure uploaded_by is null
  IF NEW.is_anonymous = true THEN
    NEW.uploaded_by = NULL;
  END IF;
  
  -- Set created_at if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to apply the function
DROP TRIGGER IF EXISTS menu_image_upload_trigger ON menu_images;
CREATE TRIGGER menu_image_upload_trigger
  BEFORE INSERT ON menu_images
  FOR EACH ROW
  EXECUTE FUNCTION handle_menu_image_upload();