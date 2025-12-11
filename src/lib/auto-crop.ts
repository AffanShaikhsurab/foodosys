import smartcrop from 'smartcrop'

// Helper function to convert buffer to base64 data URL
function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}

// Helper function to convert canvas to buffer
function canvasToBuffer(canvas: HTMLCanvasElement): Promise<Buffer> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(Buffer.from(''))
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix to get base64 string
          const base64 = reader.result.split(',')[1]
          resolve(Buffer.from(base64, 'base64'))
        } else {
          resolve(Buffer.from(''))
        }
      }
      reader.readAsDataURL(blob)
    }, 'image/jpeg')
  })
}

// Smartcrop.js implementation for content-aware cropping
export async function smartCropImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    // Create image element from buffer
    const dataUrl = bufferToDataUrl(buffer, mimeType)
    const img = new Image()
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = dataUrl
    })
    
    // Get smart crop recommendation
    const cropResult = await smartcrop.crop(img, { 
      width: img.width, 
      height: img.height 
    })
    
    // Apply the crop
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }
    
    canvas.width = cropResult.topCrop.width
    canvas.height = cropResult.topCrop.height
    
    ctx.drawImage(
      img, 
      cropResult.topCrop.x, 
      cropResult.topCrop.y, 
      cropResult.topCrop.width, 
      cropResult.topCrop.height,
      0, 0, 
      cropResult.topCrop.width, 
      cropResult.topCrop.height
    )
    
    // Convert canvas back to buffer
    return await canvasToBuffer(canvas)
  } catch (error) {
    console.error('Smartcrop failed:', error)
    return buffer // Return original buffer if cropping fails
  }
}

// OpenCV.js implementation for perspective correction
export async function perspectiveCropImage(buffer: Buffer, mimeType: string): Promise<Buffer | null> {
  try {
    // Check if OpenCV.js is loaded
    if (typeof window === 'undefined' || !window.cv) {
      console.warn('OpenCV.js not available, skipping perspective correction')
      return null
    }
    
    const cv = window.cv
    
    // Create image element from buffer
    const dataUrl = bufferToDataUrl(buffer, mimeType)
    const img = new Image()
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = dataUrl
    })
    
    // Create canvas to read image with OpenCV
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }
    
    ctx.drawImage(img, 0, 0)
    
    // Read image with OpenCV
    const src = cv.imread(canvas)
    const dst = new cv.Mat()
    
    // Convert to grayscale and apply edge detection
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(src, src, new cv.Size(5, 5), 0)
    cv.Canny(src, dst, 50, 150)
    
    // Find contours
    const contours = new cv.MatVector()
    const hierarchy = new cv.Mat()
    cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    
    // Find the largest quadrilateral contour
    let biggest = null
    let maxArea = 0
    
    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i)
      const peri = cv.arcLength(cnt, true)
      const approx = new cv.Mat()
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true)
      
      if (approx.rows === 4) {
        const area = cv.contourArea(approx)
        if (area > maxArea) {
          maxArea = area
          if (biggest) biggest.delete()
          biggest = approx
        } else {
          approx.delete()
        }
      } else {
        approx.delete()
      }
    }
    
    // If we found a quadrilateral, apply perspective transform
    if (biggest) {
      // Extract corner points
      const corners = [
        new cv.Point(biggest.data32S[0], biggest.data32S[1]),
        new cv.Point(biggest.data32S[2], biggest.data32S[3]),
        new cv.Point(biggest.data32S[4], biggest.data32S[5]),
        new cv.Point(biggest.data32S[6], biggest.data32S[7])
      ]
      
      // Order corners (top-left, top-right, bottom-right, bottom-left)
      const orderedCorners = orderCorners(corners)
      
      // Calculate destination dimensions
      const widthTop = Math.hypot(orderedCorners[1].x - orderedCorners[0].x, orderedCorners[1].y - orderedCorners[0].y)
      const widthBottom = Math.hypot(orderedCorners[2].x - orderedCorners[3].x, orderedCorners[2].y - orderedCorners[3].y)
      const width = Math.max(widthTop, widthBottom)
      
      const heightLeft = Math.hypot(orderedCorners[3].x - orderedCorners[0].x, orderedCorners[3].y - orderedCorners[0].y)
      const heightRight = Math.hypot(orderedCorners[2].x - orderedCorners[1].x, orderedCorners[2].y - orderedCorners[1].y)
      const height = Math.max(heightLeft, heightRight)
      
      // Apply perspective transform
      const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
        orderedCorners[0].x, orderedCorners[0].y,
        orderedCorners[1].x, orderedCorners[1].y,
        orderedCorners[2].x, orderedCorners[2].y,
        orderedCorners[3].x, orderedCorners[3].y
      ])
      
      const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0, width - 1, 0, width - 1, height - 1, 0, height - 1
      ])
      
      const M = cv.getPerspectiveTransform(srcCoords, dstCoords)
      const warped = new cv.Mat()
      const dsize = new cv.Size(width, height)
      
      cv.warpPerspective(src, warped, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar())
      
      // Convert to canvas
      const resultCanvas = document.createElement('canvas')
      resultCanvas.width = width
      resultCanvas.height = height
      cv.imshow(resultCanvas, warped)
      
      // Convert canvas back to buffer
      const result = await canvasToBuffer(resultCanvas)
      
      // Clean up
      src.delete()
      dst.delete()
      contours.delete()
      hierarchy.delete()
      biggest.delete()
      srcCoords.delete()
      dstCoords.delete()
      M.delete()
      warped.delete()
      
      return result
    }
    
    // Clean up
    src.delete()
    dst.delete()
    contours.delete()
    hierarchy.delete()
    
    return null // No suitable document found
  } catch (error) {
    console.error('Perspective correction failed:', error)
    return null
  }
}

