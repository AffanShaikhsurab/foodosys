-- Add photo_taken_at column to menu_images table
ALTER TABLE menu_images 
ADD COLUMN IF NOT EXISTS photo_taken_at TIMESTAMP WITH TIME ZONE;

-- Comment on column
COMMENT ON COLUMN menu_images.photo_taken_at IS 'Timestamp when the photo was taken, used for determining meal time (breakfast/lunch/dinner)';
