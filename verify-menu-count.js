#!/usr/bin/env node

/**
 * Verify Menu Count Script
 * Checks the exact count of menu images per restaurant
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyMenuCount() {
  try {
    // Get all menu images
    const { data: menuImages, error } = await supabase
      .from('menu_images')
      .select('restaurant_id, status, created_at')
      .in('status', ['ocr_done', 'ocr_pending'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log('\n📊 Menu Images with OCR Status:\n');
    console.log(`Total menu images: ${menuImages.length}\n`);

    // Group by restaurant
    const byRestaurant = {};
    menuImages.forEach(img => {
      if (!byRestaurant[img.restaurant_id]) {
        byRestaurant[img.restaurant_id] = [];
      }
      byRestaurant[img.restaurant_id].push(img);
    });

    // Get restaurant details
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name')
      .in('id', Object.keys(byRestaurant));

    const restaurantMap = {};
    restaurants.forEach(r => {
      restaurantMap[r.id] = r.name;
    });

    Object.entries(byRestaurant).forEach(([restaurantId, images]) => {
      console.log(`${restaurantMap[restaurantId]}:`);
      console.log(`  Total: ${images.length} menu image(s)`);
      const statusBreakdown = {};
      images.forEach(img => {
        statusBreakdown[img.status] = (statusBreakdown[img.status] || 0) + 1;
      });
      Object.entries(statusBreakdown).forEach(([status, count]) => {
        console.log(`    - ${status}: ${count}`);
      });
      console.log();
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyMenuCount();
