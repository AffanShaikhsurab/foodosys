const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function checkColumnTypes() {
  const { data, error } = await supabase.rpc('check_column_types', {})
  
  if (error) {
    // Try direct query
    const query = `
      SELECT 
        table_name,
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name IN ('daily_contributions', 'leaderboard', 'user_badges', 'user_profiles')
        AND column_name IN ('id', 'user_id')
      ORDER BY table_name, column_name;
    `
    
    console.log('Running query directly via API...')
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ query })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('Column types:')
      console.table(result)
    } else {
      console.error('Query failed:', await response.text())
      
      // Last resort: check each table individually
      console.log('\nChecking tables individually...')
      for (const table of ['daily_contributions', 'leaderboard', 'user_badges', 'user_profiles']) {
        const { data: sample } = await supabase.from(table).select('*').limit(1)
        console.log(`\n${table}:`, sample)
      }
    }
  } else {
    console.log('Column types:')
    console.table(data)
  }
}

checkColumnTypes()
