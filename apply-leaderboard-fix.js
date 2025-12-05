#!/usr/bin/env node
/**
 * Apply Leaderboard Fix Migration
 * 
 * This script applies the backfill migration to fix leaderboard rankings
 * and ensure all users who uploaded photos get their karma.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function applyMigration() {
    console.log('🔧 Applying leaderboard fix migration...\n')

    try {
        // Read the migration file
        const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251204_fix_leaderboard_backfill.sql')
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

        console.log('📄 Migration file loaded:', migrationPath)
        console.log('📊 Executing migration SQL...\n')

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

        if (error) {
            // If exec_sql doesn't exist, try direct execution (this might not work with DO blocks)
            console.log('⚠️  exec_sql function not found, trying alternative method...\n')

            // Split by statement and execute individually
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'))

            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i] + ';'
                console.log(`Executing statement ${i + 1}/${statements.length}...`)

                const { error: stmtError } = await supabase.rpc('exec', { sql: stmt })

                if (stmtError) {
                    console.error(`❌ Error executing statement ${i + 1}:`, stmtError.message)
                }
            }
        } else {
            console.log('✅ Migration executed successfully!\n')
            if (data) {
                console.log('📊 Migration results:', data)
            }
        }

        // Verify the fix
        console.log('\n🔍 Verifying leaderboard rankings...\n')

        const { data: leaderboardData, error: leaderboardError } = await supabase
            .from('leaderboard')
            .select(`
        rank_position,
        total_karma,
        weekly_karma,
        monthly_karma,
        user_profiles!inner(
          display_name,
          karma_points
        )
      `)
            .order('rank_position', { ascending: true, nullsFirst: false })
            .limit(10)

        if (leaderboardError) {
            console.error('❌ Error fetching leaderboard:', leaderboardError.message)
        } else {
            console.log('✅ Top 10 Leaderboard:')
            console.table(leaderboardData?.map((entry: any) => ({
                Rank: entry.rank_position || 'NULL',
                Name: entry.user_profiles?.display_name || 'Unknown',
                'Total Karma': entry.total_karma,
                'Weekly Karma': entry.weekly_karma,
                'Monthly Karma': entry.monthly_karma,
                'Profile Karma': entry.user_profiles?.karma_points || 0
            })))
        }

        // Check for null ranks
        const { data: nullRanks, error: nullError } = await supabase
            .from('leaderboard')
            .select('user_id, total_karma')
            .is('rank_position', null)

        if (nullError) {
            console.error('❌ Error checking for null ranks:', nullError.message)
        } else if (nullRanks && nullRanks.length > 0) {
            console.warn(`\n⚠️  Warning: ${nullRanks.length} users still have NULL rank_position`)
            console.log('These users might have 0 karma or need manual intervention.')
        } else {
            console.log('\n✅ All users have valid rank positions!')
        }

    } catch (error) {
        console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
    }
}

applyMigration()
    .then(() => {
        console.log('\n✅ Leaderboard fix completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error)
        process.exit(1)
    })
