const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://muqwcdljrixnhdtlxfwn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cXdjZGxqcml4bmhkdGx4ZnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzYwNTksImV4cCI6MjA3OTkxMjA1OX0.7AER0uSIFJeC-OFox0cdDEamDPbtTPnQISD4Sk_ftaM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  const userId = '6b1839f3-c30d-4c96-9b7e-32f326047a7d';
  
  try {
    console.log(`Testing query for user_id: ${userId}`);
    
    // Test with maybeSingle()
    const { data: data1, error: error1 } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    console.log('\nWith maybeSingle():');
    console.log('Data:', data1);
    console.log('Error:', error1);
    
    // Test without maybeSingle()
    const { data: data2, error: error2 } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId);
    
    console.log('\nWithout maybeSingle():');
    console.log('Data:', data2);
    console.log('Error:', error2);
    
    // Check if user exists in auth.users
    // Note: This won't work with anon key, but let's try
    try {
      const { data: authUser, error: authError } = await supabase.auth.getUser(userId);
      console.log('\nAuth user check:');
      console.log('Data:', authUser);
      console.log('Error:', authError);
    } catch (e) {
      console.log('\nAuth user check failed (expected with anon key):', e.message);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testQuery();