const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkAPI() {
  // Simulate what the API returns
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('API Response structure:');
  if (data && data.length > 0) {
    console.log('First restaurant fields:', Object.keys(data[0]));
    console.log('Sample restaurant:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkAPI();