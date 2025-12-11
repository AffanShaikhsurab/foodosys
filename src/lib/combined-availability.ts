/**
 * Combined Availability Service
 * 
 * This module combines menu availability and meal availability checks
 * into a SINGLE database query, reducing DB calls from 2 to 1.
 * 
 * Optimization: Previously, the homepage made separate calls to:
 * - getMenuAvailabilityForRestaurants() - 1 DB query
 * - getMealAvailabilityForRestaurants() - 1 DB query (same table!)
 * 
 * This combined function does both in ONE query.
 */

import { supabase } from './supabase-browser'
import { getMealType, getEffectiveTimestamp, isToday } from './utils'

export interface RestaurantAvailabilityInfo {
    hasMenu: boolean
    hasCurrentMealMenu: boolean
    availableMealTypes: string[]
}

export interface CombinedAvailabilityResult {
    menuAvailability: Record<string, boolean>
    mealAvailability: Record<string, RestaurantAvailabilityInfo>
}

// In-memory cache for availability data (short-lived, refreshed on pull-to-refresh)
let availabilityCache: {
    data: CombinedAvailabilityResult | null
    timestamp: number
    restaurantIds: string[]
} = {
    data: null,
    timestamp: 0,
    restaurantIds: []
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Gets the current meal type based on the current time
 */
function getCurrentMealType(): 'Breakfast' | 'Lunch' | 'Dinner' {
    const hour = new Date().getHours()

    if (hour >= 6 && hour < 11) {
        return 'Breakfast'
    } else if (hour >= 11 && hour < 16) {
        return 'Lunch'
    } else {
        return 'Dinner'
    }
}

/**
 * Checks if the cache is valid for the given restaurant IDs
 */
function isCacheValid(restaurantIds: string[]): boolean {
    if (!availabilityCache.data) return false
    if (Date.now() - availabilityCache.timestamp > CACHE_TTL_MS) return false

    // Check if we have all the restaurants we need
    const cachedIds = new Set(availabilityCache.restaurantIds)
    return restaurantIds.every(id => cachedIds.has(id))
}

/**
 * Combined availability check - does BOTH menu and meal availability in ONE query
 * This reduces database calls from 2 to 1 for homepage loading.
 */
export async function getCombinedAvailability(
    restaurantIds: string[],
    forceRefresh = false
): Promise<CombinedAvailabilityResult> {
    // Check cache first
    if (!forceRefresh && isCacheValid(restaurantIds)) {
        console.log('[CombinedAvailability] Returning cached data')
        return availabilityCache.data!
    }

    const menuAvailability: Record<string, boolean> = {}
    const mealAvailability: Record<string, RestaurantAvailabilityInfo> = {}

    // Initialize all restaurants with defaults
    restaurantIds.forEach(id => {
        menuAvailability[id] = false
        mealAvailability[id] = {
            hasMenu: false,
            hasCurrentMealMenu: false,
            availableMealTypes: []
        }
    })

    try {
        // SINGLE QUERY to get all menu data for all restaurants
        const { data: menuImages, error } = await supabase
            .from('menu_images')
            .select('restaurant_id, photo_taken_at, created_at')
            .in('restaurant_id', restaurantIds)
            .in('status', ['ocr_done', 'ocr_pending'])

        if (error) {
            console.error('[CombinedAvailability] Error fetching menu data:', error)
            return { menuAvailability, mealAvailability }
        }

        if (!menuImages || menuImages.length === 0) {
            return { menuAvailability, mealAvailability }
        }

        // Group by restaurant and process
        const menusByRestaurant: Record<string, typeof menuImages> = {}
        menuImages.forEach(menu => {
            if (!menusByRestaurant[menu.restaurant_id]) {
                menusByRestaurant[menu.restaurant_id] = []
            }
            menusByRestaurant[menu.restaurant_id].push(menu)
        })

        const currentMealType = getCurrentMealType()

        // Process each restaurant's data
        Object.entries(menusByRestaurant).forEach(([restaurantId, menus]) => {
            // This restaurant has menus
            menuAvailability[restaurantId] = true

            // Determine available meal types (all menus)
            const availableMealTypes = new Set<string>()
            // Track if there's a menu for the CURRENT meal type AND from TODAY
            let hasCurrentMealMenuToday = false

            menus.forEach(menu => {
                const timestamp = getEffectiveTimestamp(menu)
                const mealType = getMealType(timestamp)
                availableMealTypes.add(mealType)

                // Only mark as "live" if the menu is from TODAY and matches current meal type
                if (mealType === currentMealType && isToday(timestamp)) {
                    hasCurrentMealMenuToday = true
                }
            })

            mealAvailability[restaurantId] = {
                hasMenu: true,
                hasCurrentMealMenu: hasCurrentMealMenuToday,
                availableMealTypes: Array.from(availableMealTypes)
            }
        })

        // Update cache
        availabilityCache = {
            data: { menuAvailability, mealAvailability },
            timestamp: Date.now(),
            restaurantIds: [...restaurantIds]
        }

        console.log('[CombinedAvailability] Fetched data for', restaurantIds.length, 'restaurants with 1 query')

        return { menuAvailability, mealAvailability }
    } catch (error) {
        console.error('[CombinedAvailability] Error:', error)
        return { menuAvailability, mealAvailability }
    }
}

/**
 * Clears the availability cache (useful for pull-to-refresh)
 */
export function clearAvailabilityCache(): void {
    availabilityCache = {
        data: null,
        timestamp: 0,
        restaurantIds: []
    }
}
