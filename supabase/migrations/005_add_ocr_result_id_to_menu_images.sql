-- Add ocr_result_id column to menu_images table
-- This column references the OCR result associated with the menu image

-- Add the column as a foreign key to ocr_results table
ALTER TABLE menu_images 
ADD COLUMN IF NOT EXISTS ocr_result_id UUID REFERENCES ocr_results(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_menu_images_ocr_result_id ON menu_images(ocr_result_id);