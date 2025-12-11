#!/usr/bin/env node

/**
 * Complete Database Fix - Run this script to populate restaurants
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(70));
console.log('DATABASE FIX - Insert Restaurant Seed Data');
console.log('='.repeat(70) + '\n');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedRestaurants() {
  try {
    console.log('📊 Inserting restaurant seed data...\n');

    const restaurants = [
      { name: 'Fiesta Food Court', location: 'Near Gate-2', distance_estimate_m: 500, slug: 'fiesta' },
      { name: 'Magna Food Court', location: 'Inside GEC-2', distance_estimate_m: 300, slug: 'magna' },
      { name: 'Enroute Food Court', location: 'Near Academic Block', distance_estimate_m: 600, slug: 'enroute' },
      { name: 'Oasis Food Court', location: 'Near Hostels', distance_estimate_m: 800, slug: 'oasis' },
      { name: 'Multiplex Food Court', location: 'Near Recreation Center', distance_estimate_m: 400, slug: 'multiplex' },
      { name: 'Gazebo Food Court', location: 'Near ECC', distance_estimate_m: 700, slug: 'gazebo' },
      { name: 'Maitri Food Court', location: 'Near Hostels', distance_estimate_m: 900, slug: 'maitri' },
      { name: 'Arena Food Court', location: 'Near Multiplex', distance_estimate_m: 750, slug: 'arena' },
      { name: 'Amoeba Food Court', location: 'Near GEC-2', distance_estimate_m: 650, slug: 'amoeba' },
      { name: 'Floating Restaurant', location: 'Premium Area', distance_estimate_m: 1000, slug: 'floating' }
    ];

    // Insert all at once
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurants)
      .select();

    if (error) {
      console.error('❌ Error inserting restaurants:', error.message);
      console.error('Code:', error.code);
      throw error;
    }

    console.log(`✅ Successfully inserted ${data.length} restaurants:\n`);
    data.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}`);
      console.log(`      Location: ${r.location}`);
      console.log(`      Distance: ${r.distance_estimate_m}m\n`);
    });

    // Verify
    const { data: verification, error: verifyError } = await supabase
      .from('restaurants')
      .select('*')
      .order('name');

    if (verifyError) {
      console.error('⚠️  Could not verify:', verifyError.message);
    } else {
      console.log('─'.repeat(70));
      console.log(`✨ Verification: Database now has ${verification.length} restaurants`);
      console.log('─'.repeat(70));
      console.log('\n🎉 Database is ready!\n');
      console.log('Next steps:');
      console.log('  1. Refresh your app in the browser (Ctrl+R or Cmd+R)');
      console.log('  2. Click on "Restaurants" or the restaurants section');
      console.log('  3. You should now see all 10 restaurants\n');
    }

    console.log('='.repeat(70) + '\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to seed restaurants:', error.message);
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

seedRestaurants();
