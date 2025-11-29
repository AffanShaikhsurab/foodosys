const { createClient } = require('@supabase/supabase-js')

const supabase = createClient('https://gzyhcqdgslztzhwqjceh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWhjcWRnc2x6dHpod3FqY2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDk2NDQsImV4cCI6MjA3OTk4NTY0NH0.Qj2DaGScrScagUWV3ujjDMz6yMfVBm8hQEAT7cAw-Pg')

async function test() {
  console.log('=== MENU IMAGES STATUS ===\n')
  
  // Get all menu images
  const { data: allMenus } = await supabase.from('menu_images').select('id, restaurant_id, storage_path, status, created_at').order('created_at', { ascending: false })
  
  console.log('Total menu images in DB:', allMenus?.length)
  
  if (allMenus && allMenus.length > 0) {
    console.log('\nImages in database:')
    allMenus.forEach((m, i) => {
      console.log(`  [${i+1}] Restaurant: ${m.restaurant_id.substring(0, 8)}... Status: ${m.status} Path: ${m.storage_path.substring(0, 50)}`)
    })
    
    // Check storage
    console.log('\nChecking storage for these files...')
    const { data: filesInStorage } = await supabase.storage.from('menu-images').list('', { limit: 100 })
    console.log('Total files in storage:', filesInStorage?.length)
    if (filesInStorage && filesInStorage.length > 0) {
      console.log('Files in storage:')
      filesInStorage.forEach(f => {
        console.log(`  - ${f.name}`)
      })
    }
  }
}

test().catch(console.error)
