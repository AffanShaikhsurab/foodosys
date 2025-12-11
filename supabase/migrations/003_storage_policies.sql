-- Migration: Add storage policies for menu-images bucket
-- Created: 2025-11-29
-- Purpose: Fix RLS policy violation for file uploads

-- Storage policies for menu-images bucket
-- Note: Only create these policies if storage schema exists

-- Drop existing policies if they exist (cleanup)
DROP POLICY IF EXISTS storage_objects_select_menu_images ON storage.objects;
DROP POLICY IF EXISTS storage_objects_insert_menu_images_auth ON storage.objects;
DROP POLICY IF EXISTS storage_objects_update_own ON storage.objects;

-- Create new policies
-- Allow public read access to menu images
CREATE POLICY storage_objects_select_menu_images ON storage.objects 
FOR SELECT TO PUBLIC 
USING (bucket_id = 'menu-images');

-- Allow authenticated users to upload files
-- Policy allows users to upload to their own folder (based on auth.uid())
CREATE POLICY storage_objects_insert_menu_images_auth ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'menu-images' 
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Allow users to update their own files
CREATE POLICY storage_objects_update_own ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'menu-images' 
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);