const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gzyhcqdgslztzhwqjceh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWhjcWRnc2x6dHpod3FqY2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDk2NDQsImV4cCI6MjA3OTk4NTY0NH0.Qj2DaGScrScagUWV3ujjDMz6yMfVBm8hQEAT7cAw-Pg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  console.log('=== CHECKING MENU_IMAGES TABLE STRUCTURE ===\n')
  
  // Get all menu images without specifying columns to see what's available
  const { data: menuImages, error } = await supabase
    .from('menu_images')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error fetching menu images:', error)
    return
  }
  
  if (menuImages && menuImages.length > 0) {
    console.log('Columns in menu_images table:')
    Object.keys(menuImages[0]).forEach(key => {
      console.log(`  - ${key}: ${menuImages[0][key]}`)
    })
  } else {
    console.log('No data in menu_images table')
  }
  
  // Check user_profiles table structure
  console.log('\n=== CHECKING USER_PROFILES TABLE STRUCTURE ===\n')
  const { data: userProfiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
  
  if (profileError) {
    console.error('Error fetching user profiles:', profileError)
    return
  }
  
  if (userProfiles && userProfiles.length > 0) {
    console.log('Columns in user_profiles table:')
    Object.keys(userProfiles[0]).forEach(key => {
      console.log(`  - ${key}: ${userProfiles[0][key]}`)
    })
  } else {
    console.log('No data in user_profiles table')
  }
}

checkTableStructure().catch(console.error)