const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function checkConstraints() {
  console.log('Checking foreign key constraints...\n')

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('leaderboard', 'daily_contributions', 'user_badges')
      ORDER BY tc.table_name, kcu.column_name;
    `
  })

  if (error) {
    console.error('Error:', error)
    
    // Try alternative method
    console.log('\nTrying alternative query...')
    const { data: alt, error: altError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          conrelid::regclass AS table_name,
          conname AS constraint_name,
          pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid::regclass::text IN ('leaderboard', 'daily_contributions', 'user_badges')
        ORDER BY table_name;
      `
    })
    
    if (altError) {
      console.error('Alt Error:', altError)
    } else {
      console.log('Constraints:', JSON.stringify(alt, null, 2))
    }
  } else {
    console.log('Constraints:', JSON.stringify(data, null, 2))
  }
}

checkConstraints().catch(console.error)
