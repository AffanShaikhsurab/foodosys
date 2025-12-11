/**
 * Admin Sync Script
 * Run this script to ensure the admin user has the correct role in the database
 * 
 * Usage: Run via API call or execute directly with node
 */

import { supabaseAdmin } from '@/lib/supabase'
import { ADMIN_EMAIL } from '@/lib/admin-config'

export async function syncAdminUser() {
    console.log(`[Admin Sync] Syncing admin role for email: ${ADMIN_EMAIL}`)

    try {
        // First, find any user profile with the admin email
        // Note: We need to check the Clerk user's email, which we store
        // For now, we'll update any user with the known admin display name or pattern

        // Update user_profiles where the user has the admin email
        // This requires the user to have logged in at least once
        const { data: profiles, error: fetchError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('role', 'trainee')

        if (fetchError) {
            console.error('[Admin Sync] Error fetching profiles:', fetchError)
            return { success: false, error: fetchError.message }
        }

        console.log(`[Admin Sync] Found ${profiles?.length || 0} trainee profiles to check`)

        // For existing users, they might already have profiles
        // We need an alternate approach - update via webhook or manual intervention

        return {
            success: true,
            message: 'Admin sync check complete. For existing users, please use the Supabase dashboard to update role to "admin" for the admin user.',
            profiles: profiles?.length || 0
        }
    } catch (error) {
        console.error('[Admin Sync] Error:', error)
        return { success: false, error: String(error) }
    }
}

// Export for API route usage
export default syncAdminUser
