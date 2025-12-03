const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gzyhcqdgslztzhwqjceh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWhjcWRnc2x6dHpod3FqY2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDk2NDQsImV4cCI6MjA3OTk4NTY0NH0.Qj2DaGScrScagUWV3ujjDMz6yMfVBm8hQEAT7cAw-Pg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContributors() {
  console.log('=== CHECKING CONTRIBUTORS IN MENU_IMAGES ===\n')
  
  // Get all menu images with contributor info
  const { data: menuImages, error } = await supabase
    .from('menu_images')
    .select('id, restaurant_id, uploaded_by, is_anonymous, anonymous_display_name, created_at')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching menu images:', error)
    return
  }
  
  console.log(`Total menu images: ${menuImages?.length || 0}\n`)
  
  if (menuImages && menuImages.length > 0) {
    console.log('Recent uploads:')
    menuImages.forEach((img, i) => {
      console.log(`[${i+1}] ID: ${img.id.substring(0, 8)}...`)
      console.log(`    Restaurant: ${img.restaurant_id.substring(0, 8)}...`)
      console.log(`    Uploaded by: ${img.uploaded_by || 'NULL'}`)
      console.log(`    Is anonymous: ${img.is_anonymous}`)
      console.log(`    Anonymous display name: ${img.anonymous_display_name || 'NULL'}`)
      console.log(`    Created: ${img.created_at}`)
      console.log('')
    })
  }
  
  // Check user_profiles table
  console.log('\n=== CHECKING USER_PROFILES ===\n')
  const { data: userProfiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .limit(10)
  
  if (profileError) {
    console.error('Error fetching user profiles:', profileError)
    return
  }
  
  console.log(`Total user profiles: ${userProfiles?.length || 0}\n`)
  
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

checkContributors().catch(console.error)