#!/usr/bin/env node

/**
 * Add latitude and longitude columns to restaurants table
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(70));
console.log('ADD LOCATION COLUMNS - Add latitude and longitude to restaurants');
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

    // Add latitude column
    const { error: latError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);'
    });

    if (latError) {
      console.error('❌ Error adding latitude column:', latError.message);
    } else {
      console.log('✅ Latitude column added successfully');
    }

    // Add longitude column
    const { error: lngError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);'
    });

    if (lngError) {
      console.error('❌ Error adding longitude column:', lngError.message);
    } else {
      console.log('✅ Longitude column added successfully');
    }

    // Verify columns were added
    const { data: columns, error: verifyError } = await supabase
      .from('restaurants')
      .select('id, name, latitude, longitude')
      .limit(1);

    if (verifyError) {
      console.error('⚠️  Could not verify columns:', verifyError.message);
    } else {
      console.log('✅ Columns verified successfully');
      console.log('Sample data:', columns);
    }

    console.log('\n' + '='.repeat(70) + '\n');
    console.log('🎉 Location columns added successfully!\n');
    console.log('Next steps:');
    console.log('  1. Run the update-coordinates.js script to populate coordinates');
    console.log('  2. Update the frontend to use location-based distance calculation\n');
    console.log('='.repeat(70) + '\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to add location columns:', error.message);
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

addLocationColumns();