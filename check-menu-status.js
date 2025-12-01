#!/usr/bin/env node

/**
 * Check Menu Status Script
 * Verifies which restaurants have menus in the database
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(70));
console.log('MENU STATUS CHECK - Foodosys');
console.log('='.repeat(70) + '\n');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkMenuStatus() {
  try {
    // Get all restaurants
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, slug')
      .order('name');

    if (restaurantsError) {
      console.error('❌ Error fetching restaurants:', restaurantsError);
      process.exit(1);
    }

    console.log(`📍 Found ${restaurants.length} restaurants\n`);

    // Get all menu images with their status
    const { data: menuImages, error: menuImagesError } = await supabase
      .from('menu_images')
      .select('restaurant_id, status')
      .in('status', ['ocr_done', 'ocr_pending']);

    if (menuImagesError) {
      console.error('❌ Error fetching menu images:', menuImagesError);
      process.exit(1);
    }

    // Count menus per restaurant
    const menuCounts = {};
    if (menuImages) {
      menuImages.forEach(img => {
        menuCounts[img.restaurant_id] = (menuCounts[img.restaurant_id] || 0) + 1;
      });
    }

    console.log('📊 Menu Status by Restaurant:\n');
    console.log('─'.repeat(70));

    let withMenus = 0;
    let withoutMenus = 0;

    restaurants.forEach(restaurant => {
      const menuCount = menuCounts[restaurant.id] || 0;
      const status = menuCount > 0 ? '✅ HAS MENU' : '❌ NO MENU';
      const countStr = menuCount > 0 ? `(${menuCount} menu image${menuCount > 1 ? 's' : ''})` : '';
      
      console.log(`${status.padEnd(15)} ${restaurant.name.padEnd(40)} ${countStr}`);
      
      if (menuCount > 0) {
        withMenus++;
      } else {
        withoutMenus++;
      }
    });

    console.log('─'.repeat(70));
    console.log(`\n📈 Summary:`);
    console.log(`   • Restaurants WITH menus: ${withMenus}`);
    console.log(`   • Restaurants WITHOUT menus: ${withoutMenus}`);
    console.log(`   • Total restaurants: ${restaurants.length}\n`);

    // Get detailed menu image info
    const { data: allMenuImages, error: allMenuImagesError } = await supabase
      .from('menu_images')
      .select('restaurant_id, status, image_url, created_at')
      .order('created_at', { ascending: false });

    if (!allMenuImagesError && allMenuImages && allMenuImages.length > 0) {
      console.log('─'.repeat(70));
      console.log(`\n📸 All Menu Images (${allMenuImages.length} total):\n`);
      
      const statusCounts = {};
      allMenuImages.forEach(img => {
        statusCounts[img.status] = (statusCounts[img.status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count} image${count > 1 ? 's' : ''}`);
      });
      console.log();
    }

    console.log('='.repeat(70) + '\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMenuStatus();
