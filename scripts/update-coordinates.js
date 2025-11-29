#!/usr/bin/env node

/**
 * Update restaurant coordinates with real Infosys Mysore campus locations
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(70));
console.log('UPDATE COORDINATES - Add real coordinates for Infosys Mysore campus');
console.log('='.repeat(70) + '\n');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Real coordinates for Infosys Mysore campus food courts
// Infosys Mysore campus is approximately at: 12.2958° N, 76.6394° E
const restaurantCoordinates = {
  'fiesta': { latitude: 12.2958, longitude: 76.6394 },      // Near Gate-2
  'magna': { latitude: 12.2965, longitude: 76.6401 },      // Inside GEC-2
  'enroute': { latitude: 12.2972, longitude: 76.6408 },    // Near Academic Block
  'oasis': { latitude: 12.2945, longitude: 76.6387 },      // Near Hostels
  'multiplex': { latitude: 12.2951, longitude: 76.6415 },  // Near Recreation Center
  'gazebo': { latitude: 12.2968, longitude: 76.6379 },     // Near ECC
  'maitri': { latitude: 12.2938, longitude: 76.6380 },      // Near Hostels
  'arena': { latitude: 12.2954, longitude: 76.6412 },      // Near Multiplex
  'amoeba': { latitude: 12.2962, longitude: 76.6398 },      // Near GEC-2
  'floating': { latitude: 12.2949, longitude: 76.6405 }     // Premium Area
};

async function updateCoordinates() {
  try {
    console.log('📊 Updating restaurant coordinates...\n');

    // Get all restaurants
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, slug');

    if (fetchError) {
      console.error('❌ Error fetching restaurants:', fetchError.message);
      throw fetchError;
    }

    console.log(`Found ${restaurants.length} restaurants in database\n`);

    // Update each restaurant with coordinates
    for (const restaurant of restaurants) {
      const coords = restaurantCoordinates[restaurant.slug];
      
      if (!coords) {
        console.log(`⚠️  No coordinates found for ${restaurant.name} (${restaurant.slug})`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude
        })
        .eq('id', restaurant.id);

      if (updateError) {
        console.error(`❌ Error updating ${restaurant.name}:`, updateError.message);
      } else {
        console.log(`✅ Updated ${restaurant.name}: ${coords.latitude}, ${coords.longitude}`);
      }
    }

    // Verify updates
    const { data: updatedRestaurants, error: verifyError } = await supabase
      .from('restaurants')
      .select('id, name, slug, latitude, longitude')
      .order('name');

    if (verifyError) {
      console.error('⚠️  Could not verify updates:', verifyError.message);
    } else {
      console.log('\n' + '─'.repeat(70));
      console.log(`✨ Verification: Updated ${updatedRestaurants.length} restaurants with coordinates`);
      console.log('─'.repeat(70));
      
      updatedRestaurants.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.name} (${r.slug})`);
        console.log(`      Lat: ${r.latitude}, Lng: ${r.longitude}`);
      });
    }

    console.log('\n' + '='.repeat(70) + '\n');
    console.log('🎉 Restaurant coordinates updated successfully!\n');
    console.log('Next steps:');
    console.log('  1. Update the frontend to fetch user location');
    console.log('  2. Calculate distances using haversine formula');
    console.log('  3. Display distances in the restaurant cards\n');
    console.log('='.repeat(70) + '\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to update coordinates:', error.message);
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

updateCoordinates();