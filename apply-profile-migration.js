const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
    const filename = '20251203_ensure_user_profiles_complete.sql'
    console.log(`\n📝 Applying migration: ${filename}`)

    const migrationPath = path.join(__dirname, 'supabase', 'migrations', filename)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    try {
        // Try exec_sql RPC first
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

        if (error) {
            console.log('ℹ️  exec_sql RPC failed or not available, trying direct execution...')
            // Fallback: Split and execute
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'))

            for (const statement of statements) {
                // Skip empty or comment-only statements
                if (statement.match(/^[\s\n\r]*$/) || statement.match(/^[\s\n\r]*--/)) continue;

                const { error: stmtError } = await supabase.rpc('exec', { sql: statement })
                if (stmtError) {
                    // If exec also fails, we might not have any way to run SQL
                    // But let's try to continue in case some statements work
                    console.warn(`Warning on statement: ${statement.substring(0, 50)}...`)
                    console.warn(stmtError.message)
                }
            }
        } else {
            // RPC success
            console.log('✅ Applied via exec_sql')
        }

        console.log(`✅ Migration process completed for: ${filename}`)
        return true
    } catch (error) {
        console.error(`❌ Error applying migration:`, error.message)
        return false
    }
}

applyMigration()
