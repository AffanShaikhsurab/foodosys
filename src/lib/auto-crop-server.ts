import { createCanvas, loadImage } from 'canvas'

// Helper function to convert canvas to buffer
function canvasToBuffer(canvas: any): Promise<Buffer> {
  return new Promise((resolve) => {
    canvas.toBuffer((err: Error | null, buffer: Buffer) => {
      if (err) {
        console.error('Error converting canvas to buffer:', err)
        resolve(Buffer.from(''))
        return
      }
      resolve(buffer)
    }, 'image/jpeg')
  })
}

// Simple center crop implementation
export async function centerCropImage(buffer: Buffer, mimeType: string, cropRatio: number = 0.8): Promise<Buffer> {
  try {
    // Create image from buffer using canvas library
    const img = await loadImage(buffer)
    
    // Define crop dimensions (center portion of the image)
    const cropWidth = Math.floor(img.width * cropRatio)
    const cropHeight = Math.floor(img.height * cropRatio)
    const cropX = Math.floor((img.width - cropWidth) / 2)
    const cropY = Math.floor((img.height - cropHeight) / 2)
    
    // Apply the crop
    const canvas = createCanvas(cropWidth, cropHeight)
    const ctx = canvas.getContext('2d')
    
    ctx.drawImage(
      img, 
      cropX, 
      cropY, 
      cropWidth, 
      cropHeight,
      0, 0, 
      cropWidth, 
      cropHeight
    )
    
    // Convert canvas back to buffer
    return await canvasToBuffer(canvas)
  } catch (error) {
    console.error('Center crop failed:', error)
    return buffer // Return original buffer if cropping fails
  }
}

// Smart crop implementation using edge detection (simplified version)
export async function smartCropImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    // Create image from buffer using canvas library
    const img = await loadImage(buffer)
    
    // For now, we'll use a simple heuristic: crop to the center 75% of the image
    // This is a simplified version that works well for menu photos
    const cropRatio = 0.75
    
    // Define crop dimensions
    const cropWidth = Math.floor(img.width * cropRatio)
    const cropHeight = Math.floor(img.height * cropRatio)
    const cropX = Math.floor((img.width - cropWidth) / 2)
    const cropY = Math.floor((img.height - cropHeight) / 2)
    
    // Apply the crop
    const canvas = createCanvas(cropWidth, cropHeight)
    const ctx = canvas.getContext('2d')
    
    ctx.drawImage(
      img, 
      cropX, 
      cropY, 
      cropWidth, 
      cropHeight,
      0, 0, 
      cropWidth, 
      cropHeight
    )
    
    // Convert canvas back to buffer
    return await canvasToBuffer(canvas)
  } catch (error) {
    console.error('Smart crop failed:', error)
    return buffer // Return original buffer if cropping fails
  }
}

// Main function to process image with auto-cropping (server-side version)
export async function processImageWithAutoCrop(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    console.log('[AutoCrop] Starting auto-cropping process')
    
    // Try smart crop first
    console.log('[AutoCrop] Applying smart crop')
    const smartCroppedBuffer = await smartCropImage(buffer, mimeType)
    
    // If smart crop didn't change the image, try a more aggressive center crop
    if (smartCroppedBuffer.length === buffer.length) {
      console.log('[AutoCrop] Smart crop made no changes, trying center crop')
      const centerCroppedBuffer = await centerCropImage(buffer, mimeType, 0.8)
      
      // Use center crop if it made changes, otherwise use original
      const finalBuffer = centerCroppedBuffer.length !== buffer.length ? centerCroppedBuffer : buffer
      
      console.log('[AutoCrop] Auto-cropping completed successfully')
      return finalBuffer
    }
    
    console.log('[AutoCrop] Auto-cropping completed successfully')
    return smartCroppedBuffer
  } catch (error) {
    console.error('[AutoCrop] Auto-cropping failed:', error)
    return buffer // Return original buffer if cropping fails
  }
}