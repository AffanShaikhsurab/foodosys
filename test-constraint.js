const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConstraint() {
    console.log('🔍 Testing role constraint...')

    // Try to update a user to an invalid role
    // We'll use the admin user ID we found earlier: 6bcc3cba-c3ff-4478-b911-4fb5a7347e48
    // But we should revert it back to 'admin' immediately if it succeeds

    const userId = '6bcc3cba-c3ff-4478-b911-4fb5a7347e48'

    const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'invalid_role_test' })
        .eq('user_id', userId)

    if (error) {
        console.log('✅ Constraint is ACTIVE (Update failed as expected)')
        console.log('Error:', error.message)
    } else {
        console.log('⚠️  Constraint is MISSING (Update succeeded)')

        // Revert
        console.log('Reverting role to admin...')
        await supabase
            .from('user_profiles')
            .update({ role: 'admin' })
            .eq('user_id', userId)
    }
}

testConstraint()
