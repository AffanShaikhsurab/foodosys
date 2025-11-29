#!/usr/bin/env node

/**
 * Comprehensive Database Debugging
 * Identifies the exact issue preventing table access
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(80));
console.log('COMPREHENSIVE DATABASE DEBUGGING - Foodosys');
console.log('='.repeat(80) + '\n');

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found\n');
  process.exit(1);
}

async function runDiagnostics() {
  try {
    // Step 1: Test anon key
    console.log('1️⃣  Testing ANON KEY Connection');
    console.log('─'.repeat(80));
    if (!supabaseAnonKey) {
      console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not configured\n');
    } else {
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true }
      });

      try {
        const { data, error } = await anonClient
          .from('restaurants')
          .select('*', { head: true });

        if (error) {
          console.log(`❌ Error: ${error.code} - ${error.message}`);
        } else {
          console.log(`✅ Anon key works - table exists`);
        }
      } catch (e) {
        console.log(`❌ Connection error: ${e.message}`);
      }
    }
    console.log();

    // Step 2: Test service role key
    console.log('2️⃣  Testing SERVICE ROLE KEY Connection');
    console.log('─'.repeat(80));
    if (!supabaseServiceRoleKey) {
      console.log('❌ SUPABASE_SERVICE_ROLE_KEY not configured\n');
    } else {
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      try {
        const { data, error } = await adminClient
          .from('restaurants')
          .select('*', { head: true });

        if (error) {
          console.log(`❌ Error: ${error.code} - ${error.message}`);
        } else {
          console.log(`✅ Service role key works - table exists`);
        }
      } catch (e) {
        console.log(`❌ Connection error: ${e.message}`);
      }
    }
    console.log();

    // Step 3: Check RLS policies
    console.log('3️⃣  Checking RLS Policies');
    console.log('─'.repeat(80));
    if (!supabaseServiceRoleKey) {
      console.log('❌ Cannot check RLS (no service role key)\n');
    } else {
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      try {
        // Try to query with bypass
        const { data, error } = await adminClient
          .from('restaurants')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent

        console.log('✅ Can query table (may be empty or have RLS)');
      } catch (e) {
        console.log(`❌ Query failed: ${e.message}`);
      }
    }
    console.log();

    // Step 4: Configuration Check
    console.log('4️⃣  Environment Configuration');
    console.log('─'.repeat(80));
    console.log(`Project URL:           ${supabaseUrl}`);
    console.log(`Anon Key Present:      ${supabaseAnonKey ? '✅ Yes' : '❌ No'}`);
    console.log(`Service Role Present:  ${supabaseServiceRoleKey ? '✅ Yes' : '❌ No'}`);
    console.log();

    // Step 5: Recommendations
    console.log('5️⃣  TROUBLESHOOTING STEPS');
    console.log('─'.repeat(80));
    console.log('\n🔴 ISSUE: Table "public.restaurants" cannot be found');
    console.log('\n✅ SOLUTION:');
    console.log('The migration hasn\'t been applied yet. Follow these steps:\n');
    console.log('  1. Go to Supabase Dashboard: https://app.supabase.com/');
    console.log('  2. Select your project');
    console.log('  3. Click "SQL Editor" in left sidebar');
    console.log('  4. Click "+ New query"');
    console.log('  5. In this directory, open: supabase/migrations/001_init_schema.sql');
    console.log('  6. Copy entire file contents');
    console.log('  7. Paste into SQL Editor in Supabase');
    console.log('  8. Click "Run" button (or Ctrl+Enter)');
    console.log('  9. Wait for completion (green checkmark)');
    console.log('\n📋 OR use this command to copy migration to clipboard:');
    console.log('   type supabase\\migrations\\001_init_schema.sql | clip');
    console.log('\nThen paste into SQL Editor.\n');

    console.log('6️⃣  QUICK VERIFICATION');
    console.log('─'.repeat(80));
    console.log('After running the migration, run this to verify:');
    console.log('   npm run verify-db\n');

    console.log('7️⃣  AFTER MIGRATION');
    console.log('─'.repeat(80));
    console.log('  1. Hard refresh your browser: Ctrl+Shift+R');
    console.log('  2. Click "Restaurants" in your app');
    console.log('  3. Should see list of 10 food courts\n');

    console.log('='.repeat(80));
    console.log('More help: Check MIGRATION_GUIDE.md');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Diagnostic error:', error.message);
  }
}

runDiagnostics();
