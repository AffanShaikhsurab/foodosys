import { ocrSpaceV2Service, OcrSpaceV2Options, OcrSpaceV2Response } from './ocr-space-v2'

// Re-export the types for use in other files
export type { OcrSpaceV2Options, OcrSpaceV2Response }

// Legacy type aliases for backward compatibility
export type OcrSpaceOptions = OcrSpaceV2Options
export type OcrSpaceResponse = OcrSpaceV2Response

class OCRService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.OCRSPACE_API_KEY || ''
  }

  async parseImageFromUrl(imageUrl: string, options: OcrSpaceV2Options = {}): Promise<OcrSpaceV2Response> {
    try {
      console.log('[OCRService] Processing image from URL using OCR.space API v2:', {
        imageUrl,
        options: {
          language: options.language || 'eng',
          OCREngine: options.OCREngine || 2,
          isOverlayRequired: options.isOverlayRequired !== false,
          scale: options.scale !== false,
          detectOrientation: options.detectOrientation !== false
        }
      })

      const result = await ocrSpaceV2Service.processImageFromUrl(imageUrl, {
        language: options.language || 'eng',
        OCREngine: options.OCREngine || 2, // Default to Engine 2 for better text recognition
        isOverlayRequired: options.isOverlayRequired !== false,
        scale: options.scale !== false,
        detectOrientation: options.detectOrientation !== false,
        ...(options.filetype && { filetype: options.filetype }),
        ...(options.isCreateSearchablePdf && { isCreateSearchablePdf: options.isCreateSearchablePdf }),
        ...(options.isSearchablePdfHideTextLayer && { isSearchablePdfHideTextLayer: options.isSearchablePdfHideTextLayer }),
        ...(options.isTable && { isTable: options.isTable })
      })

      console.log('[OCRService] OCR processing completed successfully:', {
        exitCode: result.OCRExitCode,
        isErrored: result.IsErroredOnProcessing,
        processingTime: result.ProcessingTimeInMilliseconds,
        hasResults: !!(result.ParsedResults && result.ParsedResults.length > 0),
        textLength: result.ParsedResults?.[0]?.ParsedText?.length || 0
      })

      return result
    } catch (error) {
      console.error('[OCRService] Error processing image from URL:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw new Error(`OCR API error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async parseImageFromBase64(base64Image: string, options: OcrSpaceV2Options = {}): Promise<OcrSpaceV2Response> {
    try {
      console.log('[OCRService] Processing image from base64 using OCR.space API v2:', {
        base64Length: base64Image.length,
        options: {
          language: options.language || 'eng',
          OCREngine: options.OCREngine || 2,
          isOverlayRequired: options.isOverlayRequired !== false,
          scale: options.scale !== false,
          detectOrientation: options.detectOrientation !== false
        }
      })

      const result = await ocrSpaceV2Service.processImageFromBase64(base64Image, {
        language: options.language || 'eng',
        OCREngine: options.OCREngine || 2, // Default to Engine 2 for better text recognition
        isOverlayRequired: options.isOverlayRequired !== false,
        scale: options.scale !== false,
        detectOrientation: options.detectOrientation !== false,
        ...(options.filetype && { filetype: options.filetype }),
        ...(options.isCreateSearchablePdf && { isCreateSearchablePdf: options.isCreateSearchablePdf }),
        ...(options.isSearchablePdfHideTextLayer && { isSearchablePdfHideTextLayer: options.isSearchablePdfHideTextLayer }),
        ...(options.isTable && { isTable: options.isTable })
      })

      console.log('[OCRService] OCR processing completed successfully:', {
        exitCode: result.OCRExitCode,
        isErrored: result.IsErroredOnProcessing,
        processingTime: result.ProcessingTimeInMilliseconds,
        hasResults: !!(result.ParsedResults && result.ParsedResults.length > 0),
        textLength: result.ParsedResults?.[0]?.ParsedText?.length || 0
      })

      return result
    } catch (error) {
      console.error('[OCRService] Error processing image from base64:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw new Error(`OCR API error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export const ocrService = new OCRService()