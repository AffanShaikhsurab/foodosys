import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { NotFoundError, DatabaseError, handleAPIError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    // First get the restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (restaurantError || !restaurant) {
      throw new NotFoundError('Restaurant not found')
    }
    
    // Get the menus for this restaurant
    const { data, error } = await supabase
      .from('menu_images')
      .select(`
        *,
        ocr_results(*)
      `)
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'ocr_done')
      .order('photo_taken_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      throw new DatabaseError('Failed to fetch menus', error)
    }
    
    return NextResponse.json({ menus: data })
  } catch (error) {
    return handleAPIError(error)
  }
}