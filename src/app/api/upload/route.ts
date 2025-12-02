
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabaseAdmin } from '@/lib/supabase'
import { ocrService } from '@/lib/ocr'
import { menuAnalyzer } from '@/lib/menu-analyzer'
import { ocrSpaceV2Service } from '@/lib/ocr-space-v2'
import { combinedOCRService } from '@/lib/combined-ocr'
import { ValidationError, NotFoundError, DatabaseError, ExternalServiceError, handleAPIError } from '@/lib/errors'
import { logUpload, logger } from '@/lib/logger'
import { processImageWithAutoCrop } from '@/lib/auto-crop-server'

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
    // Verify authentication using Clerk
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
      // Verify Clerk JWT token
      try {
        // Import Clerk's verifyToken function
        const { verifyToken } = await import('@clerk/backend')
        
        const payload = await verifyToken(token, {
          jwtKey: process.env.CLERK_SECRET_KEY,
        })
        
        if (payload && payload.sub) {
          userId = payload.sub
          logUpload('Clerk JWT token verification successful', {
            operation: 'clerk_jwt_auth_success',
            requestId,
            userId
          })
        } else {
          throw new Error('Invalid token payload')
        }
      } catch (error) {
        logUpload('Clerk JWT token verification failed', {
          operation: 'clerk_jwt_auth_failed',
          requestId,
          error: error instanceof Error ? error.message : String(error)
        })
        
        return NextResponse.json(
          { error: 'Invalid or expired authentication token' },
          { status: 401 }
        )
      }
    } else {
      // Try to get user from Clerk session
      try {
        // Import Clerk's auth function for server-side
        const { auth } = await import('@clerk/nextjs/server')
        
        const { userId: clerkUserId } = await auth()
        
        if (clerkUserId) {
          userId = clerkUserId
          logUpload('Clerk session authentication successful', {
            operation: 'clerk_session_auth_success',
            requestId,
            userId
          })
        } else {
          throw new Error('No active Clerk session')
        }
      } catch (error) {
        logUpload('Clerk session authentication failed', {
          operation: 'clerk_session_auth_failed',
          requestId,
          error: error instanceof Error ? error.message : String(error)
        })
        
        return NextResponse.json(
          { error: 'Authentication required. Please sign in to upload photos.' },
          { status: 401 }
        )
      }
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
    const supabase = await createServerClient()
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

    // Apply auto-cropping to the image
    console.log(`[Upload API] Starting auto-cropping process:`, { 
      originalSize: buffer.length,
      fileName: file.name,
      requestId 
    })

    let croppedBuffer: Buffer
    try {
      // Process image with auto-cropping
      croppedBuffer = await processImageWithAutoCrop(buffer, file.type)
      
      console.log(`[Upload API] Auto-cropping completed:`, { 
        originalSize: buffer.length,
        croppedSize: croppedBuffer.length,
        sizeChange: croppedBuffer.length - buffer.length,
        fileName: file.name,
        requestId 
      })
      
      // Use the cropped buffer for further processing
      buffer = croppedBuffer
    } catch (cropError) {
      console.error(`[Upload API] Auto-cropping failed, using original image:`, { 
        error: cropError instanceof Error ? cropError.message : String(cropError),
        fileName: file.name,
        requestId 
      })
      // Continue with original buffer if auto-cropping fails
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

    const isUuid = (val: string | null) => !!val && /^[0-9a-fA-F-]{36}$/.test(val)
    const uploadPayload: any = {
      restaurant_id: restaurantId,
      storage_path: filePath,
      mime: file.type,
      status: 'ocr_pending'
    }
    if (isUuid(userId)) {
      uploadPayload.uploaded_by = userId
    }

    console.log(`[Upload API] Creating menu image record in database:`, { 
      restaurant_id: restaurantId, 
      storage_path: filePath,
      uploaded_by_uuid: isUuid(userId) ? userId : null,
      mime: file.type,
      status: 'ocr_pending',
      requestId,
      timestamp: new Date().toISOString()
    })
    
    const { data: menuImageData, error: menuImageError } = await supabaseAdmin
      .from('menu_images')
      .insert([uploadPayload])
      .select()
      .single()

    console.log(`[Upload API] Menu image record insertion response:`, { 
      hasError: !!menuImageError,
      menuImageError: menuImageError?.message,
      menuImageErrorDetails: (menuImageError as any)?.details,
      menuImageId: (menuImageData as any)?.id,
      menuImageRestaurantId: (menuImageData as any)?.restaurant_id,
      menuImagefilePath: (menuImageData as any)?.storage_path,
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
    let menuValidationResult = null
    
    try {
      console.log(`[Upload API] Calling ocrSpaceV2Service.processAndValidateMenu:`, {
        base64Length: base64Image.length,
        mimeType: file.type,
        imageId: menuImageId,
        requestId,
        timestamp: new Date().toISOString()
      })
      
      // Process image with both OCR services (OCR.space + Maverick) and validate if it's a menu
      console.log(`[Upload API] Step 1: Starting dual OCR processing (OCR.space + Maverick) and menu validation:`, {
        imageId: menuImageId,
        base64Length: base64Image.length,
        mimeType: file.type,
        requestId,
        timestamp: new Date().toISOString()
      })
      
      const { combinedResult, validationResult } = await combinedOCRService.processAndValidateMenu(base64Image)
      
      console.log(`[Upload API] Step 1 completed: Dual OCR processing response received:`, {
        imageId: menuImageId,
        hasCombinedResult: !!combinedResult,
        finalTextLength: combinedResult.finalText?.length || 0,
        finalTextPreview: combinedResult.finalText?.substring(0, 100),
        confidence: combinedResult.confidence,
        processingDetails: combinedResult.processingDetails,
        requestId,
        timestamp: new Date().toISOString()
      })
      
      
      
      console.log(`[Upload API] Step 1 completed: Menu validation result:`, {
        imageId: menuImageId,
        isMenu: validationResult.isMenu,
        confidence: validationResult.confidence,
        reason: validationResult.reason,
        requestId,
        timestamp: new Date().toISOString()
      })
      
      // Check if the image is a valid menu
      const confidenceThreshold = 0.7;
      console.log(`[Upload API] Step 2: Checking menu validation against threshold:`, {
        imageId: menuImageId,
        isMenu: validationResult.isMenu,
        confidence: validationResult.confidence,
        threshold: confidenceThreshold,
        passesValidation: validationResult.isMenu && validationResult.confidence >= confidenceThreshold,
        requestId,
        timestamp: new Date().toISOString()
      })

      if (!validationResult.isMenu || validationResult.confidence < confidenceThreshold) {
        console.warn(`[Upload API] Step 2 did not pass threshold; applying local fallback`, {
          imageId: menuImageId,
          isMenu: validationResult.isMenu,
          confidence: validationResult.confidence,
          threshold: confidenceThreshold,
          reason: validationResult.reason,
          requestId,
          timestamp: new Date().toISOString()
        })

        const ocrTextFallback = combinedResult.finalText || ''
        const localFallback = ocrSpaceV2Service.validateMenuLocally(ocrTextFallback)

        console.log(`[Upload API] Local fallback validation result:`, {
          imageId: menuImageId,
          isMenu: localFallback.isMenu,
          confidence: localFallback.confidence,
          reason: localFallback.reason,
          requestId,
          timestamp: new Date().toISOString()
        })

        // Use the better of the two results for reporting
        menuValidationResult = (localFallback.confidence > (validationResult.confidence || 0))
          ? localFallback
          : validationResult

        // Check if even the local fallback passes validation
        if (!menuValidationResult.isMenu || menuValidationResult.confidence < confidenceThreshold) {
          console.error(`[Upload API] Image rejected: Not identified as a menu after both validations`, {
            imageId: menuImageId,
            aiValidation: {
              isMenu: validationResult.isMenu,
              confidence: validationResult.confidence,
              reason: validationResult.reason
            },
            localValidation: {
              isMenu: localFallback.isMenu,
              confidence: localFallback.confidence,
              reason: localFallback.reason
            },
            selectedValidation: menuValidationResult,
            threshold: confidenceThreshold,
            requestId,
            timestamp: new Date().toISOString()
          })

          // Delete the uploaded image from storage since it's not a menu
          try {
            console.log(`[Upload API] Deleting non-menu image from storage:`, {
              imageId: menuImageId,
              filePath: filePath,
              requestId,
              timestamp: new Date().toISOString()
            })

            const { error: deleteError } = await supabaseAdmin.storage
              .from('menu-images')
              .remove([filePath])

            if (deleteError) {
              console.error(`[Upload API] Failed to delete non-menu image from storage:`, {
                error: deleteError.message,
                imageId: menuImageId,
                filePath,
                requestId,
                timestamp: new Date().toISOString()
              })
            } else {
              console.log(`[Upload API] Successfully deleted non-menu image from storage:`, {
                imageId: menuImageId,
                filePath,
                requestId,
                timestamp: new Date().toISOString()
              })
            }
          } catch (deleteError) {
            console.error(`[Upload API] Error while deleting non-menu image from storage:`, {
              error: deleteError instanceof Error ? deleteError.message : String(deleteError),
              imageId: menuImageId,
              filePath,
              requestId,
              timestamp: new Date().toISOString()
            })
          }

          // Delete the database record
          try {
            console.log(`[Upload API] Deleting non-menu image record from database:`, {
              imageId: menuImageId,
              requestId,
              timestamp: new Date().toISOString()
            })

            const { error: dbDeleteError } = await supabaseAdmin
              .from('menu_images')
              .delete()
              .eq('id', menuImageId)

            if (dbDeleteError) {
              console.error(`[Upload API] Failed to delete non-menu image record from database:`, {
                error: dbDeleteError.message,
                imageId: menuImageId,
                requestId,
                timestamp: new Date().toISOString()
              })
            } else {
              console.log(`[Upload API] Successfully deleted non-menu image record from database:`, {
                imageId: menuImageId,
                requestId,
                timestamp: new Date().toISOString()
              })
            }
          } catch (dbDeleteError) {
            console.error(`[Upload API] Error while deleting non-menu image record from database:`, {
              error: dbDeleteError instanceof Error ? dbDeleteError.message : String(dbDeleteError),
              imageId: menuImageId,
              requestId,
              timestamp: new Date().toISOString()
            })
          }

          // Return an error response to the client
          return NextResponse.json({
            success: false,
            error: 'The uploaded image does not appear to be a restaurant menu. Please upload a clear photo of a menu.',
            validation: {
              isMenu: menuValidationResult.isMenu,
              confidence: menuValidationResult.confidence,
              reason: menuValidationResult.reason,
              threshold: confidenceThreshold
            }
          }, { status: 400 })
        }

        console.log(`[Upload API] Local fallback validation passed; proceeding with upload`, {
          imageId: menuImageId,
          selectedValidation: menuValidationResult,
          requestId,
          timestamp: new Date().toISOString()
        })
      } else {
        console.log(`[Upload API] Step 2 passed: Image validated as a menu:`, {
          imageId: menuImageId,
          isMenu: validationResult.isMenu,
          confidence: validationResult.confidence,
          reason: validationResult.reason,
          requestId,
          timestamp: new Date().toISOString()
        })
        menuValidationResult = validationResult
      }
      // Use combined OCR result (create a compatible format for the database)
      ocrResult = {
        ParsedResults: [{
          ParsedText: combinedResult.finalText,
          TextOverlay: {
            Lines: [] // We don't have detailed text overlay from combined OCR
          }
        }],
        ProcessingTimeInMilliseconds: combinedResult.processingDetails.totalTime
      }
      ocrProcessingSucceeded = true
      
      console.log(`[Upload API] Dual OCR and menu validation completed successfully:`, {
        imageId: menuImageId,
        success: true,
        textLength: combinedResult.finalText?.length || 0,
        textPreview: combinedResult.finalText?.substring(0, 100),
        ocrConfidence: combinedResult.confidence,
        processingDetails: combinedResult.processingDetails,
        isMenu: validationResult.isMenu,
        menuConfidence: validationResult.confidence,
        reason: validationResult.reason,
        requestId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : ''
      
      ocrErrorDetails = {
        errorMessage: errorMsg,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorStack: errorStack,
        timestamp: new Date().toISOString()
      }
      
      console.error(`[Upload API] Modal OCR processing FAILED:`, {
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
      
      console.log(`[Upload API] OCR processing failed - rejecting image since we cannot validate if it's a menu`, {
        imageId: menuImageId,
        requestId,
        reason: errorMsg,
        timestamp: new Date().toISOString()
      })

      // Delete the uploaded image from storage since OCR failed
      try {
        console.log(`[Upload API] Deleting image with failed OCR from storage:`, {
          imageId: menuImageId,
          filePath: filePath,
          requestId,
          timestamp: new Date().toISOString()
        })

        const { error: deleteError } = await supabaseAdmin.storage
          .from('menu-images')
          .remove([filePath])

        if (deleteError) {
          console.error(`[Upload API] Failed to delete image with failed OCR from storage:`, {
            error: deleteError.message,
            imageId: menuImageId,
            requestId,
            timestamp: new Date().toISOString()
          })
        } else {
          console.log(`[Upload API] Successfully deleted image with failed OCR from storage:`, {
            imageId: menuImageId,
            requestId,
            timestamp: new Date().toISOString()
          })
        }
      } catch (deleteError) {
        console.error(`[Upload API] Error while deleting image with failed OCR from storage:`, {
          error: deleteError instanceof Error ? deleteError.message : String(deleteError),
          imageId: menuImageId,
          requestId,
          timestamp: new Date().toISOString()
        })
      }

      // Delete the database record
      try {
        console.log(`[Upload API] Deleting image with failed OCR from database:`, {
          imageId: menuImageId,
          requestId,
          timestamp: new Date().toISOString()
        })

        const { error: dbDeleteError } = await supabaseAdmin
          .from('menu_images')
          .delete()
          .eq('id', menuImageId)

        if (dbDeleteError) {
          console.error(`[Upload API] Failed to delete image with failed OCR from database:`, {
            error: dbDeleteError.message,
            imageId: menuImageId,
            requestId,
            timestamp: new Date().toISOString()
          })
        } else {
          console.log(`[Upload API] Successfully deleted image with failed OCR from database:`, {
            imageId: menuImageId,
            requestId,
            timestamp: new Date().toISOString()
          })
        }
      } catch (dbDeleteError) {
        console.error(`[Upload API] Error while deleting image with failed OCR from database:`, {
          error: dbDeleteError instanceof Error ? dbDeleteError.message : String(dbDeleteError),
          imageId: menuImageId,
          requestId,
          timestamp: new Date().toISOString()
        })
      }

      // Return an error response to the client
      return NextResponse.json({
        success: false,
        error: 'Failed to process the image. Please ensure you are uploading a clear, well-lit photo of a menu.',
        ocrError: {
          message: errorMsg,
          type: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      }, { status: 400 })
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
        ocr_engine: 4, // Using 4 to indicate dual OCR processing (OCR.space + Maverick)
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

        // Now analyze the menu using Groq model
        console.log(`[Upload API] Starting menu analysis with Groq:`, {
          imageId: menuImageId,
          ocrResultId,
          requestId,
          timestamp: new Date().toISOString()
        })

        let menuAnalysisSucceeded = false
        let extractedMenu = null
        let menuAnalysisError = null

        try {
          // First try to analyze from the image directly
          console.log(`[Upload API] Analyzing menu from image:`, {
            imageId: menuImageId,
            requestId
          })
          
          extractedMenu = await menuAnalyzer.analyzeMenuFromImage(base64Image)
          menuAnalysisSucceeded = true
          
          console.log(`[Upload API] Menu analysis from image succeeded:`, {
            imageId: menuImageId,
            sectionsCount: extractedMenu.sections.length,
            totalItems: extractedMenu.sections.reduce((sum, section) => sum + section.items.length, 0),
            requestId,
            timestamp: new Date().toISOString()
          })
        } catch (imageAnalysisError) {
          console.warn(`[Upload API] Image analysis failed, trying with OCR text:`, {
            imageId: menuImageId,
            error: imageAnalysisError instanceof Error ? imageAnalysisError.message : String(imageAnalysisError),
            requestId,
            timestamp: new Date().toISOString()
          })

          // Fallback to analyzing from OCR text
          try {
            if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]?.ParsedText) {
              console.log(`[Upload API] Analyzing menu from OCR text:`, {
                imageId: menuImageId,
                textLength: ocrResult.ParsedResults[0].ParsedText.length,
                requestId
              })
              
              extractedMenu = await menuAnalyzer.analyzeMenuFromText(ocrResult.ParsedResults[0].ParsedText)
              menuAnalysisSucceeded = true
              
              console.log(`[Upload API] Menu analysis from OCR text succeeded:`, {
                imageId: menuImageId,
                sectionsCount: extractedMenu.sections.length,
                totalItems: extractedMenu.sections.reduce((sum, section) => sum + section.items.length, 0),
                requestId,
                timestamp: new Date().toISOString()
              })
            } else {
              throw new Error('No OCR text available for fallback analysis')
            }
          } catch (textAnalysisError) {
            menuAnalysisError = {
              imageError: imageAnalysisError instanceof Error ? imageAnalysisError.message : String(imageAnalysisError),
              textError: textAnalysisError instanceof Error ? textAnalysisError.message : String(textAnalysisError)
            }
            
            console.error(`[Upload API] Both image and text analysis failed:`, {
              imageId: menuImageId,
              errors: menuAnalysisError,
              requestId,
              timestamp: new Date().toISOString()
            })
          }
        }

        // If menu analysis succeeded, validate and save the structured menu data
        if (menuAnalysisSucceeded && extractedMenu) {
          try {
            // Validate and sanitize the menu data
            const validatedMenu = sanitizeMenuData(extractedMenu)
            
            console.log(`[Upload API] Menu data validated successfully:`, {
              imageId: menuImageId,
              sectionsCount: validatedMenu.sections.length,
              totalItems: validatedMenu.sections.reduce((sum, section) => sum + section.items.length, 0),
              requestId,
              timestamp: new Date().toISOString()
            })

            // Delete existing menus for this restaurant (since menus change daily)
            console.log(`[Upload API] Deleting existing menus for restaurant:`, {
              restaurantId,
              imageId: menuImageId,
              requestId,
              timestamp: new Date().toISOString()
            })
            
            const { error: deleteError } = await supabaseAdmin
              .from('menus')
              .delete()
              .eq('restaurant_id', restaurantId)

            if (deleteError) {
              console.error(`[Upload API] Failed to delete existing menus:`, {
                error: deleteError.message,
                restaurantId,
                imageId: menuImageId,
                requestId,
                timestamp: new Date().toISOString()
              })
              // Continue anyway - the new menu will still be saved
            }

            // Save the new menu
            console.log(`[Upload API] Saving new menu to database:`, {
              restaurantId,
              imageId: menuImageId,
              sectionsCount: validatedMenu.sections.length,
              requestId,
              timestamp: new Date().toISOString()
            })

            const { data: savedMenu, error: menuSaveError } = await supabaseAdmin
              .from('menus')
              .insert([{
                restaurant_id: restaurantId,
                menu_image_id: menuImageId,
                menu_date: new Date().toISOString().split('T')[0], // Today's date
                content: validatedMenu,
                created_at: new Date().toISOString()
              }])
              .select()
              .single()

            if (menuSaveError || !savedMenu) {
              console.error(`[Upload API] Failed to save menu:`, {
                error: menuSaveError?.message,
                restaurantId,
                imageId: menuImageId,
                requestId,
                timestamp: new Date().toISOString()
              })
            } else {
              console.log(`[Upload API] Menu saved successfully:`, {
                menuId: (savedMenu as any).id,
                restaurantId,
                imageId: menuImageId,
                requestId,
                timestamp: new Date().toISOString()
              })
            }
          } catch (validationError) {
            console.error(`[Upload API] Menu validation failed:`, {
              error: validationError instanceof Error ? validationError.message : String(validationError),
              imageId: menuImageId,
              requestId,
              timestamp: new Date().toISOString()
            })
          }
        }
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

    console.log(`[Upload API] Preparing final response:`, {
      imageId: menuImageId,
      success: true,
      hasMenuImage: !!menuImageData,
      hasOcrData: !!ocrData,
      status: finalStatus,
      ocrProcessed: ocrProcessingSucceeded,
      hasMenuValidation: !!menuValidationResult,
      requestId,
      timestamp: new Date().toISOString()
    })

    const response = {
      success: true,
      menuImage: menuImageData,
      ocrResult: ocrData,
      status: finalStatus,
      ocrProcessingDetails: {
        processed: ocrProcessingSucceeded,
        error: ocrProcessingSucceeded ? null : ocrErrorDetails,
        resultId: ocrResultId,
        processingTime: ocrResult?.ProcessingTimeInMilliseconds || null
      },
      menuValidation: menuValidationResult ? {
        isMenu: menuValidationResult.isMenu,
        confidence: menuValidationResult.confidence,
        reason: menuValidationResult.reason
      } : null
    }

    console.log(`[Upload API] Sending response to client:`, {
      imageId: menuImageId,
      responseKeys: Object.keys(response),
      menuValidation: response.menuValidation,
      requestId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(response)
  } catch (error) {
    return handleAPIError(error)
  }
}

function sanitizeMenuData(extractedMenu: any) {
  // Basic sanitization to ensure the menu data is safe to store
  if (!extractedMenu || typeof extractedMenu !== 'object') {
    return { sections: [] }
  }
  
  // Ensure sections is an array
  if (!Array.isArray(extractedMenu.sections)) {
    return { sections: [] }
  }
  
  // Sanitize each section
  const sanitizedSections = extractedMenu.sections.map((section: any) => {
    if (!section || typeof section !== 'object') {
      return { name: 'Unknown', items: [] }
    }
    
    return {
      name: String(section.name || 'Unknown').substring(0, 100),
      items: Array.isArray(section.items) 
        ? section.items.map((item: any) => ({
            name: String(item.name || 'Unknown Item').substring(0, 100),
            price: item.price ? String(item.price).substring(0, 20) : '',
            description: item.description ? String(item.description).substring(0, 200) : ''
          }))
        : []
    }
  })
  
  return { sections: sanitizedSections }
}
