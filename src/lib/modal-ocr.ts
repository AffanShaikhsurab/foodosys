/**
 * Service for interacting with Modal DeepSeek OCR endpoint
 */

interface OCRResponse {
  text: string;
  mode: string;
  config: any;
}

interface MenuValidationResult {
  isMenu: boolean;
  confidence: number;
  reason?: string;
}

class ModalOCRService {
  private endpointUrl: string;

  constructor() {
    this.endpointUrl = process.env.MODAL_OCR_ENDPOINT || 'https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/';
    console.log('[ModalOCRService] Initialized with endpoint:', this.endpointUrl);
  }

  /**
   * Process image through Modal OCR endpoint
   */
  async processImage(base64Image: string): Promise<OCRResponse> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[ModalOCRService] Starting OCR processing:`, {
      requestId,
      endpoint: this.endpointUrl,
      base64Length: base64Image.length,
      timestamp: new Date().toISOString()
    });

    try {
      console.log(`[ModalOCRService] Sending request to Modal OCR:`, {
        requestId,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Image,
          prompt: "<image>\n<|grounding|>Convert the document to markdown. ",
          mode: "base"
        })
      });

      console.log(`[ModalOCRService] Received response from Modal OCR:`, {
        requestId,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ModalOCRService] OCR API error response:`, {
          requestId,
          status: response.status,
          statusText: response.statusText,
          errorText,
          timestamp: new Date().toISOString()
        });
        throw new Error(`OCR API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log(`[ModalOCRService] OCR processing completed successfully:`, {
        requestId,
        hasText: !!result.text,
        textLength: result.text?.length || 0,
        textPreview: result.text?.substring(0, 100),
        mode: result.mode,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error(`[ModalOCRService] Error calling Modal OCR service:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to process image with OCR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if the OCR text represents a menu using Groq
   */
  async validateMenu(ocrText: string): Promise<MenuValidationResult> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[ModalOCRService] Starting menu validation with Groq:`, {
      requestId,
      textLength: ocrText.length,
      textPreview: ocrText.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    try {
      // Import Groq dynamically to avoid SSR issues
      const { default: Groq } = await import('groq-sdk');
      
      if (!process.env.GROQ_API_KEY) {
        console.error(`[ModalOCRService] GROQ_API_KEY is not configured:`, {
          requestId,
          timestamp: new Date().toISOString()
        });
        throw new Error('GROQ_API_KEY is not configured');
      }

      console.log(`[ModalOCRService] Initializing Groq API:`, {
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

      console.log(`[ModalOCRService] Sending request to Groq API:`, {
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
      
      console.log(`[ModalOCRService] Received response from Groq:`, {
        requestId,
        responseLength: text.length,
        responsePreview: text.substring(0, 200),
        timestamp: new Date().toISOString()
      });
      
      // Clean and parse the JSON response
      const cleanedText = this.cleanJsonResponse(text);
      
      console.log(`[ModalOCRService] Cleaned JSON response:`, {
        requestId,
        cleanedText,
        timestamp: new Date().toISOString()
      });
      
      const validationResult = JSON.parse(cleanedText);
      
      console.log(`[ModalOCRService] Menu validation completed:`, {
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
      console.error(`[ModalOCRService] Error validating menu with Groq:`, {
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
  async processAndValidateMenu(base64Image: string): Promise<{ ocrResult: OCRResponse; validationResult: MenuValidationResult }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[ModalOCRService] Starting combined OCR and validation process:`, {
      requestId,
      base64Length: base64Image.length,
      timestamp: new Date().toISOString()
    });

    try {
      // First, get OCR text
      console.log(`[ModalOCRService] Step 1: Processing image with OCR:`, {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const ocrResult = await this.processImage(base64Image);
      
      console.log(`[ModalOCRService] Step 1 completed: OCR processing successful:`, {
        requestId,
        hasText: !!ocrResult.text,
        textLength: ocrResult.text?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      // Then validate if it's a menu
      console.log(`[ModalOCRService] Step 2: Validating if text represents a menu:`, {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const validationResult = await this.validateMenu(ocrResult.text);
      
      console.log(`[ModalOCRService] Combined process completed successfully:`, {
        requestId,
        isMenu: validationResult.isMenu,
        confidence: validationResult.confidence,
        reason: validationResult.reason,
        ocrTextLength: ocrResult.text?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      return {
        ocrResult,
        validationResult
      };
    } catch (error) {
      console.error(`[ModalOCRService] Error in processAndValidateMenu:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Clean the JSON response from Groq to remove any extra text
   */
  private cleanJsonResponse(text: string): string {
    // Remove any markdown code blocks
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find the first { and the last } to extract just the JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }
}

// Export a singleton instance
export const modalOCRService = new ModalOCRService();