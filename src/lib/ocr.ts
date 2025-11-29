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
    
    console.log(`[OCR Service] Initialization check:`, {
      apiKeyProvided: !!apiKey,
      envKey: !!process.env.OCRSPACE_API_KEY,
      envKeyValue: process.env.OCRSPACE_API_KEY?.substring(0, 8),
      finalKey: this.apiKey?.substring(0, 8)
    })
    
    logOCR('OCR service initialized', {
      operation: 'ocr_service_init',
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'none'
    })
  }

  async parseImageFromUrl(imageUrl: string, options: OCRSpaceOptions = {}): Promise<OCRSpaceResponse> {
    const startTime = Date.now()
    const apiKey = options.apikey || this.apiKey
    const requestId = Math.random().toString(36).substring(7)
    
    logOCR('Starting OCR processing from URL', {
      operation: 'ocr_url_start',
      requestId,
      imageUrl: imageUrl.substring(0, 50) + '...',
      language: options.language || 'eng',
      ocrEngine: options.OCREngine || 3,
      isOverlayRequired: options.isOverlayRequired !== false,
      hasApiKey: !!apiKey,
      timestamp: new Date().toISOString()
    })

    console.log(`[OCR Service] URL OCR Start:`, {
      requestId,
      imageUrlPrefix: imageUrl.substring(0, 50),
      hasApiKey: !!apiKey,
      timestamp: new Date().toISOString()
    })
    
    // Use URLSearchParams instead of FormData for better Node.js compatibility
    const params = new URLSearchParams()
    params.append('apikey', apiKey)
    params.append('url', imageUrl)
    params.append('language', options.language || 'eng')
    params.append('OCREngine', (options.OCREngine || 3).toString())
    params.append('isOverlayRequired', (options.isOverlayRequired !== false).toString())

    logOCR('Prepared OCR URL API request', {
      operation: 'ocr_url_params_prepared',
      requestId,
      paramCount: Array.from(params.keys()).length,
      bodySize: params.toString().length
    })

    console.log(`[OCR Service] URL API Request:`, {
      requestId,
      endpoint: `${this.baseUrl}/Parse/Image`,
      bodySize: params.toString().length,
      timestamp: new Date().toISOString()
    })

    let response: Response | null = null
    const fetchStartTime = Date.now()

    try {
      console.log(`[OCR Service] Initiating URL fetch...`, { requestId, timestamp: new Date().toISOString() })
      
      response = await fetch(`${this.baseUrl}/Parse/Image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
      })

      const fetchDuration = Date.now() - fetchStartTime
      console.log(`[OCR Service] URL fetch completed:`, {
        requestId,
        status: response.status,
        statusText: response.statusText,
        fetchDuration,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      const fetchDuration = Date.now() - fetchStartTime
      const fetchError = error instanceof Error ? error.message : String(error)
      
      console.error(`[OCR Service] URL Fetch Error:`, {
        requestId,
        error: fetchError,
        fetchDuration,
        timestamp: new Date().toISOString()
      })
      
      logOCR('OCR URL fetch failed', {
        operation: 'ocr_url_fetch_error',
        requestId,
        fetchDuration,
        error: fetchError
      })
      
      throw new Error(`OCR API URL fetch failed: ${fetchError}`)
    }

    if (!response.ok) {
      const processingTime = Date.now() - startTime
      let responseText = ''
      try {
        responseText = await response.text()
      } catch (textError) {
        responseText = '[Could not read response body]'
      }
      
      console.error(`[OCR Service] URL HTTP Error:`, {
        requestId,
        processingTime,
        statusCode: response.status,
        statusText: response.statusText,
        responsePreview: responseText.substring(0, 300),
        timestamp: new Date().toISOString()
      })
      
      logOCR('OCR URL API HTTP error', {
        operation: 'ocr_url_api_http_error',
        requestId,
        processingTime,
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: responseText?.substring(0, 200)
      })
      
      throw new Error(`OCR API request failed: ${response.statusText} - ${responseText?.substring(0, 100)}`)
    }

    let result: OCRSpaceResponse | null = null
    try {
      result = await response.json()
      console.log(`[OCR Service] URL Response parsed:`, {
        requestId,
        isErroredOnProcessing: result.IsErroredOnProcessing,
        hasParsedResults: !!result.ParsedResults,
        timestamp: new Date().toISOString()
      })
    } catch (jsonError) {
      const jsonErrorMsg = jsonError instanceof Error ? jsonError.message : String(jsonError)
      console.error(`[OCR Service] URL JSON parse failed:`, {
        requestId,
        error: jsonErrorMsg,
        timestamp: new Date().toISOString()
      })
      
      throw new Error(`Failed to parse OCR API response: ${jsonErrorMsg}`)
    }

    const processingTime = Date.now() - startTime

    if (result.IsErroredOnProcessing || result.ErrorMessage || result.ErrorMessages) {
      console.error(`[OCR Service] URL OCR Error:`, {
        requestId,
        processingTime,
        isErroredOnProcessing: result.IsErroredOnProcessing,
        errorMessage: result.ErrorMessage,
        errorMessages: result.ErrorMessages,
        timestamp: new Date().toISOString()
      })
      
      logOCR('OCR URL processing returned error', {
        operation: 'ocr_url_processing_failed',
        requestId,
        processingTime,
        hasError: result.IsErroredOnProcessing,
        errorMessages: result.ErrorMessage,
        errorDetails: result.ErrorMessages
      })
      
      throw new Error(
        `OCR processing failed: ${result.ErrorMessage?.join(', ') || result.ErrorMessages?.join(', ') || 'Unknown error'}`
      )
    }

    console.log(`[OCR Service] URL OCR Success:`, {
      requestId,
      processingTime,
      apiProcessingTime: result.ProcessingTimeInMilliseconds,
      parsedTextLength: result.ParsedResults?.[0]?.ParsedText?.length || 0,
      textOverlayLines: result.ParsedResults?.[0]?.TextOverlay?.Lines?.length || 0,
      timestamp: new Date().toISOString()
    })

    logOCR('OCR processing completed successfully for URL', {
      operation: 'ocr_url_processing_success',
      requestId,
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
    const apiKey = options.apikey || this.apiKey
    const requestId = Math.random().toString(36).substring(7)
    
    logOCR('Starting OCR processing from base64', {
      operation: 'ocr_base64_start',
      requestId,
      base64Length: base64Image.length,
      base64Prefix: base64Image.substring(0, 30) + '...',
      language: options.language || 'eng',
      ocrEngine: options.OCREngine || 3,
      isOverlayRequired: options.isOverlayRequired !== false,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey?.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    })
    
    console.log(`[OCR Service] Base64 OCR Start:`, {
      requestId,
      base64Length: base64Image.length,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey?.substring(0, 8),
      timestamp: new Date().toISOString()
    })

    // Use URLSearchParams instead of FormData for better Node.js compatibility
    const params = new URLSearchParams()
    params.append('apikey', apiKey)
    params.append('base64Image', base64Image)
    params.append('language', options.language || 'eng')
    params.append('OCREngine', (options.OCREngine || 3).toString())
    params.append('isOverlayRequired', (options.isOverlayRequired !== false).toString())

    logOCR('Prepared OCR API request parameters', {
      operation: 'ocr_params_prepared',
      requestId,
      paramCount: Array.from(params.keys()).length,
      paramsKeys: Array.from(params.keys()),
      bodySize: params.toString().length
    })

    console.log(`[OCR Service] API Request Details:`, {
      requestId,
      endpoint: `${this.baseUrl}/Parse/Image`,
      method: 'POST',
      bodySize: params.toString().length,
      language: options.language || 'eng',
      ocrEngine: options.OCREngine || 3,
      timestamp: new Date().toISOString()
    })

    let response: Response | null = null
    let fetchError: Error | null = null
    const fetchStartTime = Date.now()

    try {
      console.log(`[OCR Service] Initiating fetch to OCR.Space API...`, { requestId, timestamp: new Date().toISOString() })
      
      response = await fetch(`${this.baseUrl}/Parse/Image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
      })

      const fetchDuration = Date.now() - fetchStartTime
      console.log(`[OCR Service] Fetch completed:`, {
        requestId,
        status: response.status,
        statusText: response.statusText,
        fetchDuration,
        contentLength: response.headers.get('content-length'),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      fetchError = error instanceof Error ? error : new Error(String(error))
      const fetchDuration = Date.now() - fetchStartTime
      
      const errorMsg = fetchError.message
      console.error(`[OCR Service] Fetch Error:`, {
        requestId,
        error: errorMsg,
        fetchDuration,
        errorType: fetchError.constructor.name,
        timestamp: new Date().toISOString()
      })
      
      logOCR('OCR API fetch failed', {
        operation: 'ocr_api_fetch_error',
        requestId,
        fetchDuration,
        error: errorMsg,
        errorType: fetchError.constructor.name
      })
      
      throw new Error(`OCR API fetch failed: ${errorMsg}`)
    }

    if (!response.ok) {
      const processingTime = Date.now() - startTime
      let responseText = ''
      try {
        responseText = await response.text()
      } catch (textError) {
        responseText = '[Could not read response body]'
      }
      
      console.error(`[OCR Service] HTTP Error Response:`, {
        requestId,
        processingTime,
        statusCode: response.status,
        statusText: response.statusText,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 300),
        timestamp: new Date().toISOString()
      })
      
      logOCR('OCR API HTTP error', {
        operation: 'ocr_api_http_error',
        requestId,
        processingTime,
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: responseText?.substring(0, 200)
      })
      
      throw new Error(`OCR API HTTP Error: ${response.status} ${response.statusText} - ${responseText?.substring(0, 100)}`)
    }

    let result: OCRSpaceResponse | null = null
    try {
      result = await response.json()
      console.log(`[OCR Service] Response JSON parsed successfully:`, {
        requestId,
        isErroredOnProcessing: result.IsErroredOnProcessing,
        hasParsedResults: !!result.ParsedResults,
        parseResultsCount: result.ParsedResults?.length || 0,
        timestamp: new Date().toISOString()
      })
    } catch (jsonError) {
      const jsonErrorMsg = jsonError instanceof Error ? jsonError.message : String(jsonError)
      console.error(`[OCR Service] Failed to parse JSON response:`, {
        requestId,
        error: jsonErrorMsg,
        timestamp: new Date().toISOString()
      })
      
      logOCR('OCR API JSON parse failed', {
        operation: 'ocr_json_parse_failed',
        requestId,
        error: jsonErrorMsg
      })
      
      throw new Error(`Failed to parse OCR API response: ${jsonErrorMsg}`)
    }

    const processingTime = Date.now() - startTime

    if (result.IsErroredOnProcessing || result.ErrorMessage || result.ErrorMessages) {
      console.error(`[OCR Service] OCR Processing Error Detected:`, {
        requestId,
        processingTime,
        isErroredOnProcessing: result.IsErroredOnProcessing,
        errorMessage: result.ErrorMessage,
        errorMessages: result.ErrorMessages,
        apiProcessingTime: result.ProcessingTimeInMilliseconds,
        timestamp: new Date().toISOString()
      })
      
      logOCR('OCR processing returned error', {
        operation: 'ocr_base64_processing_failed',
        requestId,
        processingTime,
        hasError: result.IsErroredOnProcessing,
        errorMessages: result.ErrorMessage,
        errorDetails: result.ErrorMessages,
        apiProcessingTime: result.ProcessingTimeInMilliseconds
      })
      
      const errorMsg = result.ErrorMessage?.join(', ') || result.ErrorMessages?.join(', ') || 'Unknown error'
      throw new Error(`OCR processing failed: ${errorMsg}`)
    }

    console.log(`[OCR Service] OCR Processing Success:`, {
      requestId,
      processingTime,
      apiProcessingTime: result.ProcessingTimeInMilliseconds,
      hasParsedResults: !!result.ParsedResults,
      parsedResultsCount: result.ParsedResults?.length || 0,
      parsedTextLength: result.ParsedResults?.[0]?.ParsedText?.length || 0,
      textOverlayLines: result.ParsedResults?.[0]?.TextOverlay?.Lines?.length || 0,
      parsedTextPreview: result.ParsedResults?.[0]?.ParsedText?.substring(0, 100),
      timestamp: new Date().toISOString()
    })

    logOCR('OCR processing completed successfully for base64', {
      operation: 'ocr_base64_processing_success',
      requestId,
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