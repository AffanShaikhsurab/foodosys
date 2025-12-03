const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySchema() {
    console.log('🔍 Verifying user_profiles schema...')

    // Check if we can select from the table
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)

    if (error) {
        console.error('❌ Error accessing user_profiles:', error.message)
        return
    }

    console.log('✅ user_profiles table is accessible')

    // We can't easily check column types via JS client without using RPC to query information_schema
    // But we can check if we can insert a test record with the expected fields if the table is empty
    // Or just rely on the fact that the select worked, meaning the table exists.

    // Let's try to inspect the error if we select a non-existent column to see if it complains
    const { error: colError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, role, dietary_preference, avatar_url')
        .limit(1)

    if (colError) {
        console.error('❌ Column verification failed:', colError.message)
    } else {
        console.log('✅ Expected columns exist (user_id, display_name, role, dietary_preference, avatar_url)')
    }
}

verifySchema()
