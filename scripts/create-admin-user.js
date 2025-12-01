/**
 * Create Admin User Script
 * 
 * This script creates an admin user in Supabase Auth and assigns admin role.
 * 
 * Usage:
 *   node scripts/create-admin-user.js
 * 
 * Or with custom credentials:
 *   node scripts/create-admin-user.js admin@example.com MyPassword123!
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

// Default admin credentials
const DEFAULT_EMAIL = 'admin@foodosys.app'
const DEFAULT_PASSWORD = 'FdSys@2025!Adm1n$Secure#Mgmt'

async function createAdminUser(email, password) {
  try {
    console.log('\n🚀 Creating admin user...')
    console.log(`   Email: ${email}`)

    // Check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const existingUser = users.find(u => u.email === email)
    
    if (existingUser) {
      console.log(`\n⚠️  User with email ${email} already exists`)
      console.log(`   User ID: ${existingUser.id}`)
      
      // Update their role to admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', existingUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`)
      }

      if (!profile) {
        console.log(`\n📝 Creating user profile...`)
        
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: existingUser.id,
            display_name: 'Admin',
            role: 'admin'
          })

        if (createError) {
          throw new Error(`Failed to create profile: ${createError.message}`)
        }

        console.log(`✅ Profile created with admin role`)
      } else if (profile.role !== 'admin') {
        console.log(`\n🔄 Updating role to admin...`)
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'admin' })
          .eq('user_id', existingUser.id)

        if (updateError) {
          throw new Error(`Failed to update role: ${updateError.message}`)
        }

        console.log(`✅ Role updated to admin`)
      } else {
        console.log(`\n✅ User is already an admin!`)
      }

      console.log(`\n✨ Admin user is ready!`)
      console.log(`\nLogin with:`)
      console.log(`   Email: ${email}`)
      console.log(`   Password: [your existing password]`)
      return
    }

    // Create new user
    console.log(`\n👤 Creating new user in Supabase Auth...`)
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        display_name: 'Admin'
      }
    })

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    console.log(`✅ User created successfully`)
    console.log(`   User ID: ${authData.user.id}`)

    // Create user profile with admin role
    console.log(`\n📝 Creating user profile with admin role...`)
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        display_name: 'Admin',
        role: 'admin',
        dietary_preference: 'vegetarian'
      })

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    console.log(`✅ Profile created successfully`)

    console.log(`\n✨ Admin user created successfully!`)
    console.log(`\n📧 Login credentials:`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`\n⚠️  IMPORTANT: Change this password after first login!`)
    console.log(`\n🎉 You can now sign in and access admin features:`)
    console.log(`   - Delete any menu image`)
    console.log(`   - Swipe to delete on mobile`)
    console.log(`   - View admin badge on menu cards`)

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    console.error(`\nTroubleshooting:`)
    console.error(`  1. Make sure you've run the database migration (006_admin_system.sql)`)
    console.error(`  2. Check that user_profiles table has 'admin' in role constraint`)
    console.error(`  3. Verify SUPABASE_SERVICE_ROLE_KEY is correct in .env file`)
    process.exit(1)
  }
}

// Get credentials from command line or use defaults
const email = process.argv[2] || DEFAULT_EMAIL
const password = process.argv[3] || DEFAULT_PASSWORD

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format')
  console.log('\nUsage:')
  console.log('  node scripts/create-admin-user.js [email] [password]')
  console.log('\nExamples:')
  console.log('  node scripts/create-admin-user.js')
  console.log('  node scripts/create-admin-user.js admin@example.com MyPassword123!')
  process.exit(1)
}

// Validate password strength
if (password.length < 8) {
  console.error('❌ Error: Password must be at least 8 characters long')
  process.exit(1)
}

console.log('═══════════════════════════════════════════════════')
console.log('           FOODOSYS ADMIN USER SETUP              ')
console.log('═══════════════════════════════════════════════════')

// Run the script
createAdminUser(email, password)
  .then(() => {
    console.log('\n✅ Setup complete!')
    console.log('═══════════════════════════════════════════════════\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })
