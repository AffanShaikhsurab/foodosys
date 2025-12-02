import { createServerSupabaseClient } from '@/lib/clerk-supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Clerk (optional for leaderboard viewing)
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()

    // Use server client with Clerk authentication
    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type') || 'all' // 'all', 'weekly', 'monthly'

    // Build query based on type
    let query = supabase
      .from('leaderboard')
      .select(`
        *,
        user_profiles!inner(
          display_name,
          avatar_url,
          level
        )
      `)
      .order('rank_position', { ascending: true })
      .limit(limit)

    const { data: leaderboard, error } = await query

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If user is authenticated, include their position even if not in top results
    let userEntry = null
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (profile) {
        const { data: userData } = await supabase
          .from('leaderboard')
          .select(`
            *,
            user_profiles!inner(
              display_name,
              avatar_url,
              level
            )
          `)
          .eq('user_id', profile.id)
          .single()

        userEntry = userData
      }
    }

    return NextResponse.json({ 
      leaderboard: leaderboard || [],
      userEntry
    })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
