/**
 * OCR.space API v2 Service
 * This service provides OCR functionality using the OCR.space API v2 directly
 */

import https from 'node:https';
import http from 'node:http';
import querystring from 'node:querystring';

interface OcrSpaceV2Options {
  language?: string;
  isOverlayRequired?: boolean;
  filetype?: string;
  detectOrientation?: boolean;
  isCreateSearchablePdf?: boolean;
  isSearchablePdfHideTextLayer?: boolean;
  scale?: boolean;
  isTable?: boolean;
  OCREngine?: 1 | 2;
}

interface OcrSpaceV2Response {
  ParsedResults: Array<{
    TextOverlay: {
      Lines: Array<any>;
      HasOverlay: boolean;
      Message: string;
    };
    TextOrientation: string;
    FileParseExitCode: number;
    ParsedText: string;
    ErrorMessage: string;
    ErrorDetails: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string;
  ErrorDetails?: string;
  SearchablePDFURL?: string;
  ProcessingTimeInMilliseconds: string;
}

interface MenuValidationResult {
  isMenu: boolean;
  confidence: number;
  reason?: string;
}

class OcrSpaceV2Service {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.OCRSPACE_API_KEY || 'helloworld'; // Default to test key
    this.apiUrl = 'https://api.ocr.space/parse/image';
    console.log('[OcrSpaceV2Service] Initialized with API endpoint:', this.apiUrl);
  }

  /**
   * Helper function to make HTTP POST request with proper redirect handling
   */
  private makePostRequest(url: string, data: any, headers: any = {}): Promise<OcrSpaceV2Response> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const postData = querystring.stringify(data);
      
