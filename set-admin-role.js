const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function setAdminRole() {
    const email = 'admin@foodosys.app'
    console.log(`🔍 Finding user with email: ${email}`)

    // 1. Find user in auth.users (requires service role)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
        console.error('❌ Error listing users:', userError.message)
        return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error('❌ User not found in auth.users')
        return
    }

    console.log(`✅ Found user: ${user.id}`)

    // 2. Update user_profiles
    console.log(`📝 Updating user_profiles for ${user.id}...`)

    // First, check if we can even select the profile
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('❌ Error fetching profile:', profileError.message)
        return
    }

    if (!profile) {
        console.log('ℹ️  Profile not found, creating one...')
        const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
                user_id: user.id,
                display_name: 'Admin User',
                role: 'admin',
                dietary_preference: 'vegetarian'
            })

        if (insertError) {
            console.error('❌ Error creating profile:', insertError.message)
        } else {
            console.log('✅ Profile created with admin role')
        }
    } else {
        console.log('ℹ️  Profile found, updating role...')
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ role: 'admin' })
            .eq('user_id', user.id)

        if (updateError) {
            console.error('❌ Error updating profile:', updateError.message)
        } else {
            console.log('✅ Profile updated to admin role')
        }
    }
}

setAdminRole()
