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
        console.log('Running OCR result ID migration...')

        // Read and display the migration SQL
        const fs = require('fs')
        const path = require('path')
        const migrationPath = path.join(__dirname, '../supabase/migrations/005_add_ocr_result_id_to_menu_images.sql')
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

        console.log('\n=== MIGRATION SQL ===')
        console.log(migrationSQL)
        console.log('=== END MIGRATION SQL ===\n')

        console.log('Please run the above SQL manually in your Supabase SQL Editor:')
        console.log('1. Go to https://supabase.com/dashboard/project/muqwcdljrixnhdtlxfwn/sql/new')
        console.log('2. Copy and paste the SQL above')
        console.log('3. Click "Run" to execute the migration')
        console.log('\nThis will add the ocr_result_id column to the menu_images table.')

    } catch (error) {
        console.error('Error reading migration:', error)
        process.exit(1)
    }
}

runMigration()
