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
  console.log('[DELETE-API] === DELETE IMAGE REQUEST STARTED ===')
  console.log('[DELETE-API] Image ID:', params.imageId)
  
  try {
    const { imageId } = params

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    console.log('[DELETE-API] Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('[DELETE-API] ❌ No auth header provided')
      return NextResponse.json(
        { error: 'Unauthorized: No auth token provided' },
        { status: 401 }
      )
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    console.log('[DELETE-API] Token extracted, length:', token.length)

    // Verify the user's token
    console.log('[DELETE-API] Verifying user token...')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    console.log('[DELETE-API] Auth result:', { userId: user?.id, hasError: !!authError, errorMessage: authError?.message })
    
    if (authError || !user) {
      console.log('[DELETE-API] ❌ Auth verification failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized: Invalid auth token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    console.log('[DELETE-API] Checking admin status for user:', user.id)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    console.log('[DELETE-API] Profile result:', { role: profile?.role, hasProfile: !!profile, profileError: profileError?.message })
    
    if (profileError || !profile || profile.role !== 'admin') {
      console.log('[DELETE-API] ❌ Admin check failed:', { 
        profileError: profileError?.message, 
        hasProfile: !!profile, 
        role: profile?.role 
      })
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    console.log('[DELETE-API] ✅ Admin authorization successful')

    // Get the image details before deletion
    console.log('[DELETE-API] Fetching image details for ID:', imageId)
    const { data: menuImage, error: imageError } = await supabaseAdmin
      .from('menu_images')
      .select('storage_path, restaurant_id')
      .eq('id', imageId)
      .single()

    console.log('[DELETE-API] Image query result:', { 
      hasImage: !!menuImage, 
      storagePath: menuImage?.storage_path,
      imageError: imageError?.message 
    })

    if (imageError || !menuImage) {
      console.log('[DELETE-API] ❌ Image not found:', imageError?.message)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    console.log('[DELETE-API] ✅ Image found:', menuImage.storage_path)

    // Parse request body for deletion reason
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || 'No reason provided'
    console.log('[DELETE-API] Deletion reason:', reason)

    // Log the deletion in admin_activity_log
    console.log('[DELETE-API] Logging admin activity...')
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
      console.error('[DELETE-API] ⚠️ Failed to log admin activity:', logError)
      // Continue with deletion even if logging fails
    } else {
      console.log('[DELETE-API] ✅ Admin activity logged')
    }

    // Delete from storage
    console.log('[DELETE-API] Deleting from storage:', menuImage.storage_path)
    const { error: storageError } = await supabaseAdmin.storage
      .from('menu-images')
      .remove([menuImage.storage_path])

    if (storageError) {
      console.error('[DELETE-API] ⚠️ Failed to delete from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    } else {
      console.log('[DELETE-API] ✅ Storage deletion successful')
    }

    // Delete the menu_image record (this will cascade to OCR results and menus due to FK constraints)
    console.log('[DELETE-API] Deleting database record:', imageId)
    const { error: deleteError } = await supabaseAdmin
      .from('menu_images')
      .delete()
      .eq('id', imageId)

    if (deleteError) {
      console.log('[DELETE-API] ❌ Database deletion failed:', deleteError.message)
      return NextResponse.json(
        { error: `Failed to delete image: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('[DELETE-API] ✅ Database deletion successful')
    console.log('[DELETE-API] === DELETE IMAGE REQUEST COMPLETED SUCCESSFULLY ===')

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      imageId,
      reason
    })

  } catch (error) {
    console.error('[DELETE-API] ❌ Error in delete-image API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
