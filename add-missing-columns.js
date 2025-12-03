const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gzyhcqdgslztzhwqjceh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWhjcWRnc2x6dHpod3FqY2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDk2NDQsImV4cCI6MjA3OTk4NTY0NH0.Qj2DaGScrScagUWV3ujjDMz6yMfVBm8hQEAT7cAw-Pg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addMissingColumns() {
  console.log('Adding missing columns to menu_images table...\n')
  
  // Note: We can't alter tables with the anon key, but we can check what's missing
  // and provide the SQL that needs to be run manually
  
  console.log('=== SQL TO RUN MANUALLY ===\n')
  
  console.log('-- Add is_anonymous column to menu_images')
  console.log('ALTER TABLE menu_images ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;')
  console.log('')
  
  console.log('-- Add anonymous_display_name column to menu_images')
  console.log('ALTER TABLE menu_images ADD COLUMN IF NOT EXISTS anonymous_display_name TEXT;')
  console.log('')
  
  console.log('-- Update existing records to set is_anonymous flag')
  console.log('UPDATE menu_images SET is_anonymous = false WHERE is_anonymous IS NULL;')
  console.log('')
  
  console.log('-- Add index for performance')
  console.log('CREATE INDEX IF NOT EXISTS idx_menu_images_is_anonymous ON menu_images(is_anonymous);')
  console.log('')
  
  // Check current data
  console.log('\n=== CURRENT MENU_IMAGES DATA ===\n')
  const { data: menuImages, error } = await supabase
    .from('menu_images')
    .select('id, restaurant_id, uploaded_by, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching menu images:', error)
    return
  }
  
  if (menuImages && menuImages.length > 0) {
    console.log('Recent uploads:')
    menuImages.forEach((img, i) => {
      console.log(`[${i+1}] ID: ${img.id.substring(0, 8)}...`)
      console.log(`    Restaurant: ${img.restaurant_id.substring(0, 8)}...`)
      console.log(`    Uploaded by: ${img.uploaded_by || 'NULL'}`)
      console.log(`    Created: ${img.created_at}`)
      console.log('')
    })
  }
  
  // Check user_profiles
  console.log('\n=== USER_PROFILES DATA ===\n')
  const { data: userProfiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .limit(5)
  
  if (profileError) {
    console.error('Error fetching user profiles:', profileError)
    return
  }
  
  if (userProfiles && userProfiles.length > 0) {
    console.log('Sample user profiles:')
    userProfiles.forEach((profile, i) => {
      console.log(`[${i+1}] User ID: ${profile.user_id}`)
      console.log(`    Display name: ${profile.display_name}`)
      console.log(`    Avatar URL: ${profile.avatar_url || 'NULL'}`)
      console.log('')
    })
  }
}

addMissingColumns().catch(console.error)