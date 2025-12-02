/**
 * Service for OCR using Groq's Llama 4 Maverick model
 * This provides an additional OCR option to complement OCR.space
 */

interface MaverickOCRResponse {
  text: string;
  model: string;
  processingTime?: number;
}

interface MenuValidationResult {
  isMenu: boolean;
  confidence: number;
  reason?: string;
}

class MaverickOCRService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = 'meta-llama/llama-4-maverick-17b-128e-instruct';
    
    if (!this.apiKey) {
      console.warn('[MaverickOCRService] GROQ_API_KEY is not configured');
    }
    
    console.log('[MaverickOCRService] Initialized with model:', this.model);
  }

  /**
   * Process image using Groq's Llama 4 Maverick model for OCR
   */
  async processImage(base64Image: string): Promise<MaverickOCRResponse> {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`[MaverickOCRService] Starting OCR processing:`, {
      requestId,
      model: this.model,
      base64Length: base64Image.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Import Groq dynamically to avoid SSR issues
      const { default: Groq } = await import('groq-sdk');
      
      if (!this.apiKey) {
        throw new Error('GROQ_API_KEY is not configured');
      }

      console.log(`[MaverickOCRService] Initializing Groq API:`, {
        requestId,
        hasApiKey: !!this.apiKey,
        apiKeyPrefix: this.apiKey?.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });

      const groq = new Groq({ apiKey: this.apiKey });

      // Prepare the image for the Maverick model
      const imageContent = base64Image.startsWith('data:') 
        ? base64Image 
        : `data:image/jpeg;base64,${base64Image}`;

      const prompt = `
        Please extract all text from this image accurately.
        
        Requirements:
        1. Extract ALL visible text, including menu items, prices, descriptions, and section headers
        2. Preserve the structure and formatting as much as possible
        3. Include prices with their corresponding menu items
        4. Maintain line breaks and sections to preserve readability
        5. If you see currency symbols (₹, $, Rs, etc.), include them with the prices
        6. Pay special attention to:
           - Food item names
           - Prices and currency symbols
           - Section headings (appetizers, main course, etc.)
           - Descriptions of food items
           - Any numbers or quantities
        
        Return the extracted text in a clean, readable format that preserves the menu structure.
      `;

      console.log(`[MaverickOCRService] Sending request to Groq API:`, {
        requestId,
        promptLength: prompt.length,
        imagePreview: imageContent.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert OCR system specialized in extracting text from restaurant menu images. Extract all text accurately while preserving structure and formatting."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageContent
                }
              }
            ]
          }
        ],
        model: this.model,
        temperature: 0.1, // Low temperature for more accurate OCR
        max_tokens: 4096,
        top_p: 0.9,
        stream: false
      });

      const extractedText = completion.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;
      
      console.log(`[MaverickOCRService] OCR processing completed successfully:`, {
        requestId,
        hasText: !!extractedText,
        textLength: extractedText.length,
        textPreview: extractedText.substring(0, 200),
        processingTime,
        timestamp: new Date().toISOString()
      });

      return {
        text: extractedText,
        model: this.model,
        processingTime
      };
    } catch (error) {
      console.error(`[MaverickOCRService] Error processing image:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Maverick OCR error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if the OCR text represents a menu using Groq
   */
  async validateMenu(ocrText: string): Promise<MenuValidationResult> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[MaverickOCRService] Starting menu validation:`, {
      requestId,
      textLength: ocrText.length,
      textPreview: ocrText.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    try {
      // Import Groq dynamically to avoid SSR issues
      const { default: Groq } = await import('groq-sdk');
      
      if (!this.apiKey) {
        throw new Error('GROQ_API_KEY is not configured');
      }

      const groq = new Groq({ apiKey: this.apiKey });

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

      console.log(`[MaverickOCRService] Sending validation request to Groq API:`, {
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
      
      console.log(`[MaverickOCRService] Received validation response:`, {
        requestId,
        responseLength: text.length,
        responsePreview: text.substring(0, 200),
        timestamp: new Date().toISOString()
      });
      
      // Clean and parse JSON response
      const cleanedText = this.cleanJsonResponse(text);
      
      console.log(`[MaverickOCRService] Cleaned JSON response:`, {
        requestId,
        cleanedText,
        timestamp: new Date().toISOString()
      });
      
      const validationResult = JSON.parse(cleanedText);
      
      console.log(`[MaverickOCRService] Menu validation completed:`, {
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
      console.error(`[MaverickOCRService] Error validating menu:`, {
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
  async processAndValidateMenu(base64Image: string): Promise<{ 
    ocrResult: MaverickOCRResponse; 
    validationResult: MenuValidationResult 
  }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[MaverickOCRService] Starting combined OCR and validation process:`, {
      requestId,
      base64Length: base64Image.length,
      timestamp: new Date().toISOString()
    });

    try {
      // First, get OCR text
      console.log(`[MaverickOCRService] Step 1: Processing image with Maverick OCR:`, {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const ocrResult = await this.processImage(base64Image);
      
      console.log(`[MaverickOCRService] Step 1 completed: OCR processing successful:`, {
        requestId,
        hasText: !!ocrResult.text,
        textLength: ocrResult.text?.length || 0,
        processingTime: ocrResult.processingTime,
        timestamp: new Date().toISOString()
      });
      
      // Then validate if it's a menu
      console.log(`[MaverickOCRService] Step 2: Validating if text represents a menu:`, {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const validationResult = await this.validateMenu(ocrResult.text);
      
      console.log(`[MaverickOCRService] Combined process completed successfully:`, {
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
      console.error(`[MaverickOCRService] Error in processAndValidateMenu:`, {
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
export const maverickOCRService = new MaverickOCRService();
export type { MaverickOCRResponse, MenuValidationResult };