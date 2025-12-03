const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

function getMealType(timestamp) {
    if (!timestamp) return 'Dinner';

    const date = new Date(timestamp);
    const hour = date.getHours();

    // Breakfast: 5am - 11am
    if (hour >= 5 && hour < 11) {
        return 'Breakfast';
    }
    // Lunch: 11am - 4pm
    else if (hour >= 11 && hour < 16) {
        return 'Lunch';
    }
    // Dinner: 4pm - 5am
    else {
        return 'Dinner';
    }
}

function getEffectiveTimestamp(menuImage) {
    return menuImage.photo_taken_at || menuImage.created_at;
}

async function debugMenuTimes() {
    try {
        const { data: menuImages, error } = await supabase
            .from('menu_images')
            .select('id, restaurant_id, photo_taken_at, created_at, status')
            .in('status', ['ocr_done', 'ocr_pending'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching menu images:', error);
            return;
        }

        console.log(`Found ${menuImages.length} menu images.`);
        console.log('Current Time:', new Date().toString());
        console.log('Current Hour:', new Date().getHours());

        const currentMealType = getMealType(new Date().toISOString());
        console.log('Current Meal Type (calculated):', currentMealType);

        menuImages.forEach(menu => {
            const timestamp = getEffectiveTimestamp(menu);
            const mealType = getMealType(timestamp);
            const date = new Date(timestamp);

            console.log(`\nMenu ID: ${menu.id}`);
            console.log(`Restaurant ID: ${menu.restaurant_id}`);
            console.log(`Created At: ${menu.created_at}`);
            console.log(`Photo Taken At: ${menu.photo_taken_at}`);
            console.log(`Effective Timestamp: ${timestamp}`);
            console.log(`Local Time of Timestamp: ${date.toString()}`);
            console.log(`Hour: ${date.getHours()}`);
            console.log(`Calculated Meal Type: ${mealType}`);
            console.log(`Matches Current Meal Type? ${mealType === currentMealType}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

debugMenuTimes();
