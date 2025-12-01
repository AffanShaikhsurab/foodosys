/**
 * Admin User Setup Script
 * 
 * This script helps you assign admin role to a user in your Foodosys app.
 * 
 * Usage:
 *   node scripts/make-admin.js <user-email>
 * 
 * Example:
 *   node scripts/make-admin.js admin@example.com
 */

const path = require('path')

// Try loading from .env.local first, then .env
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function makeUserAdmin(userEmail) {
  try {
    console.log(`\n🔍 Looking up user with email: ${userEmail}`)

    // Get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const user = users.find(u => u.email === userEmail)
    
    if (!user) {
      console.error(`❌ Error: User with email ${userEmail} not found`)
      console.log('\nAvailable users:')
      users.forEach(u => console.log(`  - ${u.email} (${u.id})`))
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.email}`)
    console.log(`   User ID: ${user.id}`)

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    if (!profile) {
      console.log(`\n⚠️  Warning: User profile not found. Creating profile...`)
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          display_name: user.email.split('@')[0],
          role: 'admin'
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create profile: ${createError.message}`)
      }

      console.log(`✅ Profile created with admin role`)
      console.log(`   Display name: ${newProfile.display_name}`)
    } else {
      console.log(`✅ User profile found`)
      console.log(`   Current role: ${profile.role}`)

      if (profile.role === 'admin') {
        console.log(`\n✨ User is already an admin!`)
        return
      }

      // Update role to admin
      console.log(`\n🔄 Updating role to admin...`)
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id)

      if (updateError) {
        throw new Error(`Failed to update role: ${updateError.message}`)
      }

      console.log(`✅ Role updated successfully!`)
    }

    console.log(`\n✨ ${user.email} is now an admin!`)
    console.log(`\nAdmin can now:`)
    console.log(`  - Delete any menu image`)
    console.log(`  - Swipe to delete on mobile`)
    console.log(`  - View admin badge on menu cards`)
    console.log(`  - Access admin functions in full-screen viewer`)

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    process.exit(1)
  }
}

// Get email from command line arguments
const userEmail = process.argv[2]

if (!userEmail) {
  console.error('❌ Error: User email is required')
  console.log('\nUsage:')
  console.log('  node scripts/make-admin.js <user-email>')
  console.log('\nExample:')
  console.log('  node scripts/make-admin.js admin@example.com')
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(userEmail)) {
  console.error('❌ Error: Invalid email format')
  process.exit(1)
}

// Run the script
makeUserAdmin(userEmail)
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })
