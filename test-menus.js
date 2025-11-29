const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gzyhcqdgslztzhwqjceh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWhjcWRnc2x6dHpod3FqY2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDk2NDQsImV4cCI6MjA3OTk4NTY0NH0.Qj2DaGScrScagUWV3ujjDMz6yMfVBm8hQEAT7cAw-Pg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Testing menu retrieval...')
  
  // Get restaurants
  const { data: restaurants, error: rError } = await supabase.from('restaurants').select('*')
  console.log('Restaurants:', restaurants)
  if (rError) console.error('Error:', rError)
  
  // Get menu images
  const { data: menus, error: mError } = await supabase.from('menu_images').select('*')
  console.log('Menu Images:', menus)
  if (mError) console.error('Error:', mError)
  
  // Get specific restaurant menus
  if (restaurants && restaurants.length > 0) {
    const restaurant = restaurants[0]
    console.log(`\nMenus for ${restaurant.name}:`)
    const { data: restMenus, error: restError } = await supabase
      .from('menu_images')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .in('status', ['ocr_done', 'ocr_pending'])
    
    console.log('Found menus:', restMenus)
    if (restError) console.error('Error:', restError)
  }
}

test().catch(console.error)