// Helper function to order corners (top-left, top-right, bottom-right, bottom-left)
// Use `any` for corner types because OpenCV.js types aren't available at build-time.
function orderCorners(corners: any[]): any[] {
  // Calculate center point
  const center = {
    x: corners.reduce((sum, p) => sum + p.x, 0) / 4,
    y: corners.reduce((sum, p) => sum + p.y, 0) / 4
  }
  
  // Sort corners by angle from center
  const sorted = [...corners].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x)
    const angleB = Math.atan2(b.y - center.y, b.x - center.x)
    return angleA - angleB
  })
  
  // Reorder to top-left, top-right, bottom-right, bottom-left
  const tl = sorted.reduce((min, p) => (p.x + p.y < min.x + min.y) ? p : min, sorted[0])
  const br = sorted.reduce((max, p) => (p.x + p.y > max.x + max.y) ? p : max, sorted[0])
  
  const remaining = sorted.filter(p => p !== tl && p !== br)
  const tr = remaining[0].y < remaining[1].y ? remaining[0] : remaining[1]
  const bl = remaining[0].y < remaining[1].y ? remaining[1] : remaining[0]
  
  return [tl, tr, br, bl]
}

// Main function to process image with auto-cropping
export async function processImageWithAutoCrop(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    console.log('[AutoCrop] Starting auto-cropping process')
    
    // First try smartcrop for quick content-aware cropping
    console.log('[AutoCrop] Applying smartcrop')
    const smartCroppedBuffer = await smartCropImage(buffer, mimeType)
    
    // Then try perspective correction if needed
    console.log('[AutoCrop] Applying perspective correction')
    const perspectiveCroppedBuffer = await perspectiveCropImage(smartCroppedBuffer, mimeType)
    
    // Use the best result
    const finalBuffer = perspectiveCroppedBuffer || smartCroppedBuffer
    
    console.log('[AutoCrop] Auto-cropping completed successfully')
    return finalBuffer
  } catch (error) {
    console.error('[AutoCrop] Auto-cropping failed:', error)
    return buffer // Return original buffer if cropping fails
  }
}

// Function to load OpenCV.js dynamically
export async function loadOpenCV(): Promise<void> {
  if (typeof window !== 'undefined' && !window.cv) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://docs.opencv.org/4.5.0/opencv.js'
      script.async = true
      script.onload = () => {
        // Wait for OpenCV to be fully initialized
        const checkCV = () => {
          if (window.cv && window.cv.Mat) {
            console.log('[AutoCrop] OpenCV.js loaded successfully')
            resolve()
          } else {
            setTimeout(checkCV, 100)
          }
        }
        checkCV()
      }
      script.onerror = () => reject(new Error('Failed to load OpenCV.js'))
      document.head.appendChild(script)
    })
  }
}

// Type declaration for OpenCV.js global
declare global {
  interface Window {
    cv: any
  }
}