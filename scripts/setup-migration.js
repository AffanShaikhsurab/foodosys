#!/usr/bin/env node

/**
 * Database Migration Helper
 * 
 * This script helps you apply the database schema to Supabase.
 * Since Supabase.js SDK doesn't support arbitrary SQL execution,
 * this script provides you with the migration SQL and instructions.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '='.repeat(70));
console.log('DATABASE MIGRATION SETUP - Foodosys');
console.log('='.repeat(70) + '\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing Supabase credentials in .env.local\n');
  console.error('Required variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (optional but recommended)\n');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.split('//')[1].split('.')[0];

console.log('✅ Supabase Configuration Found');
console.log(`   Project Reference: ${projectRef}`);
console.log(`   URL: ${supabaseUrl}\n`);

// Read migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_init_schema.sql');

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}\n`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
const lines = migrationSQL.split('\n').length;
const kb = Math.round(migrationSQL.length / 1024);

console.log('📄 Migration File');
console.log(`   Location: ${path.relative(process.cwd(), migrationPath)}`);
console.log(`   Size: ${kb}KB (${lines} lines)`);
console.log(`   Status: ✅ Ready to apply\n`);

// List what gets created
console.log('📊 Tables to Create:');
const tables = [
  'restaurants',
  'user_profiles', 
  'menu_images',
  'ocr_results',
  'menus',
  'daily_contributions',
  'user_badges',
  'leaderboard',
  'local_credentials'
];
tables.forEach(t => console.log(`   ✓ ${t}`));

console.log('\n🔐 Indexes & Security:');
console.log('   ✓ 8 performance indexes');
console.log('   ✓ Row Level Security (RLS) policies');
console.log('   ✓ Triggers for karma system');
console.log('   ✓ Functions for badges & leaderboard');

console.log('\n🌱 Seed Data:');
console.log('   ✓ 10 sample restaurants pre-loaded');

console.log('\n' + '='.repeat(70));
console.log('HOW TO APPLY THE MIGRATION');
console.log('='.repeat(70) + '\n');

console.log('📝 OPTION 1: Via Supabase Dashboard (Recommended)');
console.log('─'.repeat(70));
console.log('1. Open: https://app.supabase.com/');
console.log('2. Select your project');
console.log('3. Go to: SQL Editor → New Query');
console.log('4. Copy the migration SQL (see below)');
console.log('5. Paste into editor and click "Run"\n');

console.log('📋 OPTION 2: Via API (requires service role key)');
console.log('─'.repeat(70));
if (!supabaseServiceRoleKey) {
  console.log('⚠️  Service role key not found in .env.local');
  console.log('    Add SUPABASE_SERVICE_ROLE_KEY to enable this option\n');
} else {
  console.log('✅ Service role key found\n');
}

console.log('🔗 Direct Links:');
console.log('─'.repeat(70));
console.log(`Supabase Dashboard: https://app.supabase.com/`);
console.log(`Your Project:       https://app.supabase.com/project/${projectRef}`);
console.log(`SQL Editor:         https://app.supabase.com/project/${projectRef}/sql\n`);

console.log('📌 Next Steps:');
console.log('─'.repeat(70));
console.log('1. Open the SQL Editor link above');
console.log('2. Create a new query');
console.log('3. Copy this command to view migration file:');
console.log(`   cat supabase/migrations/001_init_schema.sql`);
console.log('4. Paste full content into Supabase SQL Editor');
console.log('5. Click "Run" button');
console.log('6. Refresh your app and test\n');

console.log('✅ After running:');
console.log('─'.repeat(70));
console.log('• Error "Could not find the table" will disappear');
console.log('• Restaurants list will load on app');
console.log('• All user and menu features will work\n');

console.log('💡 Testing:');
console.log('─'.repeat(70));
console.log('Run this to verify migration:');
console.log('   npm run dev');
console.log('Then click on "Restaurants" in your app\n');

console.log('='.repeat(70));
console.log('Migration file is ready to use! 🚀');
console.log('='.repeat(70) + '\n');

// Option to copy migration to clipboard (on Windows, at least)
if (process.platform === 'win32') {
  console.log('💻 Windows Tip:');
  console.log('─'.repeat(70));
  console.log('To copy migration to clipboard, run:');
  console.log(`   type supabase\\migrations\\001_init_schema.sql | clip\n`);
  console.log('Then paste into Supabase SQL Editor\n');
}

console.log('Questions? Check MIGRATION_GUIDE.md for more details.\n');
