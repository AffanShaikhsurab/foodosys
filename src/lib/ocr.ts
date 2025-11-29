import { ocrSpace, OcrSpaceResponse, OcrSpaceOptions } from 'ocr-space-api-wrapper'

// Re-export the types for use in other files
export type { OcrSpaceResponse, OcrSpaceOptions }

class OCRService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.OCRSPACE_API_KEY || ''
  }

  async parseImageFromUrl(imageUrl: string, options: OcrSpaceOptions = {}): Promise<OcrSpaceResponse> {
    try {
      const result = await ocrSpace(imageUrl, {
        apiKey: options.apiKey || this.apiKey,
        language: options.language || 'eng',
        OCREngine: options.OCREngine || '1',
        isOverlayRequired: options.isOverlayRequired !== false,
        scale: options.scale !== false,
        detectOrientation: options.detectOrientation !== false,
        ocrUrl: options.ocrUrl
      })

      if (result.IsErroredOnProcessing || result.ErrorMessage) {
        throw new Error(
          `OCR processing failed: ${result.ErrorMessage || 'Unknown error'}`
        )
      }

      return result
    } catch (error) {
      throw new Error(`OCR API error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async parseImageFromBase64(base64Image: string, options: OcrSpaceOptions = {}): Promise<OcrSpaceResponse> {
    try {
      const result = await ocrSpace(base64Image, {
        apiKey: options.apiKey || this.apiKey,
        language: options.language || 'eng',
        OCREngine: options.OCREngine || '1',
        isOverlayRequired: options.isOverlayRequired !== false,
        scale: options.scale !== false,
        detectOrientation: options.detectOrientation !== false,
        ocrUrl: options.ocrUrl
      })

      if (result.IsErroredOnProcessing || result.ErrorMessage) {
        throw new Error(
          `OCR processing failed: ${result.ErrorMessage || 'Unknown error'}`
        )
      }

      return result
    } catch (error) {
      throw new Error(`OCR API error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export const ocrService = new OCRService()