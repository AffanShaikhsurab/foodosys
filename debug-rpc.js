const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugRpc() {
    console.log('🔍 Testing exec_sql RPC...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' })

    if (error) {
        console.error('❌ exec_sql failed:', error.message)
        console.error('Error details:', error)
    } else {
        console.log('✅ exec_sql worked!')
    }

    console.log('\n🔍 Testing exec RPC...')
    const { data: data2, error: error2 } = await supabase.rpc('exec', { sql: 'SELECT 1' })

    if (error2) {
        console.error('❌ exec failed:', error2.message)
    } else {
        console.log('✅ exec worked!')
    }
}

debugRpc()
