/**
 * Apply Clerk integration migrations to Supabase
 * 
 * This script applies the necessary migrations to update your database schema
 * for Clerk integration, specifically changing user_id columns from UUID to TEXT
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Migrations to apply in order
const migrations = [
  '20251202_clerk_integration.sql',
  '20251202_fix_user_id_columns.sql',
  '20251202_clerk_schema_update.sql',
  '20251202_clerk_rls_fix.sql',
]

async function applyMigration(filename) {
  console.log(`\n📝 Applying migration: ${filename}`)
  
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', filename)
  
  if (!fs.existsSync(migrationPath)) {
    console.log(`⚠️  Migration file not found: ${filename}`)
    return false
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8')
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (const statement of statements) {
        const { error } = await supabase.rpc('exec', { sql: statement })
        if (error) throw error
      }
    })
    
    if (error) {
      console.error(`❌ Error applying migration ${filename}:`, error.message)
      return false
    }
    
    console.log(`✅ Successfully applied: ${filename}`)
    return true
  } catch (error) {
    console.error(`❌ Error applying migration ${filename}:`, error.message)
    console.log('\n💡 You may need to run this SQL manually in the Supabase SQL Editor')
    return false
  }
}

async function main() {
  console.log('🚀 Starting Clerk integration migrations...')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  
  let successCount = 0
  
  for (const migration of migrations) {
    const success = await applyMigration(migration)
    if (success) successCount++
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`✨ Migration Summary: ${successCount}/${migrations.length} successful`)
  
  if (successCount < migrations.length) {
    console.log('\n⚠️  Some migrations failed. Please apply them manually:')
    console.log('   1. Go to your Supabase Dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Copy and paste the SQL from the migration files')
    console.log('   4. Execute each migration in order')
  } else {
    console.log('\n✅ All migrations applied successfully!')
    console.log('   Your database is now ready for Clerk integration')
  }
}

main().catch(console.error)
