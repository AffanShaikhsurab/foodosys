import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DatabaseError, handleAPIError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, location, distance_estimate_m, slug, created_at, latitude, longitude')
      .order('name')

    if (error) {
      throw new DatabaseError('Failed to fetch restaurants', error)
    }

    return NextResponse.json({ restaurants: data })
  } catch (error) {
    return handleAPIError(error)
  }
}