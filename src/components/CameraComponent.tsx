'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera } from 'react-camera-pro'
import { logCamera, logger } from '@/lib/logger'

interface CameraComponentProps {
  onPhotoCapture: (photoBase64: string, timestamp: string) => void
  onClose?: () => void
}

export default function CameraComponent({ onPhotoCapture, onClose }: CameraComponentProps) {
  const [isCameraActive, setIsCameraActive] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const camera = useRef<any>(null)

  // Log component mount
  useEffect(() => {
    logCamera('CameraComponent mounted', { operation: 'component_mount' })
    logger.componentMount('CameraComponent')

    return () => {
      logCamera('CameraComponent unmounted', { operation: 'component_unmount' })
      logger.componentUnmount('CameraComponent')
    }
  }, [])

  const handleCapture = useCallback(async () => {
    if (!camera.current) {
      logCamera('Capture attempted but camera ref is null', { operation: 'capture_attempt', error: 'Camera ref is null' })
      return
    }

    const startTime = Date.now()
    logCamera('Photo capture initiated', { operation: 'capture_start' })

    try {
      setIsCapturing(true)
      const photo = await camera.current.takePhoto()

      logCamera('Photo captured from camera', {
        operation: 'capture_success',
        photoType: typeof photo,
        hasPhoto: !!photo
      })

      // Capture the current timestamp when photo is taken
      const timestamp = new Date().toISOString()

      // Convert the photo to base64 if it's not already
      if (photo) {
        logCamera('Starting image processing', { operation: 'image_processing_start' })

        // Create a canvas to rotate the image if needed
        const img = new Image()
        img.onload = () => {
          logCamera('Image loaded for processing', {
            operation: 'image_loaded',
            dimensions: { width: img.width, height: img.height }
          })

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (ctx) {
            // Set canvas dimensions to match the image
            canvas.width = img.width
            canvas.height = img.height

            // For selfie camera effect, we need to flip the image horizontally
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)

            // Draw the image
            ctx.drawImage(img, 0, 0)

            // Convert to base64
            const base64 = canvas.toDataURL('image/jpeg', 0.9)
            const processingTime = Date.now() - startTime

            logCamera('Image processed and converted to base64', {
              operation: 'image_processed',
              timestamp,
              processingTime,
              base64Length: base64.length
            })

            setCapturedImage(base64)
            onPhotoCapture(base64, timestamp)

            logCamera('Photo capture completed successfully', {
              operation: 'capture_completed',
              totalProcessingTime: processingTime
            })
          } else {
            logCamera('Failed to get canvas context', { operation: 'canvas_context_error' })
            setError('Failed to process image. Please try again.')
          }
        }

        img.onerror = () => {
          logCamera('Failed to load image for processing', { operation: 'image_load_error' })
          setError('Failed to process captured image. Please try again.')
        }

        img.src = photo
      } else {
        logCamera('Camera returned empty photo', { operation: 'capture_empty' })
        setError('Failed to capture photo. Please try again.')
      }
    } catch (err) {
      const processingTime = Date.now() - startTime
      logCamera('Camera capture error', {
        operation: 'capture_error',
        processingTime,
        error: err instanceof Error ? err.message : 'Unknown error'
      })

      setError('Failed to capture photo. Please try again.')
      console.error('Camera capture error:', err)
    } finally {
      setIsCapturing(false)
    }
  }, [camera, onPhotoCapture])

  const handleRetake = () => {
    logCamera('User requested to retake photo', { operation: 'retake_photo' })
    setCapturedImage(null)
    setError(null)
  }

  const handleCameraError = (error: Error) => {
    logCamera('Camera error occurred', {
      operation: 'camera_error',
      errorMessage: error.message,
      errorName: error.name
    })

    setError('Camera access denied. Please enable camera permissions.')
    console.error('Camera error:', error)
    setIsCameraActive(false)
  }

  const handleCameraInit = () => {
    logCamera('Camera initialized successfully', { operation: 'camera_init' })
    setIsCameraActive(true)
  }

  const switchCamera = () => {
    logCamera('Camera switch requested (not implemented)', { operation: 'camera_switch_requested' })
    // This would require implementing camera switching logic
    // For now, we'll keep it simple with just one camera
  }

  return (
    <div className="camera-container" style={{ position: 'relative' }}>
      {error ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '24px',
          textAlign: 'center'
        }}>
          <i className="ri-camera-off-line" style={{ fontSize: '48px', color: 'var(--status-error)', marginBottom: '16px' }}></i>
          <p style={{ color: 'white', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={onClose}
            className="btn-outline"
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.9)',
              color: 'var(--primary-dark)',
              border: 'none',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            <i className="ri-arrow-left-line"></i> Back
          </button>
        </div>
      ) : capturedImage ? (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${capturedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="camera-controls-bar">
            <button
              onClick={handleRetake}
              className="btn-icon"
            >
              <i className="ri-refresh-line"></i>
            </button>

            <div style={{ width: '72px' }}></div>

            {onClose && (
              <button
                onClick={onClose}
                className="btn-icon"
              >
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {isCameraActive ? (
            <div style={{ position: 'absolute', inset: 0 }}>
              <Camera
                ref={camera}
                facingMode='environment'
                errorMessages={{
                  noCameraAccessible: 'Camera access denied. Please enable camera permissions.',
                  permissionDenied: 'Camera permission denied. Please enable camera permissions in your browser settings.',
                  switchCamera: 'Cannot switch camera.',
                  canvas: 'Canvas is not supported.'
                }}
              />
            </div>
          ) : (
            <div className="camera-feed-bg" style={{ opacity: 0.3 }}></div>
          )}

          {/* Scan Overlay */}
          <div className="scan-overlay-frame">
            <div className="corner tl"></div>
            <div className="corner tr"></div>
            <div className="corner bl"></div>
            <div className="corner br"></div>
            {!isCapturing && <div className="laser-line"></div>}
          </div>

          {/* Camera Controls */}
          <div className="camera-controls-bar">
            {onClose && (
              <button onClick={onClose} className="btn-icon">
                <i className="ri-close-line"></i>
              </button>
            )}

            {/* The Shutter Button */}
            <button
              className={`shutter-btn ${isCapturing ? 'disabled' : ''}`}
              onClick={isCapturing ? undefined : handleCapture}
            >
              <div className="shutter-inner" style={
                isCapturing
                  ? { display: 'flex', alignItems: 'center', justifyContent: 'center' }
                  : {}
              }>
                {isCapturing && (
                  <i className="ri-loader-4-line" style={{
                    fontSize: '24px',
                    color: 'var(--primary-dark)',
                    animation: 'spin 1s linear infinite'
                  }}></i>
                )}
              </div>
            </button>

            <button className="btn-icon">
              <i className="ri-flashlight-line"></i>
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}