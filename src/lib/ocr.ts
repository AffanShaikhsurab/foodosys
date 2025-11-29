import FormData from 'form-data'
import { logOCR, logger } from './logger'

interface OCRSpaceOptions {
  apikey?: string
  url?: string
  language?: string
  OCREngine?: number
  isOverlayRequired?: boolean
}

interface OCRSpaceResponse {
  IsErroredOnProcessing: boolean
  ErrorMessage?: string[]
  ErrorMessages?: string[]
  ParsedResults?: Array<{
    ParsedText: string
    TextOverlay?: {
      Lines: any[]
    }
  }>
  ProcessingTimeInMilliseconds?: number
}

class OCRService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OCRSPACE_API_KEY || 'helloworld'
    this.baseUrl = 'https://api.ocr.space'
    
    logOCR('OCR service initialized', {
      operation: 'ocr_service_init',
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'none'
    })
  }

  async parseImageFromUrl(imageUrl: string, options: OCRSpaceOptions = {}): Promise<OCRSpaceResponse> {
    const startTime = Date.now()
    
    logOCR('Starting OCR processing from URL', {
      operation: 'ocr_url_start',
      imageUrl: imageUrl.substring(0, 50) + '...',
      language: options.language || 'eng',
      ocrEngine: options.OCREngine || 3,
      isOverlayRequired: options.isOverlayRequired !== false
    })
    
    const formData = new FormData()
    formData.append('apikey', options.apikey || this.apiKey)
    formData.append('url', imageUrl)
    formData.append('language', options.language || 'eng')
    formData.append('OCREngine', (options.OCREngine || 3).toString())
    formData.append('isOverlayRequired', (options.isOverlayRequired !== false).toString())

    logOCR('Sending OCR API request', {
      operation: 'ocr_api_request',
      endpoint: `${this.baseUrl}/Parse/Image`,
      formDataKeys: Array.from(formData as any).keys()
    })

    const response = await fetch(`${this.baseUrl}/Parse/Image`, {
      method: 'POST',
      body: formData as any,
    })

    if (!response.ok) {
      const processingTime = Date.now() - startTime
      
      logOCR('OCR API request failed', {
        operation: 'ocr_api_failed',
        processingTime,
        statusCode: response.status,
        statusText: response.statusText
      })
      
      throw new Error(`OCR API request failed: ${response.statusText}`)
    }

    const result: OCRSpaceResponse = await response.json()
    const processingTime = Date.now() - startTime

    if (result.IsErroredOnProcessing || result.ErrorMessage || result.ErrorMessages) {
      logOCR('OCR processing failed', {
        operation: 'ocr_processing_failed',
        processingTime,
        hasError: result.IsErroredOnProcessing,
        errorMessages: result.ErrorMessage,
        errorDetails: result.ErrorMessages
      })
      
      throw new Error(
        `OCR processing failed: ${result.ErrorMessage?.join(', ') || result.ErrorMessages?.join(', ') || 'Unknown error'}`
      )
    }

    logOCR('OCR processing completed successfully', {
      operation: 'ocr_processing_success',
      processingTime,
      hasParsedResults: !!result.ParsedResults,
      parsedTextLength: result.ParsedResults?.[0]?.ParsedText?.length || 0,
      textOverlayLines: result.ParsedResults?.[0]?.TextOverlay?.Lines?.length || 0,
      apiProcessingTime: result.ProcessingTimeInMilliseconds
    })

    return result
  }

  async parseImageFromBase64(base64Image: string, options: OCRSpaceOptions = {}): Promise<OCRSpaceResponse> {
    const startTime = Date.now()
    
    logOCR('Starting OCR processing from base64', {
      operation: 'ocr_base64_start',
      base64Length: base64Image.length,
      language: options.language || 'eng',
      ocrEngine: options.OCREngine || 3,
      isOverlayRequired: options.isOverlayRequired !== false
    })
    
    const formData = new FormData()
    formData.append('apikey', options.apikey || this.apiKey)
    formData.append('base64Image', base64Image)
    formData.append('language', options.language || 'eng')
    formData.append('OCREngine', (options.OCREngine || 3).toString())
    formData.append('isOverlayRequired', (options.isOverlayRequired !== false).toString())

    logOCR('Sending OCR API request for base64', {
      operation: 'ocr_api_base64_request',
      endpoint: `${this.baseUrl}/Parse/Image`,
      formDataKeys: Array.from(formData as any).keys()
    })

    const response = await fetch(`${this.baseUrl}/Parse/Image`, {
      method: 'POST',
      body: formData as any,
    })

    if (!response.ok) {
      const processingTime = Date.now() - startTime
      
      logOCR('OCR API request failed for base64', {
        operation: 'ocr_api_base64_failed',
        processingTime,
        statusCode: response.status,
        statusText: response.statusText
      })
      
      throw new Error(`OCR API request failed: ${response.statusText}`)
    }

    const result: OCRSpaceResponse = await response.json()
    const processingTime = Date.now() - startTime

    if (result.IsErroredOnProcessing || result.ErrorMessage || result.ErrorMessages) {
      logOCR('OCR processing failed for base64', {
        operation: 'ocr_base64_processing_failed',
        processingTime,
        hasError: result.IsErroredOnProcessing,
        errorMessages: result.ErrorMessage,
        errorDetails: result.ErrorMessages
      })
      
      throw new Error(
        `OCR processing failed: ${result.ErrorMessage?.join(', ') || result.ErrorMessages?.join(', ') || 'Unknown error'}`
      )
    }

    logOCR('OCR processing completed successfully for base64', {
      operation: 'ocr_base64_processing_success',
      processingTime,
      hasParsedResults: !!result.ParsedResults,
      parsedTextLength: result.ParsedResults?.[0]?.ParsedText?.length || 0,
      textOverlayLines: result.ParsedResults?.[0]?.TextOverlay?.Lines?.length || 0,
      apiProcessingTime: result.ProcessingTimeInMilliseconds
    })

    return result
  }
}

export const ocrService = new OCRService()