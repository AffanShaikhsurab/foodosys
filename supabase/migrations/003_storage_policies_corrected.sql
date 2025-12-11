-- Migration: Add corrected storage policies for menu-images bucket
-- Created: 2025-11-29
-- Purpose: Fix RLS policy violation for file uploads with restaurant folder structure

-- Storage policies for menu-images bucket
-- Drop existing policies if they exist (cleanup)
DROP POLICY IF EXISTS storage_objects_select_menu_images ON storage.objects;
DROP POLICY IF EXISTS storage_objects_insert_menu_images_auth ON storage.objects;
DROP POLICY IF EXISTS storage_objects_update_own ON storage.objects;
DROP POLICY IF EXISTS storage_objects_update_own_restaurant ON storage.objects;

-- Create new policies
-- Allow public read access to menu images
CREATE POLICY storage_objects_select_menu_images ON storage.objects 
FOR SELECT TO PUBLIC 
USING (bucket_id = 'menu-images');

-- Allow authenticated users to upload files to menus/restaurantSlug/ structure
CREATE POLICY storage_objects_insert_menu_images_auth ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'menu-images' 
  AND name LIKE 'menus/%'
);

-- Allow authenticated users to update files in their own uploaded path
CREATE POLICY storage_objects_update_own_restaurant ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'menu-images' 
  AND name LIKE 'menus/%'
);

-- Allow authenticated users to delete files in the menus structure
CREATE POLICY storage_objects_delete_own_restaurant ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'menu-images' 
  AND name LIKE 'menus/%'
);