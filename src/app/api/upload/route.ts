
import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { ocrService } from '@/lib/ocr'
import { ValidationError, NotFoundError, DatabaseError, ExternalServiceError, handleAPIError } from '@/lib/errors'
import { logUpload, logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  logUpload('Upload API request received', {
    operation: 'api_request_start',
    requestId,
    method: 'POST',
    url: '/api/upload',
    userAgent: request.headers.get('user-agent'),
    contentType: request.headers.get('content-type')
  })
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    logUpload('Authentication verification started', {
      operation: 'auth_verification_start',
      requestId,
      hasAuthHeader: !!authHeader,
      hasToken: !!token
    })
    
    let userId: string | null = null
    
    if (token) {
      // Verify JWT token
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        logUpload('JWT token verification failed', {
          operation: 'jwt_auth_failed',
          requestId,
          error: error?.message,
          hasUser: !!user
        })
        
        return NextResponse.json(
          { error: 'Invalid or expired authentication token' },
          { status: 401 }
        )
      }
      userId = user.id
      
      logUpload('JWT token verification successful', {
        operation: 'jwt_auth_success',
        requestId,
        userId
      })
    } else {
      // Try to get user from session cookie
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        logUpload('Session cookie authentication failed', {
          operation: 'session_auth_failed',
          requestId,
          error: error?.message,
          hasUser: !!user
        })
        
        return NextResponse.json(
          { error: 'Authentication required. Please sign in to upload photos.' },
          { status: 401 }
        )
      }
      userId = user.id
      
      logUpload('Session cookie authentication successful', {
        operation: 'session_auth_success',
        requestId,
        userId
      })
    }

    if (!userId) {
      logUpload('No valid authentication found', {
        operation: 'no_auth_found',
        requestId
      })
      
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to upload photos.' },
        { status: 401 }
      )
    }
    // Check if this is a JSON request (base64 upload) or form data (file upload)
    const contentType = request.headers.get('content-type') || ''
    
    let file: File | null = null
    let restaurantSlug: string | null = null
    let photoTakenAt: string | null = null
    
    if (contentType.includes('application/json')) {
      // Handle base64 upload from camera
      const body = await request.json()
      const { base64, timestamp, fileName, restaurantSlug: slug } = body
      
      if (!base64 || !slug) {
        throw new ValidationError('Missing base64 image data or restaurant slug')
      }
      
      restaurantSlug = slug
      photoTakenAt = timestamp || new Date().toISOString()
      
      // Convert base64 to File
      const arr = base64.split(',')
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      
      file = new File([u8arr], fileName || 'menu-photo.jpg', { type: mime })
    } else {
      // Handle traditional file upload
      const formData = await request.formData()
      file = formData.get('file') as File
      restaurantSlug = formData.get('restaurantSlug') as string
      photoTakenAt = new Date().toISOString()
    }

    if (!file || !restaurantSlug) {
      throw new ValidationError('Missing file or restaurant slug')
    }

    // Get restaurant by slug
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', restaurantSlug)
      .single()

    if (restaurantError || !restaurant) {
      throw new NotFoundError('Restaurant not found')
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create a timestamp-based filename
    const timestamp = photoTakenAt || new Date().toISOString()
    const timestampStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-')
    const fileName = `${timestampStr}-${file.name}`
    const filePath = `menus/${restaurantSlug}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, buffer, { contentType: file.type })

    if (uploadError) {
      throw new DatabaseError('Failed to upload file to storage', uploadError)
    }

    // Create a signed URL for OCR processing
    const { data: signedURLData, error: signedURLError } = await supabase.storage
      .from('menu-images')
      .createSignedUrl(filePath, 300) // 5 minutes expiry

    if (signedURLError) {
      throw new DatabaseError('Failed to create signed URL', signedURLError)
    }

    // Create menu image record
    const { data: menuImageData, error: menuImageError } = await supabase
      .from('menu_images')
      .insert({
        restaurant_id: restaurant.id,
        storage_path: filePath,
        mime: file.type,
        status: 'ocr_pending',
        uploaded_by: userId,
        photo_taken_at: photoTakenAt
      })
      .select()
      .single()

    if (menuImageError) {
      throw new DatabaseError('Failed to create menu image record', menuImageError)
    }

    // Call OCR.Space API using the OCR service
    let ocrResult
    try {
      ocrResult = await ocrService.parseImageFromUrl(signedURLData.signedUrl, {
        language: 'eng',
        OCREngine: 3,
        isOverlayRequired: true
      })
    } catch (error) {
      // Update status to rejected
      await supabaseAdmin
        .from('menu_images')
        .update({ status: 'rejected' })
        .eq('id', menuImageData.id)

      throw new ExternalServiceError('OCR.space', 'OCR processing failed', error)
    }

    // Save OCR result
    const { data: ocrData, error: ocrSaveError } = await supabase
      .from('ocr_results')
      .insert({
        image_id: menuImageData.id,
        raw_json: ocrResult,
        text: ocrResult.ParsedResults?.[0]?.ParsedText || '',
        words: ocrResult.ParsedResults?.[0]?.TextOverlay?.Lines || [],
        language: 'eng',
        ocr_engine: 3,
        processing_time_ms: ocrResult.ProcessingTimeInMilliseconds || 0
      })
      .select()
      .single()

    if (ocrSaveError) {
      throw new DatabaseError('Failed to save OCR result', ocrSaveError)
    }

    // Update menu image status
    const { error: updateError } = await supabaseAdmin
      .from('menu_images')
      .update({
        status: 'ocr_done',
        ocr_result_id: ocrData.id
      })
      .eq('id', menuImageData.id)

    if (updateError) {
      throw new DatabaseError('Failed to update menu image status', updateError)
    }

    return NextResponse.json({
      success: true,
      menuImage: menuImageData,
      ocrResult: ocrData
    })
  } catch (error) {
    return handleAPIError(error)
  }
}