#!/usr/bin/env node

/**
 * Storage Policies Migration Script
 * Applies only the storage RLS policies for menu-images bucket
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('STORAGE POLICIES MIGRATION - Foodosys');
console.log('='.repeat(60) + '\n');

// Read the storage policies migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '003_storage_policies.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('📄 Storage Policies Migration');
console.log('   File:', migrationPath);
console.log('   Size:', Math.round(migrationSQL.length / 1024) + 'KB\n');

console.log('🎯 This migration will:');
console.log('   ✓ Add RLS policies for storage.objects table');
console.log('   ✓ Allow authenticated users to upload to menu-images bucket');
console.log('   ✓ Fix the "new row violates row-level security policy" error\n');

console.log('📋 MIGRATION SQL (copy and run in Supabase SQL Editor):');
console.log('─'.repeat(60));
console.log(migrationSQL);
console.log('─'.repeat(60) + '\n');

console.log('🔗 HOW TO APPLY:');
console.log('1. Go to: https://app.supabase.com/');
console.log('2. Select your project');
console.log('3. Navigate to: SQL Editor → New Query');
console.log('4. Copy the SQL above and paste it');
console.log('5. Click "Run" button');
console.log('6. Test file upload in your app\n');

console.log('💡 Alternative: Use Supabase CLI');
console.log('   supabase db reset --linked');
console.log('   (if you have Supabase CLI installed)\n');

console.log('✅ After applying, file uploads should work without RLS errors!\n');