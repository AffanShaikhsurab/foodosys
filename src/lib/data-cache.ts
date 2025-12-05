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

// ========== STATIC RESTAURANT DATA CACHE ==========
// Uses localStorage for persistence across browser sessions
// This data rarely changes, so we cache it permanently for instant hero section rendering

export interface StaticRestaurantData {
    id: string
    name: string
    location: string
    slug: string
    imageUrl: string      // Hero image URL
    thumbnailUrl: string  // Card thumbnail URL
}

const STATIC_CACHE_KEY = 'foodosys_static_restaurants'
const STATIC_CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

interface StaticRestaurantCache {
    restaurants: Record<string, StaticRestaurantData>
    timestamp: number
}

/**
 * Get static restaurant data by slug - used for instant hero section rendering
 * Returns null if not cached, allowing component to show transition data or fetch
 */
export function getStaticRestaurantBySlug(slug: string): StaticRestaurantData | null {
    if (typeof window === 'undefined') return null

    try {
        const cached = localStorage.getItem(STATIC_CACHE_KEY)
        if (!cached) return null

        const parsed: StaticRestaurantCache = JSON.parse(cached)

        // Check if cache is still valid (7 days)
        if (Date.now() - parsed.timestamp > STATIC_CACHE_TTL) {
            console.log('[StaticCache] Cache expired, clearing')
            localStorage.removeItem(STATIC_CACHE_KEY)
            return null
        }

        const restaurant = parsed.restaurants[slug]
        if (restaurant) {
            console.log('[StaticCache] ✅ Instant hit for:', slug)
            return restaurant
        }
    } catch (e) {
        console.warn('[StaticCache] Failed to read:', e)
    }

    return null
}

/**
 * Get static restaurant data by ID
 */
export function getStaticRestaurantById(id: string): StaticRestaurantData | null {
    if (typeof window === 'undefined') return null

    try {
        const cached = localStorage.getItem(STATIC_CACHE_KEY)
        if (!cached) return null

        const parsed: StaticRestaurantCache = JSON.parse(cached)

        if (Date.now() - parsed.timestamp > STATIC_CACHE_TTL) {
            return null
        }

        // Find by ID
        const restaurant = Object.values(parsed.restaurants).find(r => r.id === id)
        return restaurant || null
    } catch (e) {
        console.warn('[StaticCache] Failed to read by ID:', e)
    }

    return null
}

/**
 * Cache all static restaurant data - called when homepage loads
 * This pre-populates the cache so restaurant detail pages load instantly
 */
export function cacheStaticRestaurants(restaurants: StaticRestaurantData[]): void {
    if (typeof window === 'undefined') return

    try {
        // Build lookup by slug for O(1) access
        const restaurantMap: Record<string, StaticRestaurantData> = {}
        restaurants.forEach(r => {
            restaurantMap[r.slug] = r
        })

        const cache: StaticRestaurantCache = {
            restaurants: restaurantMap,
            timestamp: Date.now()
        }

        localStorage.setItem(STATIC_CACHE_KEY, JSON.stringify(cache))
        console.log('[StaticCache] 📦 Cached', restaurants.length, 'restaurants for instant loading')
    } catch (e) {
        console.warn('[StaticCache] Failed to cache:', e)
    }
}

/**
 * Check if static cache exists and is valid
 */
export function hasValidStaticCache(): boolean {
    if (typeof window === 'undefined') return false

    try {
        const cached = localStorage.getItem(STATIC_CACHE_KEY)
        if (!cached) return false

        const parsed: StaticRestaurantCache = JSON.parse(cached)
        return Date.now() - parsed.timestamp < STATIC_CACHE_TTL
    } catch {
        return false
    }
}
