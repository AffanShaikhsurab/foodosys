import { supabase } from './supabase'

export async function checkMenuAvailability(restaurantId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('menu_images')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .in('status', ['ocr_done', 'ocr_pending'])
      .limit(1)
    
    if (error) {
      console.error('Error checking menu availability:', error)
      return false
    }
    
    return data && data.length > 0
  } catch (error) {
    console.error('Error checking menu availability:', error)
    return false
  }
}

export async function getMenuAvailabilityForRestaurants(restaurantIds: string[]): Promise<Record<string, boolean>> {
  const availability: Record<string, boolean> = {}
  
  try {
    const { data, error } = await supabase
      .from('menu_images')
      .select('restaurant_id')
      .in('restaurant_id', restaurantIds)
      .in('status', ['ocr_done', 'ocr_pending'])
    
    if (error) {
      console.error('Error checking menu availability for multiple restaurants:', error)
      // Initialize all as false
      restaurantIds.forEach(id => {
        availability[id] = false
      })
      return availability
    }
    
    // Initialize all as false
    restaurantIds.forEach(id => {
      availability[id] = false
    })
    
    // Mark restaurants with menus as true
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        availability[item.restaurant_id] = true
      })
    }
    
    return availability
  } catch (error) {
    console.error('Error checking menu availability for multiple restaurants:', error)
    // Initialize all as false
    restaurantIds.forEach(id => {
      availability[id] = false
    })
    return availability
  }
}