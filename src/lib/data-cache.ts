/**
 * Client-side Data Cache
 * 
 * Provides centralized caching for frequently accessed data to reduce
 * database requests. Uses sessionStorage for persistence across page navigation.
 * 
 * Cache Types:
 * 1. Restaurant List Cache - for homepage (30 min TTL)
 * 2. Restaurant Detail Cache - for individual restaurants (10 min TTL)
 * 3. Menu Cache - for restaurant menus (5 min TTL)
 */

interface CacheEntry<T> {
    data: T
    timestamp: number
}

interface RestaurantCache {
    id: string
    name: string
    location: string
    slug: string
    latitude?: number
    longitude?: number
}

interface MenuCache {
    menus: any[]
    restaurantSlug: string
}

// Cache TTL values (in milliseconds)
const CACHE_TTL = {
    RESTAURANT_LIST: 30 * 60 * 1000,    // 30 minutes
    RESTAURANT_DETAIL: 10 * 60 * 1000,  // 10 minutes
    MENU_DATA: 5 * 60 * 1000,           // 5 minutes
} as const

const CACHE_KEYS = {
    RESTAURANT_LIST: 'foodosys_restaurants',
    RESTAURANT_DETAIL: 'foodosys_restaurant_',
    MENU_DATA: 'foodosys_menus_',
} as const

/**
 * Safely get from sessionStorage
 */
function safeGetFromStorage<T>(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null

    try {
        const item = sessionStorage.getItem(key)
        if (!item) return null
        return JSON.parse(item) as CacheEntry<T>
    } catch (e) {
        console.warn('[Cache] Failed to parse cache item:', key, e)
        return null
    }
}

/**
 * Safely set to sessionStorage
 */
function safeSetToStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return

    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now()
        }
        sessionStorage.setItem(key, JSON.stringify(entry))
    } catch (e) {
        console.warn('[Cache] Failed to set cache item:', key, e)
    }
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | null, ttl: number): boolean {
    if (!entry) return false
    return Date.now() - entry.timestamp < ttl
}

// ========== RESTAURANT LIST CACHE ==========

export function getCachedRestaurantList(): RestaurantCache[] | null {
    const entry = safeGetFromStorage<RestaurantCache[]>(CACHE_KEYS.RESTAURANT_LIST)
    if (!isCacheValid(entry, CACHE_TTL.RESTAURANT_LIST)) return null
    console.log('[Cache] Using cached restaurant list')
    return entry!.data
}

export function setCachedRestaurantList(restaurants: RestaurantCache[]): void {
    safeSetToStorage(CACHE_KEYS.RESTAURANT_LIST, restaurants)
    console.log('[Cache] Cached restaurant list:', restaurants.length, 'restaurants')
}

// ========== RESTAURANT DETAIL CACHE ==========

export function getCachedRestaurantDetail(slug: string): RestaurantCache | null {
    const key = `${CACHE_KEYS.RESTAURANT_DETAIL}${slug}`
    const entry = safeGetFromStorage<RestaurantCache>(key)
    if (!isCacheValid(entry, CACHE_TTL.RESTAURANT_DETAIL)) return null
    console.log('[Cache] Using cached restaurant detail for:', slug)
    return entry!.data
}

export function setCachedRestaurantDetail(restaurant: RestaurantCache): void {
    const key = `${CACHE_KEYS.RESTAURANT_DETAIL}${restaurant.slug}`
    safeSetToStorage(key, restaurant)
    console.log('[Cache] Cached restaurant detail:', restaurant.slug)
}

// ========== MENU CACHE ==========

export function getCachedMenus(restaurantSlug: string): any[] | null {
    const key = `${CACHE_KEYS.MENU_DATA}${restaurantSlug}`
    const entry = safeGetFromStorage<MenuCache>(key)
    if (!isCacheValid(entry, CACHE_TTL.MENU_DATA)) return null
    console.log('[Cache] Using cached menus for:', restaurantSlug)
    return entry!.data.menus
}

export function setCachedMenus(restaurantSlug: string, menus: any[]): void {
    const key = `${CACHE_KEYS.MENU_DATA}${restaurantSlug}`
    safeSetToStorage(key, { menus, restaurantSlug })
    console.log('[Cache] Cached menus for:', restaurantSlug, 'menus:', menus.length)
}

// ========== CACHE INVALIDATION ==========

export function invalidateMenuCache(restaurantSlug: string): void {
    const key = `${CACHE_KEYS.MENU_DATA}${restaurantSlug}`
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(key)
        console.log('[Cache] Invalidated menu cache for:', restaurantSlug)
    }
}

export function invalidateAllCaches(): void {
    if (typeof window === 'undefined') return

    // Get all keys and remove foodosys-related ones
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('foodosys_')) {
            keysToRemove.push(key)
        }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key))
    console.log('[Cache] Invalidated all caches, removed:', keysToRemove.length, 'items')
}

/**
 * Pre-warm the restaurant detail cache from the list cache
 * This is useful when navigating from homepage to restaurant detail
 */
export function prewarmRestaurantDetail(slug: string): RestaurantCache | null {
    // First check if detail is already cached
    const detailed = getCachedRestaurantDetail(slug)
    if (detailed) return detailed

    // Try to extract from list cache
    const list = getCachedRestaurantList()
    if (list) {
        const restaurant = list.find(r => r.slug === slug)
        if (restaurant) {
            setCachedRestaurantDetail(restaurant)
            return restaurant
        }
    }

    return null
}
