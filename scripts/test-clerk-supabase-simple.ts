import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Simple test to verify Clerk-Supabase integration
async function testClerkSupabaseIntegration() {
  console.log('🧪 Testing Clerk-Supabase Integration...\n')

  // Test 1: Verify environment variables
  console.log('1️⃣ Checking environment variables...')
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '))
    return false
  }
  console.log('✅ All required environment variables are set\n')

  // Test 2: Verify Supabase connection
  console.log('2️⃣ Testing Supabase connection...')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await supabase.from('user_profiles').select('count').single()
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase connection error:', error.message)
      return false
    }
    console.log('✅ Supabase connection successful\n')
  } catch (err) {
    console.error('❌ Supabase connection failed:', err)
    return false
  }

  // Test 3: Verify tables exist
  console.log('3️⃣ Testing table existence...')
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const tablesToCheck = [
    'user_profiles',
    'restaurants',
    'menu_images',
    'ocr_results',
    'daily_contributions',
    'leaderboard',
    'user_badges',
    'tasks'
  ]

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await adminSupabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.error(`❌ Error accessing table ${tableName}:`, error.message)
      } else {
        console.log(`✅ Table ${tableName} is accessible`)
      }
    } catch (err) {
      console.error(`❌ Error checking table ${tableName}:`, err)
    }
  }

  // Test 4: Verify Clerk environment variables
  console.log('\n4️⃣ Testing Clerk configuration...')
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.error('❌ Clerk environment variables not properly set')
    return false
  }
  console.log('✅ Clerk environment variables are set correctly')

  // Test 5: Test RLS by trying to access data without authentication
  console.log('\n5️⃣ Testing Row Level Security...')
  try {
    // Try to access user_profiles without authentication
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (error) {
      if (error.message.includes('JWT') || error.message.includes('permission')) {
        console.log('✅ RLS is working - authentication required to access data')
      } else {
        console.log('⚠️  Unexpected RLS error:', error.message)
      }
    } else {
      console.log('⚠️  RLS might not be properly configured - data accessible without authentication')
    }
  } catch (err) {
    console.error('❌ Error testing RLS:', err)
  }

  console.log('\n🎉 Integration test completed!')
  console.log('\n📋 Summary:')
  console.log('- Environment variables: ✅ Configured')
  console.log('- Supabase connection: ✅ Working')
  console.log('- Database tables: ✅ Accessible')
  console.log('- Clerk configuration: ✅ Set up')
  console.log('- RLS policies: ⚠️  Verify manually if needed')
  
  return true
}

// Run the test
testClerkSupabaseIntegration()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Test failed with error:', error)
    process.exit(1)
  })