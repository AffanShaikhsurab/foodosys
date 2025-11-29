#!/usr/bin/env node

/**
 * Storage Bucket Check Script
 * Verifies if the menu-images storage bucket exists
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(70));
console.log('STORAGE BUCKET VERIFICATION');
console.log('='.repeat(70) + '\n');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkStorageBuckets() {
  try {
    console.log('🔍 Checking storage buckets...\n');

    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      console.error('   This usually means:');
      console.error('   - Service role key doesn\'t have storage access');
      console.error('   - Or there are no buckets yet\n');
      process.exit(1);
    }

    console.log(`📊 Found ${buckets.length} bucket(s):\n`);

    let foundMenuImages = false;

    for (const bucket of buckets) {
      const exists = bucket.name === 'menu-images';
      const icon = exists ? '✅' : '❌';
      console.log(`${icon} ${bucket.name}`);
      if (bucket.public) console.log(`   Public: Yes`);
      else console.log(`   Public: No (private)`);
      
      if (exists) {
        foundMenuImages = true;
        console.log(`   ➜ This is the bucket we need!`);
      }
      console.log();
    }

    if (!foundMenuImages) {
      console.log('\n' + '─'.repeat(70));
      console.log('❌ PROBLEM: "menu-images" bucket does not exist!');
      console.log('─'.repeat(70));
      console.log('\n✅ SOLUTION: Create the storage bucket:\n');
      console.log('1. Go to: https://app.supabase.com/');
      console.log('2. Select your project (gzyhcqdgslztzhwqjceh)');
      console.log('3. Go to: Storage → Buckets');
      console.log('4. Click "Create a new bucket"');
      console.log('5. Name: menu-images');
      console.log('6. Public/Private: Private (recommended)');
      console.log('7. Click Create\n');
      console.log('Then set policies for authenticated uploads.\n');
    } else {
      console.log('─'.repeat(70));
      console.log('✅ Storage bucket "menu-images" exists!');
      console.log('─'.repeat(70));
      console.log('\n🔐 Checking bucket policies...\n');

      // Check if we can list objects (test read access)
      try {
        const { data: objects, error: listError } = await supabase.storage
          .from('menu-images')
          .list();

        if (listError) {
          console.log('⚠️  Cannot read from bucket:');
          console.log(`   Error: ${listError.message}\n`);
          console.log('This might be OK if bucket policies are restrictive.\n');
        } else {
          console.log(`✅ Can read from bucket (${objects.length} objects)`);
          if (objects.length > 0) {
            console.log('   Sample objects:');
            objects.slice(0, 3).forEach(obj => {
              console.log(`   - ${obj.name}`);
            });
          }
          console.log();
        }
      } catch (err) {
        console.log(`⚠️  Error checking bucket contents: ${err.message}\n`);
      }

      // Test upload ability with a tiny file
      try {
        console.log('🧪 Testing upload permissions...\n');
        
        const testFilePath = `test/${Date.now()}-test.txt`;
        const testData = new TextEncoder().encode('test');

        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(testFilePath, testData, { 
            cacheControl: '3600',
            upsert: false 
          });

        if (uploadError) {
          console.log(`❌ Upload test failed: ${uploadError.message}`);
          console.log('   Problem: Cannot write to bucket');
          console.log('   Solution: Check bucket policies in Supabase dashboard\n');
        } else {
          console.log('✅ Upload test successful!');
          console.log(`   Created: ${testFilePath}`);
          console.log('   Status: Bucket is writable ✓\n');

          // Clean up test file
          try {
            await supabase.storage
              .from('menu-images')
              .remove([testFilePath]);
            console.log('🧹 Cleaned up test file\n');
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.log(`⚠️  Error during upload test: ${err.message}\n`);
      }
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error checking storage:', error.message);
    process.exit(1);
  }
}

checkStorageBuckets();
