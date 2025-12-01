/**
 * Image Deletion Debug Script
 * Run: node scripts/debug-image-deletion.js
 * Purpose: Test and debug admin image deletion functionality
 */

const { createClient } = require('@supabase/supabase-js')

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzyhcqdgslztzhwqjceh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔍 Image Deletion Debug Script')
console.log('─'.repeat(50))

async function debugImageDeletion() {
  try {
    // Step 1: Check if admin user exists
    console.log('\n📋 Step 1: Checking admin users...')
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, display_name, role')
      .eq('role', 'admin')

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError)
      return
    }

    console.log(`✅ Found ${adminUsers?.length || 0} admin users:`)
    adminUsers?.forEach(admin => {
      console.log(`   - User ID: ${admin.user_id}`)
      console.log(`   - Display Name: ${admin.display_name}`)
      console.log(`   - Role: ${admin.role}`)
    })

    if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ NO ADMIN USERS FOUND! This is likely the issue.')
      console.log('   To fix: Run the make-admin script or manually set role=admin in user_profiles')
      return
    }

    // Step 2: Check menu images
    console.log('\n📋 Step 2: Checking menu images...')
    const { data: menuImages, error: menuError } = await supabaseAdmin
      .from('menu_images')
      .select('id, storage_path, restaurant_id, status, created_at')
      .limit(5)

    if (menuError) {
      console.error('❌ Error fetching menu images:', menuError)
      return
    }

    console.log(`✅ Found ${menuImages?.length || 0} menu images:`)
    menuImages?.forEach(img => {
      console.log(`   - ID: ${img.id}`)
      console.log(`   - Storage Path: ${img.storage_path}`)
      console.log(`   - Status: ${img.status}`)
      console.log(`   - Created: ${img.created_at}`)
      console.log('   ---')
    })

    if (!menuImages || menuImages.length === 0) {
      console.log('⚠️  No menu images found to test deletion with.')
      return
    }

    // Step 3: Test storage access
    console.log('\n📋 Step 3: Testing storage bucket access...')
    const { data: storageFiles, error: storageError } = await supabaseAdmin.storage
      .from('menu-images')
      .list('menus', { limit: 10 })

    if (storageError) {
      console.error('❌ Storage access error:', storageError)
    } else {
      console.log(`✅ Storage bucket accessible. Found ${storageFiles?.length || 0} files in menus/`)
    }

    // Step 4: Test admin authentication
    console.log('\n📋 Step 4: Testing admin authentication...')
    const testAdminUser = adminUsers[0]
    
    try {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()
      if (authError || !user) {
        console.log('❌ Admin authentication failed:', authError?.message || 'No user')
      } else {
        console.log(`✅ Admin authenticated as: ${user.id}`)
        
        // Verify admin role
        const isAdmin = testAdminUser.user_id === user.id
        console.log(`✅ Admin role check: ${isAdmin ? 'PASS' : 'FAIL'}`)
      }
    } catch (authTestError) {
      console.error('❌ Auth test error:', authTestError.message)
    }

    // Step 5: Test the delete API logic
    console.log('\n📋 Step 5: Testing delete API logic...')
    const testImageId = menuImages[0].id
    
    try {
      // Simulate what the API does
      console.log(`Testing deletion of image: ${testImageId}`)
      
      // 1. Check image exists
      const { data: imageCheck, error: imageError } = await supabaseAdmin
        .from('menu_images')
        .select('storage_path, restaurant_id')
        .eq('id', testImageId)
        .single()

      if (imageError || !imageCheck) {
        console.log('❌ Image not found or error:', imageError?.message)
      } else {
        console.log('✅ Image found:', imageCheck.storage_path)
        
        // 2. Test storage deletion (without actually deleting)
        console.log('📋 Would attempt to delete from storage:', imageCheck.storage_path)
        
        // 3. Test database deletion (without actually deleting)
        console.log('📋 Would attempt to delete from database:', testImageId)
        
        console.log('✅ Delete API logic simulation complete')
      }
    } catch (deleteTestError) {
      console.error('❌ Delete API test error:', deleteTestError.message)
    }

    console.log('\n🎯 DIAGNOSIS SUMMARY:')
    console.log('─'.repeat(50))
    console.log(`✅ Admin users exist: ${adminUsers.length > 0 ? 'YES' : 'NO'}`)
    console.log(`✅ Menu images exist: ${menuImages.length > 0 ? 'YES' : 'NO'}`)
    console.log(`✅ Storage accessible: ${!storageError ? 'YES' : 'NO'}`)
    console.log('\nIf all show YES, the issue is likely in frontend authentication or user session.')
    console.log('If admin users show NO, the user needs to be set as admin first.')

  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

debugImageDeletion()