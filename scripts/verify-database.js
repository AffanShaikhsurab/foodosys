#!/usr/bin/env node

/**
 * Database Verification Script
 * Checks if the migration was applied successfully
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(70));
console.log('DATABASE VERIFICATION - Foodosys');
console.log('='.repeat(70) + '\n');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyDatabase() {
  try {
    const tables = [
      'restaurants',
      'user_profiles',
      'menu_images',
      'ocr_results',
      'menus',
      'daily_contributions',
      'user_badges',
      'leaderboard',
      'local_credentials'
    ];

    console.log('🔍 Checking database tables...\n');

    let allGood = true;
    for (const tableName of tables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error && error.code === 'PGRST205') {
          console.log(`  ❌ ${tableName.padEnd(25)} - NOT FOUND`);
          allGood = false;
        } else if (error) {
          console.log(`  ⚠️  ${tableName.padEnd(25)} - ${error.code}`);
        } else {
          console.log(`  ✅ ${tableName.padEnd(25)} - OK ${count !== null ? `(${count} rows)` : ''}`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName.padEnd(25)} - ERROR`);
        allGood = false;
      }
    }

    console.log('\n' + '─'.repeat(70));

    if (allGood) {
      console.log('✨ All tables verified successfully!\n');
      console.log('🎉 Your database is ready to use!\n');
      
      // Try to fetch restaurants
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');
      
      if (restaurants && restaurants.length > 0) {
        console.log(`📍 Sample restaurants (${restaurants.length} total):`);
        restaurants.slice(0, 5).forEach(r => {
          console.log(`   • ${r.name} - ${r.location}`);
        });
        if (restaurants.length > 5) {
          console.log(`   ... and ${restaurants.length - 5} more`);
        }
        console.log();
      }
    } else {
      console.log('⚠️  Some tables are missing!\n');
      console.log('📝 Please apply the migration:');
      console.log('   1. Go to: https://app.supabase.com/project/gzyhcqdgslztzhwqjceh/sql');
      console.log('   2. Create new query');
      console.log('   3. Copy-paste: supabase/migrations/001_init_schema.sql');
      console.log('   4. Click Run\n');
    }

    console.log('='.repeat(70) + '\n');
    process.exit(allGood ? 0 : 1);

  } catch (error) {
    console.error('❌ Verification error:', error.message);
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

verifyDatabase();
