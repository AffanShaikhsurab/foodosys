
import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { ocrService } from '@/lib/ocr'
import { ValidationError, NotFoundError, DatabaseError, ExternalServiceError, handleAPIError } from '@/lib/errors'
import { logUpload, logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  // Debug: Check if OCR API key is available
  console.log(`[Upload API] OCR API Key check:`, { 
    hasOcrKey: !!process.env.OCRSPACE_API_KEY,
    ocrKeyValue: process.env.OCRSPACE_API_KEY?.substring(0, 8) + '...',
    requestId
  })
  
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

    console.log(`[Upload API] File validation:`, { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size,
      restaurantSlug,
      requestId 
    })

    // Get restaurant by slug
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', restaurantSlug)
      .single()

    console.log(`[Upload API] Restaurant lookup:`, { 
      restaurantError: restaurantError?.message,
      restaurantFound: !!restaurant,
      slug: restaurantSlug,
      requestId 
    })

    if (restaurantError || !restaurant) {
      console.error(`[Upload API] Restaurant not found:`, {
        slug: restaurantSlug,
        error: restaurantError?.message,
        requestId
      })
      throw new NotFoundError('Restaurant not found')
    }

    const restaurantId = (restaurant as any).id
    if (!restaurantId) {
      throw new Error('Restaurant has no ID')
    }

    // Convert file to buffer
    console.log(`[Upload API] Converting file to buffer:`, { 
      fileName: file.name, 
      fileSize: file.size,
      requestId 
    })
    
    let buffer: Buffer
    try {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      console.log(`[Upload API] Buffer created successfully:`, { 
        bufferSize: buffer.length,
        requestId 
      })
    } catch (bufferError) {
      console.error(`[Upload API] Failed to convert file to buffer:`, { 
        error: bufferError instanceof Error ? bufferError.message : String(bufferError),
        fileName: file.name,
        requestId 
      })
      throw new Error(`Failed to convert file: ${bufferError instanceof Error ? bufferError.message : 'Unknown error'}`)
    }
    
    // Create a timestamp-based filename
    const timestamp = photoTakenAt || new Date().toISOString()
    const timestampStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-')
    const fileName = `${timestampStr}-${file.name}`
    const filePath = `menus/${restaurantSlug}/${fileName}`

    console.log(`[Upload API] File preparation:`, { 
      fileName, 
      filePath, 
      timestampStr,
      bufferLength: buffer.length,
      requestId 
    })

    console.log(`[Upload API] Uploading file to storage:`, { 
      filePath, 
      fileSize: buffer.length, 
      mimeType: file.type, 
      restaurantId,
      requestId 
    })

    // Upload to Supabase Storage using admin client (better permissions)
    console.log(`[Upload API] About to call supabaseAdmin.storage.upload with:`, {
      bucket: 'menu-images',
      path: filePath,
      bufferLength: buffer.length,
      contentType: file.type,
      upsert: false,
      requestId
    })

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('menu-images')
      .upload(filePath, buffer, { contentType: file.type, upsert: false })

    console.log(`[Upload API] Storage upload completed`, {
      requestId,
      timestamp: new Date().toISOString()
    })

    console.log(`[Upload API] Storage upload response details:`, { 
      hasError: !!uploadError,
      uploadError: uploadError?.message, 
      uploadErrorCode: (uploadError as any)?.status,
      uploadErrorDetails: (uploadError as any)?.error,
      hasUploadData: !!uploadData,
      uploadDataPath: uploadData?.path,
      uploadDataFullPath: uploadData?.fullPath,
      requestId,
      timestamp: new Date().toISOString()
    })

    if (uploadError) {
      console.error(`[Upload API] Storage upload FAILED - detailed error:`, { 
        error: JSON.stringify(uploadError),
        errorMessage: uploadError.message,
        errorStatus: (uploadError as any)?.status,
        errorDetails: (uploadError as any)?.details,
        filePath, 
        requestId,
        bufferSize: buffer.length,
        fileType: file.type
      })
      throw new DatabaseError('Failed to upload file to storage', uploadError)
    }

    // Verify file was actually uploaded
    if (!uploadData) {
      console.error(`[Upload API] Upload succeeded but no data returned:`, { uploadData, filePath, requestId })
      throw new Error('File upload succeeded but no path returned from storage')
    }

    console.log(`[Upload API] File uploaded successfully to storage`, { 
      uploadedPath: uploadData.path, 
      filePath, 
      requestId 
    })

    // Create a signed URL for OCR processing using admin client (better permissions)
    const { data: signedURLData, error: signedURLError } = await supabaseAdmin.storage
      .from('menu-images')
      .createSignedUrl(filePath, 300) // 5 minutes expiry

    console.log(`[Upload API] Signed URL creation response:`, { signedURLError: signedURLError?.message, hasSignedUrl: !!signedURLData, requestId })

    if (signedURLError) {
      console.error(`[Upload API] Signed URL creation failed:`, { 
        error: signedURLError, 
        errorMessage: signedURLError.message,
        errorStatus: (signedURLError as any)?.status,
        filePath, 
        requestId 
      })
      throw new DatabaseError('Failed to create signed URL', signedURLError)
    }

    const signedUrl = signedURLData?.signedUrl
    if (!signedUrl) {
      throw new Error('Failed to generate signed URL for OCR processing')
    }

    // Also create a public URL for the file (for reference)
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${filePath}`
    console.log(`[Upload API] URLs created:`, { 
      publicUrl, 
      signedUrlExpiry: '300 seconds', 
      requestId 
    })

    // Create menu image record
    console.log(`[Upload API] Creating menu image record in database:`, { 
      restaurant_id: restaurantId, 
      storage_path: filePath,
      uploaded_by: userId,
      mime: file.type,
      status: 'ocr_pending',
      requestId,
      timestamp: new Date().toISOString()
    })
    
    const { data: menuImageData, error: menuImageError } = await supabaseAdmin
      .from('menu_images')
      .insert([{
        restaurant_id: restaurantId,
        storage_path: filePath,
        mime: file.type,
        status: 'ocr_pending',
        uploaded_by: userId
      }])
      .select()
      .single()

    console.log(`[Upload API] Menu image record insertion response:`, { 
      hasError: !!menuImageError,
      menuImageError: menuImageError?.message,
      menuImageErrorDetails: (menuImageError as any)?.details,
      menuImageId: (menuImageData as any)?.id,
      menuImageRestaurantId: (menuImageData as any)?.restaurant_id,
      menuImageStoragePath: (menuImageData as any)?.storage_path,
      requestId,
      timestamp: new Date().toISOString()
    })

    if (menuImageError || !menuImageData) {
      console.error(`[Upload API] Failed to create menu image record:`, { 
        error: menuImageError, 
        errorMessage: menuImageError?.message,
        errorDetails: (menuImageError as any)?.details,
        hasData: !!menuImageData, 
        requestId 
      })
      throw new DatabaseError('Failed to create menu image record', menuImageError)
    }

    const menuImageId = (menuImageData as any).id
    if (!menuImageId) {
      throw new Error('Menu image has no ID')
    }

    // Convert buffer to base64 with proper data URI format for OCR processing
    // Format required by OCR.space: data:<content_type>;base64,<base64_string>
    const base64String = buffer.toString('base64')
    const base64Image = `data:${file.type};base64,${base64String}`
    
    console.log(`[Upload API] Converted image to base64 with data URI:`, { 
      base64Length: base64Image.length,
      mimeType: file.type,
      imageId: menuImageId, 
      requestId 
    })

    // Call OCR.Space API using the OCR service with base64 (more reliable than public URL)
    console.log(`[Upload API] Starting OCR processing:`, { imageId: menuImageId, method: 'base64', requestId, timestamp: new Date().toISOString() })
    
    let ocrResult = null
    let ocrProcessingSucceeded = false
    let ocrErrorDetails = null
    
    try {
      console.log(`[Upload API] Calling ocrService.parseImageFromBase64:`, {
        base64Length: base64Image.length,
        mimeType: file.type,
        imageId: menuImageId,
        requestId,
        timestamp: new Date().toISOString()
      })
      
      ocrResult = await ocrService.parseImageFromBase64(base64Image, {
        language: 'eng',
        OCREngine: 3,
        isOverlayRequired: true
      })
      
      console.log(`[Upload API] OCR Service response received:`, {
        hasResponse: !!ocrResult,
        isErrored: ocrResult?.IsErroredOnProcessing,
        hasParsedResults: !!ocrResult?.ParsedResults,
        parsedResultsCount: ocrResult?.ParsedResults?.length || 0,
        processingTime: ocrResult?.ProcessingTimeInMilliseconds,
        requestId,
        timestamp: new Date().toISOString()
      })
      
      if (ocrResult?.IsErroredOnProcessing) {
        console.error(`[Upload API] OCR Result indicates error:`, {
          isErroredOnProcessing: ocrResult.IsErroredOnProcessing,
          errorMessage: ocrResult.ErrorMessage,
          errorMessages: ocrResult.ErrorMessages,
          requestId,
          timestamp: new Date().toISOString()
        })
        ocrErrorDetails = {
          isErroredOnProcessing: true,
          errorMessages: ocrResult.ErrorMessage || ocrResult.ErrorMessages
        }
      } else if (!ocrResult?.ParsedResults || ocrResult.ParsedResults.length === 0) {
        console.warn(`[Upload API] OCR succeeded but no parsed results:`, {
          hasParsedResults: !!ocrResult?.ParsedResults,
          parsedResultsLength: ocrResult?.ParsedResults?.length,
          requestId,
          timestamp: new Date().toISOString()
        })
        ocrErrorDetails = {
          noParsedResults: true,
          message: 'OCR succeeded but returned no text'
        }
      } else {
        console.log(`[Upload API] OCR completed successfully:`, {
          success: true,
          processingTime: ocrResult.ProcessingTimeInMilliseconds,
          textLength: ocrResult.ParsedResults[0]?.ParsedText?.length || 0,
          textPreview: ocrResult.ParsedResults[0]?.ParsedText?.substring(0, 100),
          textOverlayLines: ocrResult.ParsedResults[0]?.TextOverlay?.Lines?.length || 0,
          requestId,
          timestamp: new Date().toISOString()
        })
        ocrProcessingSucceeded = true
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : ''
      
      ocrErrorDetails = {
        errorMessage: errorMsg,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorStack: errorStack,
        timestamp: new Date().toISOString()
      }
      
      console.error(`[Upload API] OCR processing FAILED:`, {
        error: errorMsg,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        method: 'base64',
        fullError: JSON.stringify({
          message: errorMsg,
          name: error instanceof Error ? error.name : 'Unknown',
          stack: errorStack?.substring(0, 500)
        }),
        requestId,
        timestamp: new Date().toISOString()
      })
      
      console.log(`[Upload API] Continuing without OCR - image will be stored as ocr_pending`, {
        imageId: menuImageId,
        requestId,
        reason: errorMsg,
        timestamp: new Date().toISOString()
      })
    }

    // Only save OCR result if OCR was successful
    let ocrResultId = null
    let ocrData = null
    
    if (ocrProcessingSucceeded && ocrResult) {
      console.log(`[Upload API] Preparing to save OCR result to database:`, {
        imageId: menuImageId,
        hasText: !!ocrResult.ParsedResults?.[0]?.ParsedText,
        textLength: ocrResult.ParsedResults?.[0]?.ParsedText?.length || 0,
        hasTextOverlay: !!ocrResult.ParsedResults?.[0]?.TextOverlay,
        overlayLines: ocrResult.ParsedResults?.[0]?.TextOverlay?.Lines?.length || 0,
        processingTimeMs: ocrResult.ProcessingTimeInMilliseconds,
        requestId,
        timestamp: new Date().toISOString()
      })
      
      const ocrResultPayload = {
        image_id: menuImageId,
        raw_json: ocrResult,
        text: ocrResult.ParsedResults?.[0]?.ParsedText || '',
        words: ocrResult.ParsedResults?.[0]?.TextOverlay?.Lines || [],
        language: 'eng',
        ocr_engine: 3,
        processing_time_ms: ocrResult.ProcessingTimeInMilliseconds || 0
      }
      
      console.log(`[Upload API] OCR result payload prepared:`, {
        imageId: menuImageId,
        textLength: ocrResultPayload.text.length,
        wordsCount: ocrResultPayload.words.length,
        processingTimeMs: ocrResultPayload.processing_time_ms,
        requestId,
        timestamp: new Date().toISOString()
      })
      
      const { data: savedOcrData, error: ocrSaveError } = await supabaseAdmin
        .from('ocr_results')
        .insert([ocrResultPayload])
        .select()
        .single()

      console.log(`[Upload API] OCR result save response:`, {
        hasError: !!ocrSaveError,
        ocrSaveError: ocrSaveError?.message,
        ocrSaveErrorDetails: (ocrSaveError as any)?.details,
        ocrSaveErrorStatus: (ocrSaveError as any)?.status,
        hasSavedData: !!savedOcrData,
        savedOcrId: (savedOcrData as any)?.id,
        requestId,
        timestamp: new Date().toISOString()
      })

      if (ocrSaveError || !savedOcrData) {
        console.error(`[Upload API] Failed to save OCR result to database:`, {
          error: ocrSaveError?.message,
          errorDetails: (ocrSaveError as any)?.details,
          hasData: !!savedOcrData,
          imageId: menuImageId,
          requestId,
          timestamp: new Date().toISOString()
        })
        // Don't throw - just log the error and continue
        console.log(`[Upload API] Continuing without saving OCR result - image will be marked as ocr_pending`, {
          imageId: menuImageId,
          reason: ocrSaveError?.message || 'Unknown error',
          requestId,
          timestamp: new Date().toISOString()
        })
      } else {
        ocrResultId = (savedOcrData as any).id
        ocrData = savedOcrData
        console.log(`[Upload API] OCR result saved successfully:`, {
          ocrResultId,
          imageId: menuImageId,
          requestId,
          timestamp: new Date().toISOString()
        })
      }
    } else if (!ocrProcessingSucceeded) {
      console.log(`[Upload API] Skipping OCR result save - OCR processing did not succeed:`, {
        ocrProcessingSucceeded,
        hasOcrResult: !!ocrResult,
        imageId: menuImageId,
        errorDetails: ocrErrorDetails,
        requestId,
        timestamp: new Date().toISOString()
      })
    }

    // Update menu image status based on OCR success
    const finalStatus = ocrProcessingSucceeded && ocrResultId ? 'ocr_done' : 'ocr_pending'
    const updatePayload: any = { status: finalStatus }
    if (ocrResultId) {
      updatePayload.ocr_result_id = ocrResultId
    }
    
    console.log(`[Upload API] Updating menu image status:`, {
      imageId: menuImageId,
      finalStatus,
      ocrResultId,
      updatePayload,
      requestId,
      timestamp: new Date().toISOString()
    })
    
    const { error: updateError } = await supabaseAdmin
      .from('menu_images')
      .update(updatePayload)
      .eq('id', menuImageId)

    console.log(`[Upload API] Menu image status update response:`, {
      hasError: !!updateError,
      updateError: updateError?.message,
      updateErrorDetails: (updateError as any)?.details,
      imageId: menuImageId,
      finalStatus,
      requestId,
      timestamp: new Date().toISOString()
    })

    if (updateError) {
      console.error(`[Upload API] Failed to update menu image status:`, {
        error: updateError.message,
        errorDetails: (updateError as any)?.details,
        imageId: menuImageId,
        attemptedStatus: finalStatus,
        requestId,
        timestamp: new Date().toISOString()
      })
      throw new DatabaseError('Failed to update menu image status', updateError)
    }

    console.log(`[Upload API] Upload completed successfully:`, {
      menuImageId,
      ocrResultId: ocrResultId || 'No OCR result',
      finalStatus,
      ocrProcessingSucceeded,
      totalDuration: Date.now() - startTime + 'ms',
      requestId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      menuImage: menuImageData,
      ocrResult: ocrData,
      status: finalStatus,
      ocrProcessingDetails: {
        processed: ocrProcessingSucceeded,
        error: ocrProcessingSucceeded ? null : ocrErrorDetails,
        resultId: ocrResultId,
        processingTime: ocrResult?.ProcessingTimeInMilliseconds || null
      }
    })
  } catch (error) {
    return handleAPIError(error)
  }
}