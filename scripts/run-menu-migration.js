const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Running menu structure migration...')
    
    // Since we can't execute arbitrary SQL via the client, we'll use the Supabase Dashboard approach
    // For now, let's check if the menus table has the correct structure
    console.log('Checking current menus table structure...')
    
    // Check if the content column is JSONB
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'menus')
      .eq('column_name', 'content')
    
    if (columnError) {
      console.error('Error checking column structure:', columnError)
      console.log('\nNOTE: Please run the following SQL manually in your Supabase SQL Editor:')
      console.log('--- COPY BELOW ---')
      
      // Read and display the migration SQL
      const fs = require('fs')
      const path = require('path')
      const migrationPath = path.join(__dirname, '../supabase/migrations/004_update_menus_structure.sql')
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      
      console.log(migrationSQL)
      console.log('--- COPY ABOVE ---')
      process.exit(1)
    }
    
    console.log('Current menus table structure checked.')
    console.log('If you need to apply the migration, please run the SQL manually in Supabase SQL Editor.')
    console.log('Migration script completed with manual instructions.')
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

runMigration()