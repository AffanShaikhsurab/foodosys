import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const { imageId } = params

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: No auth token provided' },
        { status: 401 }
      )
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')

    // Verify the user's token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid auth token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get the image details before deletion
    const { data: menuImage, error: imageError } = await supabaseAdmin
      .from('menu_images')
      .select('storage_path, restaurant_id')
      .eq('id', imageId)
      .single()

    if (imageError || !menuImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Parse request body for deletion reason
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || 'No reason provided'

    // Log the deletion in admin_activity_log
    const { error: logError } = await supabaseAdmin
      .from('admin_activity_log')
      .insert({
        admin_user_id: user.id,
        action_type: 'delete_image',
        target_id: imageId,
        target_type: 'menu_image',
        reason: reason,
        metadata: {
          storage_path: menuImage.storage_path,
          restaurant_id: menuImage.restaurant_id
        }
      })

    if (logError) {
      console.error('Failed to log admin activity:', logError)
      // Continue with deletion even if logging fails
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('menu-images')
      .remove([menuImage.storage_path])

    if (storageError) {
      console.error('Failed to delete from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete the menu_image record (this will cascade to OCR results and menus due to FK constraints)
    const { error: deleteError } = await supabaseAdmin
      .from('menu_images')
      .delete()
      .eq('id', imageId)

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete image: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      imageId,
      reason
    })

  } catch (error) {
    console.error('Error in delete-image API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