      const defaultHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      };
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: defaultHeaders,
        maxRedirects: 5,
        followRedirects: true
      };
      
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
  }

  /**
   * Process image from base64 string
   */
  async processImageFromBase64(base64Image: string, options: OcrSpaceV2Options = {}): Promise<OcrSpaceV2Response> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[OcrSpaceV2Service] Starting OCR processing from base64:`, {
      requestId,
      base64Length: base64Image.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Prepare data for API v2
      const apiData = {
        apikey: this.apiKey,
        base64Image: base64Image,
        language: options.language || 'eng',
        isOverlayRequired: options.isOverlayRequired !== undefined ? options.isOverlayRequired : false,
        detectOrientation: options.detectOrientation !== undefined ? options.detectOrientation : true,
        scale: options.scale !== undefined ? options.scale : true,
        OCREngine: options.OCREngine || 2, // Use Engine 2 for better text recognition
        ...(options.filetype && { filetype: options.filetype }),
        ...(options.isCreateSearchablePdf && { isCreateSearchablePdf: options.isCreateSearchablePdf }),
        ...(options.isSearchablePdfHideTextLayer && { isSearchablePdfHideTextLayer: options.isSearchablePdfHideTextLayer }),
        ...(options.isTable && { isTable: options.isTable })
      };

      console.log(`[OcrSpaceV2Service] Sending request to OCR.space API v2:`, {
        requestId,
        options: {
          language: apiData.language,
          OCREngine: apiData.OCREngine,
          isOverlayRequired: apiData.isOverlayRequired,
          detectOrientation: apiData.detectOrientation,
          scale: apiData.scale
        },
        timestamp: new Date().toISOString()
      });

      const result = await this.makePostRequest(this.apiUrl, apiData);

      console.log(`[OcrSpaceV2Service] OCR processing completed:`, {
        requestId,
        exitCode: result.OCRExitCode,
        isErrored: result.IsErroredOnProcessing,
        processingTime: result.ProcessingTimeInMilliseconds,
        hasResults: !!(result.ParsedResults && result.ParsedResults.length > 0),
        textLength: result.ParsedResults?.[0]?.ParsedText?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (result.IsErroredOnProcessing || result.OCRExitCode !== 1) {
        throw new Error(
          `OCR processing failed: ${result.ErrorMessage || 'Unknown error'} (Exit Code: ${result.OCRExitCode})`
        );
      }

      return result;
    } catch (error) {
      console.error(`[OcrSpaceV2Service] Error processing image:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw new Error(`OCR API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process image from URL
   */
  async processImageFromUrl(imageUrl: string, options: OcrSpaceV2Options = {}): Promise<OcrSpaceV2Response> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[OcrSpaceV2Service] Starting OCR processing from URL:`, {
      requestId,
      imageUrl,
      timestamp: new Date().toISOString()
    });

    try {
      // Prepare data for API v2
      const apiData = {
        apikey: this.apiKey,
        url: imageUrl,
        language: options.language || 'eng',
        isOverlayRequired: options.isOverlayRequired !== undefined ? options.isOverlayRequired : false,
        detectOrientation: options.detectOrientation !== undefined ? options.detectOrientation : true,
        scale: options.scale !== undefined ? options.scale : true,
        OCREngine: options.OCREngine || 2,
        ...(options.filetype && { filetype: options.filetype }),
        ...(options.isCreateSearchablePdf && { isCreateSearchablePdf: options.isCreateSearchablePdf }),
        ...(options.isSearchablePdfHideTextLayer && { isSearchablePdfHideTextLayer: options.isSearchablePdfHideTextLayer }),
        ...(options.isTable && { isTable: options.isTable })
      };

      console.log(`[OcrSpaceV2Service] Sending request to OCR.space API v2:`, {
        requestId,
        options: {
          language: apiData.language,
          OCREngine: apiData.OCREngine,
          isOverlayRequired: apiData.isOverlayRequired,
          detectOrientation: apiData.detectOrientation,
          scale: apiData.scale
        },
        timestamp: new Date().toISOString()
      });

      const result = await this.makePostRequest(this.apiUrl, apiData);

      console.log(`[OcrSpaceV2Service] OCR processing completed:`, {
        requestId,
        exitCode: result.OCRExitCode,
        isErrored: result.IsErroredOnProcessing,
        processingTime: result.ProcessingTimeInMilliseconds,
        hasResults: !!(result.ParsedResults && result.ParsedResults.length > 0),
        textLength: result.ParsedResults?.[0]?.ParsedText?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (result.IsErroredOnProcessing || result.OCRExitCode !== 1) {
        throw new Error(
          `OCR processing failed: ${result.ErrorMessage || 'Unknown error'} (Exit Code: ${result.OCRExitCode})`
        );
      }

      return result;
    } catch (error) {
      console.error(`[OcrSpaceV2Service] Error processing image:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw new Error(`OCR API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if OCR text represents a menu using Gemini
   */
  async validateMenu(ocrText: string): Promise<MenuValidationResult> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[OcrSpaceV2Service] Starting menu validation with Gemini:`, {
      requestId,
      textLength: ocrText.length,
      textPreview: ocrText.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    try {
      // Import GoogleGenerativeAI dynamically to avoid SSR issues
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      if (!process.env.GEMINI_API_KEY) {
        console.error(`[OcrSpaceV2Service] GEMINI_API_KEY is not configured:`, {
          requestId,
          timestamp: new Date().toISOString()
        });
        throw new Error('GEMINI_API_KEY is not configured');
      }

      console.log(`[OcrSpaceV2Service] Initializing Gemini API:`, {
        requestId,
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = `
        Analyze the following text and determine if it represents a restaurant menu.
        
        Text to analyze:
        """
        ${ocrText}
        """
        
        Return a JSON object with the following structure:
        {
          "isMenu": true/false,
          "confidence": 0.0-1.0,
          "reason": "Brief explanation of why it is or isn't a menu"
        }
        
        Consider these factors:
        1. Presence of food items with prices
        2. Menu sections (e.g., appetizers, main courses, beverages)
        3. Restaurant-specific formatting
        4. Food preparation descriptions
        5. Currency symbols or price formats
        
        Return valid JSON only, no additional text.
      `;

      console.log(`[OcrSpaceV2Service] Sending request to Gemini API:`, {
        requestId,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[OcrSpaceV2Service] Received response from Gemini:`, {
        requestId,
        responseLength: text.length,
        responsePreview: text.substring(0, 200),
        timestamp: new Date().toISOString()
      });
      
      // Clean and parse JSON response
      const cleanedText = this.cleanJsonResponse(text);
      
      console.log(`[OcrSpaceV2Service] Cleaned JSON response:`, {
        requestId,
        cleanedText,
        timestamp: new Date().toISOString()
      });
      
      const validationResult = JSON.parse(cleanedText);
      
      console.log(`[OcrSpaceV2Service] Menu validation completed:`, {
        requestId,
        isMenu: validationResult.isMenu,
        confidence: validationResult.confidence,
        reason: validationResult.reason,
        timestamp: new Date().toISOString()
      });
      
      return {
        isMenu: validationResult.isMenu || false,
        confidence: validationResult.confidence || 0,
        reason: validationResult.reason || ''
      };
    } catch (error) {
      console.error(`[OcrSpaceV2Service] Error validating menu with Gemini:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      // Return a default result in case of error
      return {
        isMenu: false,
        confidence: 0,
        reason: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process image and validate if it's a menu in one step
   */
  async processAndValidateMenu(base64Image: string, options: OcrSpaceV2Options = {}): Promise<{ 
    ocrResult: OcrSpaceV2Response; 
    validationResult: MenuValidationResult 
  }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[OcrSpaceV2Service] Starting combined OCR and validation process:`, {
      requestId,
      base64Length: base64Image.length,
      timestamp: new Date().toISOString()
    });

    try {
      // First, get OCR text
      console.log(`[OcrSpaceV2Service] Step 1: Processing image with OCR:`, {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const ocrResult = await this.processImageFromBase64(base64Image, options);
      
      console.log(`[OcrSpaceV2Service] Step 1 completed: OCR processing successful:`, {
        requestId,
        hasText: !!(ocrResult.ParsedResults && ocrResult.ParsedResults[0]?.ParsedText),
        textLength: ocrResult.ParsedResults?.[0]?.ParsedText?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      // Then validate if it's a menu
      console.log(`[OcrSpaceV2Service] Step 2: Validating if text represents a menu:`, {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const ocrText = ocrResult.ParsedResults?.[0]?.ParsedText || '';
      const validationResult = await this.validateMenu(ocrText);
      
      console.log(`[OcrSpaceV2Service] Combined process completed successfully:`, {
        requestId,
        isMenu: validationResult.isMenu,
        confidence: validationResult.confidence,
        reason: validationResult.reason,
        ocrTextLength: ocrText.length,
        timestamp: new Date().toISOString()
      });
      
      return {
        ocrResult,
        validationResult
      };
    } catch (error) {
      console.error(`[OcrSpaceV2Service] Error in processAndValidateMenu:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Clean JSON response from Gemini to remove any extra text
   */
  private cleanJsonResponse(text: string): string {
    // Remove any markdown code blocks
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find first { and last } to extract just the JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }
}

// Export a singleton instance
export const ocrSpaceV2Service = new OcrSpaceV2Service();
export type { OcrSpaceV2Options, OcrSpaceV2Response, MenuValidationResult };