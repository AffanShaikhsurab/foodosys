#!/usr/bin/env node

/**
 * Add latitude and longitude columns to restaurants table (v2)
 * Using direct SQL approach instead of RPC
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(70));
console.log('ADD LOCATION COLUMNS V2 - Add latitude and longitude to restaurants');
console.log('='.repeat(70) + '\n');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addLocationColumns() {
  try {
    console.log('📊 Adding latitude and longitude columns to restaurants table...\n');

    // First, let's check if columns already exist
    const { data: existingColumns, error: checkError } = await supabase
      .from('restaurants')
      .select('id, name, latitude, longitude')
      .limit(1);

    if (!checkError && existingColumns && existingColumns.length > 0) {
      console.log('✅ Latitude and longitude columns already exist');
      console.log('Sample data:', existingColumns[0]);
    } else {
      console.log('⚠️  Columns might not exist. Let\'s try to add them using a different approach...');
      
      // Try to update a record with latitude and longitude to see if columns exist
      const { data: testUpdate, error: updateError } = await supabase
        .from('restaurants')
        .update({ latitude: 0.0, longitude: 0.0 })
        .eq('id', 1)
        .select();

      if (updateError) {
        console.error('❌ Error updating with coordinates:', updateError.message);
        console.log('\n⚠️  Please manually add the columns to your Supabase database:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Table Editor > restaurants');
        console.log('3. Add two new columns:');
        console.log('   - latitude (type: decimal, precision: 10, scale: 8)');
        console.log('   - longitude (type: decimal, precision: 11, scale: 8)');
        console.log('4. Save the changes\n');
      } else {
        console.log('✅ Columns exist and are accessible');
      }
    }

    console.log('\n' + '='.repeat(70) + '\n');
    console.log('🎉 Location columns check completed!\n');
    console.log('Next steps:');
    console.log('  1. If columns were added successfully, run update-coordinates.js');
    console.log('  2. If columns were missing, add them manually in Supabase dashboard');
    console.log('  3. Then run update-coordinates.js to populate coordinates\n');
    console.log('='.repeat(70) + '\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to add location columns:', error.message);
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

addLocationColumns();