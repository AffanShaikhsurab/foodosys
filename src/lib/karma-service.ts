/**
 * Karma Service
 * 
 * Handles karma points calculation, awarding, and abuse prevention
 * for the food menu photo upload system.
 * 
 * Karma Points System:
 * - Base upload: 10 points
 * - Consecutive meal bonus: +5 points (uploading lunch after breakfast, etc.)
 * - First upload of day: +2 points
 * - Daily streak (all 3 meals): +15 points
 * - Weekly streak (7 days): +50 points
 * 
 * Abuse Prevention:
 * - 5 minute cooldown between uploads
 * - Max 3 uploads per meal session
 * - No duplicate uploads to same restaurant in same meal session
 */

import { supabaseAdmin } from './supabase'

export type MealSession = 'breakfast' | 'lunch' | 'dinner' | null

export interface KarmaBreakdown {
    totalPoints: number
    baseEarned: number
    consecutiveBonus: number
    firstUploadBonus: number
    dailyStreakBonus: number
    weeklyStreakBonus: number
    mealSession: MealSession
}

export interface RateLimitResult {
    allowed: boolean
    reason: string | null
    cooldownRemaining: number
}

export interface UserKarmaStats {
    totalKarma: number
    level: number
    weeklyKarma: number
    monthlyKarma: number
    totalUploads: number
    currentStreak: number
    rankPosition: number | null
}

/**
 * Get the current meal session based on time (IST timezone)
 */
export function getMealSession(): MealSession {
    // Get current time in IST (UTC+5:30)
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // 5:30 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000))
    const hour = istTime.getHours()

    // Breakfast: 6 AM - 11 AM
    if (hour >= 6 && hour < 11) {
        return 'breakfast'
    }
    // Lunch: 11 AM - 4 PM
    if (hour >= 11 && hour < 16) {
        return 'lunch'
    }
    // Dinner: 4 PM - 10 PM
    if (hour >= 16 && hour < 22) {
        return 'dinner'
    }

    return null
}

/**
 * Get user's profile ID from their Clerk user ID
 */
export async function getUserProfileId(clerkUserId: string): Promise<string | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('user_id', clerkUserId)
            .single()

        if (error || !data) {
            console.error('[KarmaService] Failed to get user profile:', error?.message)
            return null
        }

        return data.id
    } catch (error) {
        console.error('[KarmaService] Error getting user profile:', error)
        return null
    }
}

/**
 * Check if upload is allowed based on rate limits
 */
export async function checkRateLimit(
    userProfileId: string,
    restaurantId: string
): Promise<RateLimitResult> {
    try {
        const { data, error } = await supabaseAdmin.rpc('check_upload_rate_limit', {
            user_profile_id: userProfileId,
            p_restaurant_id: restaurantId
        })

        if (error) {
            console.error('[KarmaService] Rate limit check error:', error)
            // Default to allowing if rate limit check fails
            return { allowed: true, reason: null, cooldownRemaining: 0 }
        }

        if (data && data.length > 0) {
            const result = data[0]
            return {
                allowed: result.allowed,
                reason: result.reason,
                cooldownRemaining: result.cooldown_remaining || 0
            }
        }

        return { allowed: true, reason: null, cooldownRemaining: 0 }
    } catch (error) {
        console.error('[KarmaService] Error checking rate limit:', error)
        return { allowed: true, reason: null, cooldownRemaining: 0 }
    }
}

/**
 * Award karma points with all applicable bonuses
 */
export async function awardKarma(
    userProfileId: string,
    imageId: string,
    basePoints: number = 10
): Promise<KarmaBreakdown | null> {
    try {
        const { data, error } = await supabaseAdmin.rpc('award_karma_with_bonus', {
            user_profile_id: userProfileId,
            p_image_id: imageId,
            base_points: basePoints
        })

        if (error) {
            console.error('[KarmaService] Award karma error:', error)
            return null
        }

        if (data && data.length > 0) {
            const result = data[0]
            return {
                totalPoints: result.total_points,
                baseEarned: result.base_earned,
                consecutiveBonus: result.consecutive_bonus,
                firstUploadBonus: result.first_upload_bonus,
                dailyStreakBonus: result.daily_streak_bonus,
                weeklyStreakBonus: result.weekly_streak_bonus,
                mealSession: getMealSession()
            }
        }

        return null
    } catch (error) {
        console.error('[KarmaService] Error awarding karma:', error)
        return null
    }
}

