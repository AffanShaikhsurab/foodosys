import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { supabaseAdmin } from '@/lib/supabase'

// Clerk webhook events we handle
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

if (!WEBHOOK_SECRET) {
  console.error('CLERK_WEBHOOK_SECRET is not set in environment variables')
}

export async function POST(request: NextRequest) {
  try {
    // Get the headers
    const svix_id = request.headers.get('svix-id')
    const svix_timestamp = request.headers.get('svix-timestamp')
    const svix_signature = request.headers.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing svix headers')
      return new NextResponse('Error occurred -- no svix headers', {
        status: 400
      })
    }

    // Get the body
    const body = await request.text()
    
    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET || '')

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as any
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return new NextResponse('Error occurred -- invalid signature', {
        status: 400
      })
    }

    // Handle the event
    const eventType = evt.type
    console.log(`Webhook received: ${eventType}`)

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data)
        break
      case 'user.deleted':
        await handleUserDeleted(evt.data)
        break
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUserCreated(data: any) {
  try {
    const { id, email_addresses, first_name, last_name, image_url } = data
    
    // Get the primary email
    const primaryEmail = email_addresses.find((email: any) => email.id === data.primary_email_address_id)
    const email = primaryEmail?.email_address || ''

    // Create display name from first and last name
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0]

    console.log(`Creating user profile for Clerk user: ${id}, email: ${email}`)

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle()

    if (existingProfile) {
      console.log(`Profile already exists for user ${id}`)
      return
    }

    // Create new profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: id,
        display_name: displayName,
        avatar_url: image_url,
        role: 'trainee',
        base_location: null,
        dietary_preference: 'vegetarian',
        karma_points: 0,
        level: 1
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      throw profileError
    }

    console.log(`Successfully created profile for user ${id}`, profile)

    // Initialize leaderboard entry
    const { error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .insert({
        user_id: profile.id,
        rank_position: null,
        total_karma: 0,
        weekly_karma: 0,
        monthly_karma: 0
      })

    if (leaderboardError) {
      console.error('Error creating leaderboard entry:', leaderboardError)
      // Don't throw here - the profile was created successfully
      // The leaderboard can be initialized later if needed
    } else {
      console.log(`Successfully created leaderboard entry for user ${id}`)
    }

  } catch (error) {
    console.error('Error in handleUserCreated:', error)
    throw error
  }
}

async function handleUserDeleted(data: any) {
  try {
    const { id } = data
    
    console.log(`Handling user deletion for Clerk user: ${id}`)

    // Get the user profile first to get the profile ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', id)
      .maybeSingle()

    if (!profile) {
      console.log(`No profile found for user ${id}, nothing to delete`)
      return
    }

    // Delete related records (due to ON DELETE CASCADE, this should be handled automatically)
    // But we'll be explicit about the order for clarity
    
    // Delete leaderboard entry
    const { error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .delete()
      .eq('user_id', profile.id)

    if (leaderboardError) {
      console.error('Error deleting leaderboard entry:', leaderboardError)
    }

    // Delete user badges
    const { error: badgesError } = await supabaseAdmin
      .from('user_badges')
      .delete()
      .eq('user_id', profile.id)

    if (badgesError) {
      console.error('Error deleting user badges:', badgesError)
    }

    // Delete daily contributions
    const { error: contributionsError } = await supabaseAdmin
      .from('daily_contributions')
      .delete()
      .eq('user_id', profile.id)

    if (contributionsError) {
      console.error('Error deleting daily contributions:', contributionsError)
    }

    // Finally delete the user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', id)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
      throw profileError
    }

    console.log(`Successfully deleted profile and related data for user ${id}`)

  } catch (error) {
    console.error('Error in handleUserDeleted:', error)
    throw error
  }
}