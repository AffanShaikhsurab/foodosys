-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies need to be managed through Supabase Dashboard
-- or using the Supabase CLI with proper permissions.
-- For now, the bucket is public for reads and authenticated users
-- can upload through the application layer with Clerk authentication.