/**
 * Create a contribution record with meal session
 */
export async function createContribution(
    userProfileId: string,
    restaurantId: string,
    menuImageId: string,
    pointsEarned: number
): Promise<boolean> {
    try {
        const mealSession = getMealSession()

        const { error } = await supabaseAdmin
            .from('daily_contributions')
            .insert([{
                user_id: userProfileId,
                restaurant_id: restaurantId,
                menu_image_id: menuImageId,
                contribution_type: 'upload',
                contribution_date: new Date().toISOString().split('T')[0],
                points_earned: pointsEarned,
                meal_session: mealSession
            }])

        if (error) {
            console.error('[KarmaService] Failed to create contribution:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('[KarmaService] Error creating contribution:', error)
        return false
    }
}

/**
 * Get user's karma statistics
 */
export async function getUserKarmaStats(userProfileId: string): Promise<UserKarmaStats | null> {
    try {
        const { data, error } = await supabaseAdmin.rpc('get_user_karma_stats', {
            user_profile_id: userProfileId
        })

        if (error) {
            console.error('[KarmaService] Get stats error:', error)
            return null
        }

        if (data && data.length > 0) {
            const result = data[0]
            return {
                totalKarma: result.total_karma || 0,
                level: result.user_level || 1,
                weeklyKarma: result.weekly_karma || 0,
                monthlyKarma: result.monthly_karma || 0,
                totalUploads: result.total_uploads || 0,
                currentStreak: result.current_streak || 0,
                rankPosition: result.rank_position || null
            }
        }

        return null
    } catch (error) {
        console.error('[KarmaService] Error getting karma stats:', error)
        return null
    }
}

/**
 * Get user's recent karma transactions
 */
export async function getRecentKarmaTransactions(
    userProfileId: string,
    limit: number = 10
): Promise<any[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('karma_transactions')
            .select('*')
            .eq('user_id', userProfileId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[KarmaService] Get transactions error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('[KarmaService] Error getting transactions:', error)
        return []
    }
}

/**
 * Get the leaderboard with optional filtering
 */
export async function getLeaderboard(
    limit: number = 20,
    type: 'all' | 'weekly' | 'monthly' = 'all'
): Promise<any[]> {
    try {
        const orderColumn = type === 'weekly' ? 'weekly_karma' :
            type === 'monthly' ? 'monthly_karma' : 'total_karma'

        const { data, error } = await supabaseAdmin
            .from('leaderboard')
            .select(`
        *,
        user_profiles!inner(
          display_name,
          avatar_url,
          level
        )
      `)
            .order(orderColumn, { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[KarmaService] Get leaderboard error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('[KarmaService] Error getting leaderboard:', error)
        return []
    }
}

/**
 * Get a nice message describing the karma earned
 */
export function getKarmaMessage(breakdown: KarmaBreakdown): string {
    const parts: string[] = []

    if (breakdown.baseEarned > 0) {
        parts.push(`+${breakdown.baseEarned} for upload`)
    }

    if (breakdown.consecutiveBonus > 0) {
        parts.push(`+${breakdown.consecutiveBonus} consecutive meal bonus`)
    }

    if (breakdown.firstUploadBonus > 0) {
        parts.push(`+${breakdown.firstUploadBonus} first upload today`)
    }

    if (breakdown.dailyStreakBonus > 0) {
        parts.push(`+${breakdown.dailyStreakBonus} daily streak! 🔥`)
    }

    if (breakdown.weeklyStreakBonus > 0) {
        parts.push(`+${breakdown.weeklyStreakBonus} weekly streak! 🏆`)
    }

    if (parts.length === 0) {
        return `+${breakdown.totalPoints} karma points`
    }

    return `${parts.join(', ')} = ${breakdown.totalPoints} karma points!`
}

export const karmaService = {
    getMealSession,
    getUserProfileId,
    checkRateLimit,
    awardKarma,
    createContribution,
    getUserKarmaStats,
    getRecentKarmaTransactions,
    getLeaderboard,
    getKarmaMessage
}
