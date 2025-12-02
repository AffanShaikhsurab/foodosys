const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251202_restore_foreign_keys.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('Applying migration: 20251202_restore_foreign_keys.sql')
    console.log('---')

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      console.log(`\nExecuting: ${statement.substring(0, 100)}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement
      })

      if (error) {
        console.error('Error:', error)
        // Continue with other statements
      } else {
        console.log('✓ Success')
      }
    }

    console.log('\n---')
    console.log('Migration completed!')
    
    // Verify the foreign keys
    console.log('\nVerifying foreign keys...')
    const { data: fks, error: fkError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          conrelid::regclass AS table_name,
          conname AS constraint_name
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid::regclass::text IN ('leaderboard', 'daily_contributions', 'user_badges')
        ORDER BY table_name;
      `
    })

    if (fkError) {
      console.error('Verification error:', fkError)
    } else {
      console.log('Foreign keys:', JSON.stringify(fks, null, 2))
    }

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

applyMigration()
