import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { NotFoundError, DatabaseError, handleAPIError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/restaurants/[slug]/info
 * 
 * OPTIMIZATION: Fetches a single restaurant by slug instead of all restaurants.
 * This is much more efficient than the previous approach which fetched all
 * restaurants and then filtered client-side.
 * 
 * Old approach: SELECT * FROM restaurants (all rows)
 * New approach: SELECT * FROM restaurants WHERE slug = ? (single row)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    const startTime = Date.now()

    try {
        const { slug } = params

        // Single query for single restaurant
        const { data: restaurant, error } = await (await createServerClient())
            .from('restaurants')
            .select('id, name, location, distance_estimate_m, slug, created_at, latitude, longitude')
            .eq('slug', slug)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundError('Restaurant not found')
            }
            throw new DatabaseError('Failed to fetch restaurant', error)
        }

        console.log(`[Restaurant Info API] Fetched restaurant in ${Date.now() - startTime}ms:`, { slug, id: restaurant.id })

        return NextResponse.json({ restaurant })
    } catch (error) {
        return handleAPIError(error)
    }
}
