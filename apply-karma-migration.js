/**
 * Apply Karma System Migration
 * 
 * This script applies the karma system migration to the Supabase database.
 * Run with: node apply-karma-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

async function applyMigration() {
    console.log('📦 Reading migration file...');

    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251204_karma_system.sql');

    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Migration file not found:', migrationPath);
        process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons but keep track of function blocks
    const statements = [];
    let currentStatement = '';
    let inFunctionBlock = false;
    let dollarQuoteCount = 0;

    const lines = migrationSQL.split('\n');

    for (const line of lines) {
        // Skip comments
        if (line.trim().startsWith('--') && !inFunctionBlock) {
            continue;
        }

        currentStatement += line + '\n';

        // Track $$ blocks (function bodies)
        const dollarMatches = line.match(/\$\$/g);
        if (dollarMatches) {
            dollarQuoteCount += dollarMatches.length;
            inFunctionBlock = dollarQuoteCount % 2 !== 0;
        }

        // If we're not in a function block and find a semicolon, it's a statement end
        if (!inFunctionBlock && line.trim().endsWith(';')) {
            const stmt = currentStatement.trim();
            if (stmt && !stmt.startsWith('--')) {
                statements.push(stmt);
            }
            currentStatement = '';
        }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
    }

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 80).replace(/\n/g, ' ') + (stmt.length > 80 ? '...' : '');

        console.log(`[${i + 1}/${statements.length}] Executing: ${preview}`);

        try {
            const { error } = await supabase.rpc('exec_sql', { sql: stmt });

            if (error) {
                // Some errors are expected (e.g., "already exists")
                if (error.message.includes('already exists') ||
                    error.message.includes('duplicate key') ||
                    error.message.includes('column "meal_session" of relation')) {
                    console.log(`   ⏭️  Skipped (already exists)`);
                    skipCount++;
                } else {
                    console.log(`   ❌ Error: ${error.message}`);
                    errorCount++;
                }
            } else {
                console.log(`   ✅ Success`);
                successCount++;
            }
        } catch (err) {
            // Try direct query execution
            try {
                const { error: directError } = await supabase.from('_exec').select().execute();
                console.log(`   ℹ️  RPC not available, trying alternative...`);

                // For direct SQL execution, we need to use a different approach
                // Since RPC isn't available, log the statement for manual execution
                console.log(`   ⚠️  Manual execution required`);
                console.log(`   SQL: ${preview}`);
                errorCount++;
            } catch (directErr) {
                console.log(`   ❌ Error: ${err.message}`);
                errorCount++;
            }
        }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
        console.log('');
        console.log('⚠️  Some statements failed. You may need to run the migration manually.');
        console.log('   Use the Supabase SQL Editor to execute the migration file:');
        console.log(`   ${migrationPath}`);
    }
}

applyMigration()
    .then(() => {
        console.log('');
        console.log('✨ Migration process complete!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    });
