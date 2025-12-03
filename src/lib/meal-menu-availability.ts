import { supabase } from './supabase-browser'
import { getMenuTimestamp } from './menu-time-utils'
import { getMealType, getEffectiveTimestamp } from './utils'

export interface RestaurantMealAvailability {
  hasMenu: boolean
  hasCurrentMealMenu: boolean
  availableMealTypes: string[]
}

/**
 * Gets the current meal type based on the current time
 */
export function getCurrentMealType(): 'Breakfast' | 'Lunch' | 'Dinner' {
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
 * Checks if a restaurant has menus for specific meal types
 */
export async function checkRestaurantMealAvailability(restaurantId: string): Promise<RestaurantMealAvailability> {
  try {
    // Get all menu images for the restaurant
    const { data: menuImages, error } = await supabase
      .from('menu_images')
      .select('id, photo_taken_at, created_at')
      .eq('restaurant_id', restaurantId)
      .in('status', ['ocr_done', 'ocr_pending'])

    if (error) {
      console.error('Error checking meal availability:', error)
      return {
        hasMenu: false,
        hasCurrentMealMenu: false,
        availableMealTypes: []
      }
    }

    if (!menuImages || menuImages.length === 0) {
      return {
        hasMenu: false,
        hasCurrentMealMenu: false,
        availableMealTypes: []
      }
    }

    // Determine meal types for each menu
    const availableMealTypes = new Set<string>()
    menuImages.forEach(menu => {
      const timestamp = getEffectiveTimestamp(menu)
      const mealType = getMealType(timestamp)
      availableMealTypes.add(mealType)
    })

    const currentMealType = getCurrentMealType()
    const hasCurrentMealMenu = availableMealTypes.has(currentMealType)

    return {
      hasMenu: true,
      hasCurrentMealMenu,
      availableMealTypes: Array.from(availableMealTypes)
    }
  } catch (error) {
    console.error('Error checking meal availability:', error)
    return {
      hasMenu: false,
      hasCurrentMealMenu: false,
      availableMealTypes: []
    }
  }
}

/**
 * Gets meal availability for multiple restaurants
 */
export async function getMealAvailabilityForRestaurants(restaurantIds: string[]): Promise<Record<string, RestaurantMealAvailability>> {
  const availability: Record<string, RestaurantMealAvailability> = {}

  try {
    // Get all menu images for all restaurants
    const { data: menuImages, error } = await supabase
      .from('menu_images')
      .select('restaurant_id, photo_taken_at, created_at')
      .in('restaurant_id', restaurantIds)
      .in('status', ['ocr_done', 'ocr_pending'])

    if (error) {
      console.error('Error checking meal availability for multiple restaurants:', error)
      // Initialize all as no menu
      restaurantIds.forEach(id => {
        availability[id] = {
          hasMenu: false,
          hasCurrentMealMenu: false,
          availableMealTypes: []
        }
      })
      return availability
    }

    // Initialize all restaurants with no menu
    restaurantIds.forEach(id => {
      availability[id] = {
        hasMenu: false,
        hasCurrentMealMenu: false,
        availableMealTypes: []
      }
    })

    // Group menu images by restaurant
    const menusByRestaurant: Record<string, typeof menuImages> = {}
    if (menuImages) {
      menuImages.forEach(menu => {
        if (!menusByRestaurant[menu.restaurant_id]) {
          menusByRestaurant[menu.restaurant_id] = []
        }
        menusByRestaurant[menu.restaurant_id].push(menu)
      })
    }

    // Process each restaurant's menus
    const currentMealType = getCurrentMealType()
    Object.entries(menusByRestaurant).forEach(([restaurantId, menus]) => {
      const availableMealTypes = new Set<string>()
      
      menus.forEach(menu => {
        const timestamp = getEffectiveTimestamp(menu)
        const mealType = getMealType(timestamp)
        availableMealTypes.add(mealType)
      })

      availability[restaurantId] = {
        hasMenu: true,
        hasCurrentMealMenu: availableMealTypes.has(currentMealType),
        availableMealTypes: Array.from(availableMealTypes)
      }
    })

    return availability
  } catch (error) {
    console.error('Error checking meal availability for multiple restaurants:', error)
    // Initialize all as no menu
    restaurantIds.forEach(id => {
      availability[id] = {
        hasMenu: false,
        hasCurrentMealMenu: false,
        availableMealTypes: []
      }
    })
    return availability
  }
}

/**
 * Gets a display label for the current meal time
 */
export function getCurrentMealLabel(): string {
  const currentMealType = getCurrentMealType()
  return currentMealType
}

/**
 * Gets an emoji icon for the current meal time
 */
export function getCurrentMealIcon(): string {
  const currentMealType = getCurrentMealType()
  const icons: Record<string, string> = {
    'Breakfast': '🌅',
    'Lunch': '🌞',
    'Dinner': '🌙'
  }
  return icons[currentMealType]
}