const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function test() {
  console.log('Testing database schema...\n')

  // Test user_profiles
  console.log('1. Testing user_profiles table:')
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, user_id, display_name')
    .limit(2)
  
  if (profileError) {
    console.error('Error:', profileError)
  } else {
    console.log('Profiles:', JSON.stringify(profiles, null, 2))
  }

  // Test daily_contributions structure
  console.log('\n2. Testing daily_contributions structure:')
  const { data: contributions, error: contribError } = await supabase
    .from('daily_contributions')
    .select('*')
    .limit(2)
  
  if (contribError) {
    console.error('Error:', contribError)
  } else {
    console.log('Contributions:', JSON.stringify(contributions, null, 2))
  }

  // Test leaderboard structure
  console.log('\n3. Testing leaderboard structure:')
  const { data: leaderboard, error: leaderError } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(2)
  
  if (leaderError) {
    console.error('Error:', leaderError)
  } else {
    console.log('Leaderboard:', JSON.stringify(leaderboard, null, 2))
  }

  // Test leaderboard with join
  console.log('\n4. Testing leaderboard with user_profiles join:')
  const { data: leaderboardJoin, error: joinError } = await supabase
    .from('leaderboard')
    .select(`
      *,
      user_profiles!inner(
        display_name,
        avatar_url,
        level
      )
    `)
    .limit(2)
  
  if (joinError) {
    console.error('Error:', joinError)
  } else {
    console.log('Leaderboard with join:', JSON.stringify(leaderboardJoin, null, 2))
  }
}

test().catch(console.error)
