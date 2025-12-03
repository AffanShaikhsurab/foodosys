'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import CameraComponent from './CameraComponent'
import { PhotoUploadData } from '@/lib/types'
import { useUser } from '@clerk/nextjs'
import { logUpload, logger } from '@/lib/logger'

interface UploadResponse {
  success: boolean
  menuImage: {
    id: string
    restaurant_id: string
    storage_path: string
    mime: string
    status: string
    created_at: string
  }
  ocrResult: {
    id: string
    image_id: string
    text: string
    language: string
    ocr_engine: number
    processing_time_ms: number
    created_at: string
  }
}

interface MenuUploadProps {
  restaurantSlug: string
  onUploadSuccess?: (response: UploadResponse) => void
  onUploadError?: (error: Error) => void
  isAnonymousMode?: boolean
  onShowAnonymousPopup?: () => void
}

export default function MenuUpload({ 
  restaurantSlug, 
  onUploadSuccess, 
  onUploadError,
  isAnonymousMode = false,
  onShowAnonymousPopup
}: MenuUploadProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [photoTimestamp, setPhotoTimestamp] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useUser()

  // Log component mount
  useEffect(() => {
    logUpload('MenuUpload component mounted', {
      operation: 'component_mount',
      restaurantSlug
    })
    logger.componentMount('MenuUpload')
    
    return () => {
      logUpload('MenuUpload component unmounted', { operation: 'component_unmount' })
      logger.componentUnmount('MenuUpload')
    }
  }, [restaurantSlug])

  useEffect(() => {
    const checkAuth = async () => {
      logUpload('Starting authentication check', { operation: 'auth_check_start' })
      
      try {
        const isAuth = !!user
        
        logUpload('Authentication check completed', {
          operation: 'auth_check_completed',
          isAuthenticated: isAuth,
          userId: user?.id || 'unknown'
        })
        
        setIsAuthenticated(isAuth)
      } catch (error) {
        logUpload('Authentication check failed', {
          operation: 'auth_check_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [user])

  // Function to convert base64 to File object
  const base64ToFile = (base64: string, filename: string = 'menu-photo.jpg'): File => {
    const arr = base64.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new File([u8arr], filename, { type: mime })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (file) {
      logUpload('File selected for upload', {
        operation: 'file_selected',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreview(result)
        setCapturedPhoto(null) // Clear any captured photo when using file input
        
        logUpload('File loaded successfully', {
          operation: 'file_loaded',
          fileName: file.name,
          previewLength: result?.length || 0
        })
      }
      
      reader.onerror = () => {
        logUpload('Failed to read selected file', {
          operation: 'file_read_error',
          fileName: file.name
        })
      }
      
      reader.readAsDataURL(file)
    } else {
      logUpload('No file selected', { operation: 'no_file_selected' })
    }
  }

  const handlePhotoCapture = (photoBase64: string, timestamp: string) => {
    logUpload('Photo captured from camera', {
      operation: 'photo_captured',
      timestamp,
      photoLength: photoBase64.length,
      restaurantSlug
    })
    
    setCapturedPhoto(photoBase64)
    setPhotoTimestamp(timestamp)
    setPreview(photoBase64)
    setShowCamera(false)
    setUploadError(null) // Clear any previous errors
  }

  const handleCameraClose = () => {
    logUpload('Camera closed by user', { operation: 'camera_closed' })
    setShowCamera(false)
  }

  const handleScanClick = () => {
    logUpload('Scan button clicked', {
      operation: 'scan_clicked',
      isAuthenticated,
      restaurantSlug
    })
    
    if (!isAuthenticated) {
      if (onShowAnonymousPopup) {
        logUpload('Showing anonymous upload popup', {
          operation: 'show_anonymous_popup',
          reason: 'user_not_authenticated'
        })
        onShowAnonymousPopup()
      } else {
        logUpload('Redirecting to auth page', {
          operation: 'redirect_to_auth',
          reason: 'user_not_authenticated'
        })
        router.push('/auth?redirectTo=/upload')
      }
      return
    }
    
    setUploadError(null)
    setIsInitializing(true)
    setShowCamera(true)
    
    // Set initializing to false after a short delay to allow camera to initialize
    setTimeout(() => {
      setIsInitializing(false)
      logUpload('Camera initialization timeout completed', { operation: 'camera_init_timeout' })
    }, 1000)
  }

  const handleSignInClick = () => {
    logUpload('Sign in button clicked', {
      operation: 'signin_clicked',
      redirectTo: '/upload'
    })
    router.push('/auth?redirectTo=/upload')
  }

  const handleRetake = () => {
    logUpload('User requested to retake photo', {
      operation: 'retake_photo',
      restaurantSlug
    })
    
    setCapturedPhoto(null)
    setPhotoTimestamp(null)
    setPreview(null)
    setUploadError(null)
    setShowCamera(true)
  }

  const handleUpload = async () => {
    const startTime = Date.now()
    
    logUpload('Upload initiated', {
      operation: 'upload_start',
      isAuthenticated,
      isAnonymousMode,
      hasCapturedPhoto: !!capturedPhoto,
      hasPhotoTimestamp: !!photoTimestamp,
      restaurantSlug
    })
    
    if (!isAuthenticated && !isAnonymousMode) {
      const errorMessage = 'Please sign in to upload photos'
      logUpload('Upload blocked - user not authenticated', {
        operation: 'upload_blocked',
        reason: 'not_authenticated'
      })
      setUploadError(errorMessage)
      return
    }

    setUploadError(null)
    
    try {
      setIsUploading(true)
      
      // Check if we have a captured photo from camera
      if (capturedPhoto && photoTimestamp) {
        // Use the new base64 upload method with timestamp
        const photoData: PhotoUploadData = {
          base64: capturedPhoto,
          timestamp: photoTimestamp,
          fileName: `menu-photo-${new Date(photoTimestamp).toISOString().replace(/[:.]/g, '-')}.jpg`
        }
        
        const response = await apiClient.uploadMenuImageFromBase64(photoData, restaurantSlug, undefined, isAnonymousMode)
        onUploadSuccess?.(response)
        setPreview(null)
        setCapturedPhoto(null)
        setPhotoTimestamp(null)
      } else {
        logUpload('Uploading file from file input', { operation: 'upload_file_input' })
        
        // Otherwise use the file input (traditional upload)
        const file = fileInputRef.current?.files?.[0]
        
        if (!file) {
          throw new Error('Please capture a photo or select a file')
        }
        
        logUpload('File upload details', {
          operation: 'file_upload_details',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        })
        
        const response = await apiClient.uploadMenuImage(file, restaurantSlug, undefined, isAnonymousMode)
        
        const processingTime = Date.now() - startTime
        logUpload('File upload completed successfully', {
          operation: 'upload_success',
          uploadType: 'file_input',
          processingTime,
          fileName: file.name,
          menuImageId: response.menuImage?.id,
          ocrResultId: response.ocrResult?.id,
          ocrProcessingTime: response.ocrResult?.processing_time_ms
        })
        
        onUploadSuccess?.(response)
        setPreview(null)
        setCapturedPhoto(null)
        setPhotoTimestamp(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      
      logUpload('Upload failed', {
        operation: 'upload_error',
        processingTime,
        errorMessage,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      })
      
      setUploadError(errorMessage)
      onUploadError?.(error as Error)
    } finally {
      setIsUploading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="camera-zone">
        <div className="camera-ui">
          <div className="camera-btn">
            <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
          </div>
          <div className="camera-text">Checking authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showCamera ? (
        <CameraComponent
          onPhotoCapture={handlePhotoCapture}
          onClose={handleCameraClose}
        />
      ) : (
        <>
          {/* Authentication Message */}
          {!isAuthenticated && (
            <div className="error-message" style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              border: '1px solid #F59E0B'
            }}>
              <i className="ri-lock-line" style={{ marginRight: '8px' }}></i>
              Please sign in to upload photos and help other students find menu information.
            </div>
          )}
          
          {/* Error Display */}
          {uploadError && (
            <div className="error-message" style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'var(--status-error)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px'
            }}>
              <i className="ri-error-warning-line" style={{ marginRight: '8px' }}></i>
              {uploadError}
            </div>
          )}
          
          {/* Camera Zone */}
          <div className="camera-zone">
            {preview ? (
              <img 
                src={preview} 
                alt="Menu preview" 
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-xl)',
                  zIndex: 1
                }}
              />
            ) : (
              <div className="camera-preview"></div>
            )}
            
            {!isUploading && !isInitializing && !preview && <div className="scan-line"></div>}
            
            <div className="camera-ui" style={{ position: 'relative', zIndex: 10 }}>
              <div className={`camera-btn ${isUploading || !isAuthenticated ? 'disabled' : ''}`}
                   onClick={isUploading ? undefined : (preview ? handleRetake : handleScanClick)}>
                <i className={isInitializing ? "ri-loader-4-line" : isUploading ? "ri-loader-4-line" : (!isAuthenticated ? "ri-lock-line" : (preview ? "ri-refresh-line" : "ri-camera-fill"))}
                   style={{ animation: (isInitializing || isUploading) ? 'spin 1s linear infinite' : 'none' }}></i>
              </div>
              <div className="camera-text">
                {isUploading ? 'Processing...' : isInitializing ? 'Initializing camera...' : !isAuthenticated ? 'Sign in required' : preview ? 'Tap to retake' : 'Tap to Scan Menu'}
              </div>
            </div>
          </div>
          
          {/* OR Divider */}
          <div className="or-divider">
            <span>OR</span>
          </div>
          
          {/* Sign In Button or Choose File Button */}
          <div className="form-group" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignInClick}
                className="btn-block"
                style={{ backgroundColor: '#2C3E2E', color: 'white' }}
              >
                <i className="ri-user-add-line"></i> Sign In to Upload
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-outline"
                disabled={isUploading}
              >
                <i className="ri-upload-2-line"></i> Choose File
              </button>
            )}
          </div>
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="menu-upload"
          />
          
          {/* Bottom Action */}
          {preview && isAuthenticated && (
            <div className="cta-container">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="btn-block"
              >
                {isUploading ? (
                  <>
                    <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }}></i>
                    Processing & Uploading...
                  </>
                ) : (
                  <>
                    Upload & Process <i className="ri-arrow-right-line"></i>
                  </>
                )}
              </button>
              
              {/* Disclaimer */}
              <div style={{
                marginTop: '24px',
                padding: '14px 18px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '12px',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#92400E',
                textAlign: 'center'
              }}>
                <i className="ri-alert-line" style={{ marginRight: '4px', fontSize: '14px' }}></i>
                <strong>Disclaimer:</strong> Uploading erroneous, misleading, or false menu information is strictly prohibited. 
                As stated in our{' '}
                <a 
                  href="/terms" 
                  target="_blank"
                  style={{ 
                    color: '#B45309', 
                    textDecoration: 'underline',
                    fontWeight: '600'
                  }}
                >
                  Terms and Conditions
                </a>
                , misuse of this platform may result in strict action including account termination and report to the authorities.
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}