/**
 * Restaurant Image Preloader
 * Preloads and caches restaurant images for instant display
 */

// Collection of high-quality food/restaurant images
const RESTAURANT_IMAGES = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', // Healthy bowl
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', // Pizza
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', // BBQ
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80', // Pancakes
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80', // Salad
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80', // Pasta
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // Platter
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', // Veggie bowl
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80', // Pasta dish
    'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80', // Restaurant interior
]

// For card thumbnails (smaller size for faster load)
const THUMBNAIL_IMAGES = RESTAURANT_IMAGES.map(url => url.replace('w=800', 'w=150'))

const IMAGE_CACHE_KEY = 'foodosys_restaurant_images'

interface ImageCache {
    mapping: Record<string, string>
    thumbnails: Record<string, string>
    timestamp: number
}

/**
 * Get a consistent image URL for a restaurant based on its ID
 * Uses a hash function to deterministically assign images
 */
function getImageIndexFromId(restaurantId: string): number {
    let hash = 0
    for (let i = 0; i < restaurantId.length; i++) {
        const char = restaurantId.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash) % RESTAURANT_IMAGES.length
}

/**
 * Get cached image mappings or create new ones
 */
export function getImageCache(): ImageCache | null {
    if (typeof window === 'undefined') return null

    try {
        const cached = localStorage.getItem(IMAGE_CACHE_KEY)
        if (cached) {
            const parsed = JSON.parse(cached) as ImageCache
            if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
                return parsed
            }
        }
    } catch (e) {
        console.error('Failed to read image cache:', e)
    }
    return null
}

/**
 * Save image mappings to cache
 */
function saveImageCache(cache: ImageCache): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
    } catch (e) {
        console.error('Failed to save image cache:', e)
    }
}

/**
 * Get the hero image URL for a restaurant
 */
export function getRestaurantImageUrl(restaurantId: string): string {
    const cache = getImageCache()
    if (cache?.mapping[restaurantId]) {
        return cache.mapping[restaurantId]
    }

    const index = getImageIndexFromId(restaurantId)
    return RESTAURANT_IMAGES[index]
}

/**
 * Get the thumbnail image URL for a restaurant
 */
export function getRestaurantThumbnailUrl(restaurantId: string): string {
    const cache = getImageCache()
    if (cache?.thumbnails[restaurantId]) {
        return cache.thumbnails[restaurantId]
    }

    const index = getImageIndexFromId(restaurantId)
    return THUMBNAIL_IMAGES[index]
}

/**
 * Preload a single image and return a promise
 */
function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Failed to load: ${url}`))
        img.src = url
    })
}

/**
 * Preload all restaurant images and cache the mappings
 * Call this when restaurants are loaded on the home page
 */
export async function preloadRestaurantImages(restaurantIds: string[]): Promise<void> {
    if (typeof window === 'undefined') return

    // Check if we already have a valid cache
    const existingCache = getImageCache()
    if (existingCache) {
        // Check if all restaurants are already cached
        const allCached = restaurantIds.every(id => existingCache.mapping[id])
        if (allCached) {
            console.log('🖼️ All restaurant images already cached')
            return
        }
    }

    console.log('🖼️ Preloading restaurant images...')

    const mapping: Record<string, string> = {}
    const thumbnails: Record<string, string> = {}
    const preloadPromises: Promise<void>[] = []

    // Create mappings and start preloading
    restaurantIds.forEach(id => {
        const index = getImageIndexFromId(id)
        const heroUrl = RESTAURANT_IMAGES[index]
        const thumbUrl = THUMBNAIL_IMAGES[index]

        mapping[id] = heroUrl
        thumbnails[id] = thumbUrl

        // Preload both hero and thumbnail
        preloadPromises.push(preloadImage(heroUrl))
        preloadPromises.push(preloadImage(thumbUrl))
    })

    // Wait for all images to preload (with timeout)
    try {
        await Promise.race([
            Promise.allSettled(preloadPromises),
            new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
        ])

        // Save the cache
        saveImageCache({
            mapping,
            thumbnails,
            timestamp: Date.now()
        })

        console.log('🖼️ Restaurant images preloaded and cached!')
    } catch (e) {
        console.error('Failed to preload some images:', e)
    }
}

/**
 * Get all preloaded image URLs for prefetch hints
 */
export function getAllImageUrls(): string[] {
    return [...RESTAURANT_IMAGES, ...THUMBNAIL_IMAGES]
}
