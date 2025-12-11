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
   * Validate if OCR text represents a menu using Groq
   */
  async validateMenu(ocrText: string): Promise<MenuValidationResult> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[OcrSpaceV2Service] Starting menu validation with Groq:`, {
      requestId,
      textLength: ocrText.length,
      textPreview: ocrText.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    try {
      // Import Groq dynamically to avoid SSR issues
      const { default: Groq } = await import('groq-sdk');
      
      if (!process.env.GROQ_API_KEY) {
        console.error(`[OcrSpaceV2Service] GROQ_API_KEY is not configured:`, {
          requestId,
          timestamp: new Date().toISOString()
        });
        throw new Error('GROQ_API_KEY is not configured');
      }

      console.log(`[OcrSpaceV2Service] Initializing Groq API:`, {
        requestId,
        hasApiKey: !!process.env.GROQ_API_KEY,
        apiKeyPrefix: process.env.GROQ_API_KEY?.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

      console.log(`[OcrSpaceV2Service] Sending request to Groq API:`, {
        requestId,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes text to determine if it represents a restaurant menu. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.5,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      });

      const text = completion.choices[0]?.message?.content || '';
      
      console.log(`[OcrSpaceV2Service] Received response from Groq:`, {
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
      console.error(`[OcrSpaceV2Service] Error validating menu with Groq:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      const fallback = this.validateMenuLocally(ocrText)
      console.log(`[OcrSpaceV2Service] Using local heuristic validation fallback:`, {
        requestId,
        isMenu: fallback.isMenu,
        confidence: fallback.confidence,
        reason: fallback.reason,
        timestamp: new Date().toISOString()
      })
      return fallback
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

  validateMenuLocally(ocrText: string): MenuValidationResult {
    const text = (ocrText || '').toLowerCase()
    const priceRegex = /(₹|rs\.?|inr|\$)\s*\d{1,4}(?:[\.,]\d{1,2})?/g
    const plainPriceRegex = /\b\d{2,4}(?:[\.,]\d{1,2})?\b/g
    const sectionRegex = /(breakfast|lunch|dinner|snacks|beverages|drinks|starters|main course|desserts|veg|non-veg|specials)/g
    const lineItemRegex = /^.{2,60}?\s+(₹|rs\.?|inr|\$)?\s*\d{1,4}(?:[\.,]\d{1,2})?$/gm

    const priceHits = (text.match(priceRegex) || []).length
    const plainPriceHits = (text.match(plainPriceRegex) || []).length
    const sectionHits = (text.match(sectionRegex) || []).length
    const lineItemHits = (text.match(lineItemRegex) || []).length

    // Basic scoring
    const priceScore = Math.min(1, (priceHits + plainPriceHits * 0.5) / 10)
    const sectionScore = Math.min(1, sectionHits / 5)
    const lineScore = Math.min(1, lineItemHits / 10)

    const confidence = Math.max(0, Math.min(1, 0.5 * priceScore + 0.3 * sectionScore + 0.2 * lineScore))
    const isMenu = confidence >= 0.5
    const reason = `Heuristic: prices=${priceHits + plainPriceHits}, sections=${sectionHits}, lines=${lineItemHits}`

    return { isMenu, confidence, reason }
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
