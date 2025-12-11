import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ADMIN_EMAIL, isAdminEmail } from '@/lib/admin-config'
import { currentUser } from '@clerk/nextjs/server'

/**
 * Admin Sync API
 * 
 * This endpoint allows:
 * 1. Checking the current admin status
 * 2. Syncing the admin role based on email
 * 
 * GET: Check if current user is admin
 * POST: Sync admin role (must be called by admin email user)
 */

export async function GET() {
    try {
        const user = await currentUser()

        if (!user) {
            return NextResponse.json({
                isAdmin: false,
                message: 'Not authenticated'
            })
        }

        const email = user.emailAddresses?.[0]?.emailAddress
        const isAdminByEmail = isAdminEmail(email)

        // Also check database role
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        const isAdminInDb = profile?.role === 'admin'

        return NextResponse.json({
            isAdmin: isAdminByEmail || isAdminInDb,
            isAdminByEmail,
            isAdminInDb,
            email,
            userId: user.id,
            adminEmail: ADMIN_EMAIL,
            syncNeeded: isAdminByEmail && !isAdminInDb
        })
    } catch (error) {
        console.error('[Admin Check] Error:', error)
        return NextResponse.json({
            isAdmin: false,
            error: 'Failed to check admin status'
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser()

        if (!user) {
            return NextResponse.json({
                error: 'Not authenticated'
            }, { status: 401 })
        }

        const email = user.emailAddresses?.[0]?.emailAddress

        // Only allow the admin email to sync
        if (!isAdminEmail(email)) {
            return NextResponse.json({
                error: 'Only the admin user can sync admin privileges',
                yourEmail: email,
                adminEmail: ADMIN_EMAIL
            }, { status: 403 })
        }

        console.log(`[Admin Sync] Syncing admin role for user: ${user.id}, email: ${email}`)

        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (existingProfile) {
            // Update existing profile to admin
            const { data: updatedProfile, error: updateError } = await supabaseAdmin
                .from('user_profiles')
                .update({
                    role: 'admin',
                    display_name: 'Admin',
                    karma_points: 9999,
                    level: 5,
                    base_location: 'Admin'
                })
                .eq('user_id', user.id)
                .select()
                .single()

            if (updateError) {
                console.error('[Admin Sync] Update error:', updateError)
                return NextResponse.json({
                    error: 'Failed to update admin role',
                    details: updateError.message
                }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                message: 'Admin role synced successfully',
                action: 'updated',
                profile: updatedProfile
            })
        } else {
            // Create new admin profile
            const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Admin'

            const { data: newProfile, error: insertError } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                    user_id: user.id,
                    display_name: 'Admin',
                    avatar_url: user.imageUrl,
                    role: 'admin',
                    base_location: 'Admin',
                    dietary_preference: 'vegetarian',
                    karma_points: 9999,
                    level: 5
                })
                .select()
                .single()

            if (insertError) {
                console.error('[Admin Sync] Insert error:', insertError)
                return NextResponse.json({
                    error: 'Failed to create admin profile',
                    details: insertError.message
                }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                message: 'Admin profile created successfully',
                action: 'created',
                profile: newProfile
            })
        }
    } catch (error) {
        console.error('[Admin Sync] Error:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
