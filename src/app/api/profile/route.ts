import { createServerSupabaseClient } from '@/lib/clerk-supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { display_name, avatar_url, role, base_location, dietary_preference } = await request.json()

    // Use server client with Clerk authentication
    const supabase = await createServerSupabaseClient()

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 })
    }

    // Create new profile using admin client (bypasses RLS for initial creation)
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userId,
        display_name,
        avatar_url,
        role: role || 'trainee',
        base_location,
        dietary_preference: dietary_preference || 'vegetarian',
        karma_points: 0,
        level: 1
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Initialize leaderboard entry using admin client
    await supabaseAdmin
      .from('leaderboard')
      .insert({
        user_id: userId,
        rank_position: null,
        total_karma: 0,
        weekly_karma: 0,
        monthly_karma: 0
      })

    return NextResponse.json({ profile: data }, { status: 201 })
  } catch (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('user_id')

    // Allow users to fetch their own profile or admins to fetch any profile
    const targetUserId = requestedUserId || userId
    
    // Check if user is admin or requesting their own profile
    const isAdmin = await checkIfAdmin(userId)
    if (!isAdmin && targetUserId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use server client with Clerk authentication
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { display_name, avatar_url, role, base_location, dietary_preference, karma_points, level } = await request.json()

    // Use server client with Clerk authentication
    const supabase = await createServerSupabaseClient()

    // Check if user is admin or updating their own profile
    const isAdmin = await checkIfAdmin(userId)
    if (!isAdmin) {
      // Non-admin users can only update their own profile and certain fields
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single()
      
      if (!existingProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
    }

    // Build update object with allowed fields
    const updateData: any = {
      display_name,
      avatar_url,
      base_location,
      dietary_preference,
      updated_at: new Date().toISOString()
    }

    // Only admins can update role, karma_points, and level
    if (isAdmin) {
      if (role !== undefined) updateData.role = role
      if (karma_points !== undefined) updateData.karma_points = karma_points
      if (level !== undefined) updateData.level = level
    }

    const targetUserId = isAdmin && role ? await getTargetUserId(request) : userId

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', targetUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get target user ID from request
async function getTargetUserId(request: NextRequest): Promise<string> {
  try {
    const body = await request.json()
    return body.user_id
  } catch {
    return ''
  }
}

// Helper function to check if user is admin
async function checkIfAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    return data?.role === 'admin'
  } catch {
    return false
  }
}