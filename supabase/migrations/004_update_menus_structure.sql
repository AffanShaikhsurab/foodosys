-- Update menus table to ensure proper structure for storing extracted menu data

-- Add foreign key constraint from menus to menu_images if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'menus_menu_image_id_fkey' 
        AND table_name = 'menus'
    ) THEN
        ALTER TABLE menus 
        ADD CONSTRAINT menus_menu_image_id_fkey 
        FOREIGN KEY (menu_image_id) REFERENCES menu_images(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index on restaurant_id and menu_date for better query performance
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_date ON menus(restaurant_id, menu_date DESC);

-- Add index on menu_image_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_menus_menu_image_id ON menus(menu_image_id);

-- Ensure content column is properly typed as JSONB
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menus' 
        AND column_name = 'content'
        AND data_type != 'jsonb'
    ) THEN
        ALTER TABLE menus ALTER COLUMN content TYPE JSONB USING content::jsonb;
    END IF;
END $$;