const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, latitude, longitude')
    .order('name');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Restaurant coordinates:');
  data.forEach(r => {
    console.log(`${r.name} (${r.slug}): Lat=${r.latitude}, Lng=${r.longitude}`);
  });
}

checkRestaurants();