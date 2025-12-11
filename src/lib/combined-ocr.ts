/**
 * Combined OCR Service that uses both OCR.space and Maverick model
 * Then passes both results to GPT-4o for precision comparison and final output
 */

import { ocrSpaceV2Service, OcrSpaceV2Response } from './ocr-space-v2';
import { maverickOCRService, MaverickOCRResponse } from './maverick-ocr';

interface CombinedOCRResult {
  ocrSpaceResult?: OcrSpaceV2Response;
  maverickResult?: MaverickOCRResponse;
  finalText: string;
  confidence: number;
  processingDetails: {
    ocrSpaceTime?: number;
    maverickTime?: number;
    comparisonTime?: number;
    totalTime: number;
  };
}

interface MenuValidationResult {
  isMenu: boolean;
  confidence: number;
  reason?: string;
}

class CombinedOCRService {
  /**
   * Process image using both OCR services and get the best result
   */
  async processImageWithBothOCR(base64Image: string): Promise<CombinedOCRResult> {
    const requestId = Math.random().toString(36).substring(7);
    const totalStartTime = Date.now();
    
    console.log(`[CombinedOCRService] Starting dual OCR processing:`, {
      requestId,
      base64Length: base64Image.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Process with both OCR services in parallel
      console.log(`[CombinedOCRService] Step 1: Running OCR.space and Maverick OCR in parallel:`, {
        requestId,
        timestamp: new Date().toISOString()
      });

      const ocrSpaceStartTime = Date.now();
      const maverickStartTime = Date.now();

      const [ocrSpacePromise, maverickPromise] = await Promise.allSettled([
        ocrSpaceV2Service.processImageFromBase64(base64Image),
        maverickOCRService.processImage(base64Image)
      ]);

      const ocrSpaceTime = Date.now() - ocrSpaceStartTime;
      const maverickTime = Date.now() - maverickStartTime;

      let ocrSpaceResult: OcrSpaceV2Response | undefined;
      let maverickResult: MaverickOCRResponse | undefined;
      let ocrSpaceText = '';
      let maverickText = '';

      // Extract results from promises
      if (ocrSpacePromise.status === 'fulfilled') {
        ocrSpaceResult = ocrSpacePromise.value;
        ocrSpaceText = ocrSpaceResult.ParsedResults?.[0]?.ParsedText || '';
        console.log(`[CombinedOCRService] OCR.space processing successful:`, {
          requestId,
          textLength: ocrSpaceText.length,
          processingTime: ocrSpaceTime,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error(`[CombinedOCRService] OCR.space processing failed:`, {
          requestId,
          error: ocrSpacePromise.reason,
          timestamp: new Date().toISOString()
        });
      }

      if (maverickPromise.status === 'fulfilled') {
        maverickResult = maverickPromise.value;
        maverickText = maverickResult.text || '';
        console.log(`[CombinedOCRService] Maverick OCR processing successful:`, {
          requestId,
          textLength: maverickText.length,
          processingTime: maverickTime,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error(`[CombinedOCRService] Maverick OCR processing failed:`, {
          requestId,
          error: maverickPromise.reason,
          timestamp: new Date().toISOString()
        });
      }

      // If both failed, throw an error
      if (!ocrSpaceText && !maverickText) {
        throw new Error('Both OCR services failed to extract text');
      }

      // Compare and get the best result using GPT
      console.log(`[CombinedOCRService] Step 2: Comparing OCR results with GPT:`, {
        requestId,
        hasOcrSpace: !!ocrSpaceText,
        hasMaverick: !!maverickText,
        timestamp: new Date().toISOString()
      });

      const comparisonStartTime = Date.now();
      const { finalText, confidence } = await this.compareOCRResults(
        ocrSpaceText,
        maverickText,
        requestId
      );
      const comparisonTime = Date.now() - comparisonStartTime;
      const totalTime = Date.now() - totalStartTime;

      console.log(`[CombinedOCRService] Dual OCR processing completed:`, {
        requestId,
        finalTextLength: finalText.length,
        confidence,
        processingDetails: {
          ocrSpaceTime,
          maverickTime,
          comparisonTime,
          totalTime
        },
        timestamp: new Date().toISOString()
      });

      return {
        ocrSpaceResult,
        maverickResult,
        finalText,
        confidence,
        processingDetails: {
          ocrSpaceTime,
          maverickTime,
          comparisonTime,
          totalTime
        }
      };
    } catch (error) {
      console.error(`[CombinedOCRService] Error in dual OCR processing:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Compare OCR results using GPT-4o and return the best one
   */
  private async compareOCRResults(
    ocrSpaceText: string,
    maverickText: string,
    requestId: string
  ): Promise<{ finalText: string; confidence: number }> {
    console.log(`[CombinedOCRService] Starting OCR result comparison:`, {
      requestId,
      ocrSpaceLength: ocrSpaceText.length,
      maverickLength: maverickText.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Import Groq dynamically to avoid SSR issues
      const { default: Groq } = await import('groq-sdk');
      
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
      }

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const prompt = `
        You are an expert text comparison system specializing in OCR results for restaurant menus.
        
        Compare the following two OCR results and determine which one is more accurate and complete:
        
        OCR.space Result:
        """
        ${ocrSpaceText || 'No text extracted'}
        """
        
        Maverick Model Result:
        """
        ${maverickText || 'No text extracted'}
        """
        
        Instructions:
        1. Evaluate both results for accuracy, completeness, and readability
        2. Look for:
           - Complete menu items with prices
           - Clear section headers
           - Proper formatting and structure
           - Minimal OCR errors or garbled text
           - Inclusion of all visible text from the image
        3. If one result is clearly better, use that one
        4. If both have strengths, create a hybrid result combining the best parts
        5. If both are poor, choose the less problematic one
        6. Ensure the final result maintains proper menu structure
        
        Return a JSON object with the following structure:
        {
          "finalText": "The best OCR result (cleaned and formatted)",
          "confidence": 0.0-1.0,
          "reasoning": "Brief explanation of why this result was chosen"
        }
        
        Return valid JSON only, no additional text.
      `;

      console.log(`[CombinedOCRService] Sending comparison request to GPT:`, {
        requestId,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert OCR comparison system. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.3, // Lower temperature for more consistent comparison
        max_tokens: 4096,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content || '';
      
      console.log(`[CombinedOCRService] Received comparison response:`, {
        requestId,
        responseLength: response.length,
        responsePreview: response.substring(0, 200),
        timestamp: new Date().toISOString()
      });
      
      // Clean and parse JSON response
      const cleanedResponse = this.cleanJsonResponse(response);
      
      console.log(`[CombinedOCRService] Cleaned JSON response:`, {
        requestId,
        cleanedResponse,
        timestamp: new Date().toISOString()
      });
      
      const comparisonResult = JSON.parse(cleanedResponse);
      
      console.log(`[CombinedOCRService] OCR comparison completed:`, {
        requestId,
        finalTextLength: comparisonResult.finalText?.length || 0,
        confidence: comparisonResult.confidence,
        reasoning: comparisonResult.reasoning,
        timestamp: new Date().toISOString()
      });
      
      return {
        finalText: comparisonResult.finalText || '',
        confidence: comparisonResult.confidence || 0
      };
    } catch (error) {
      console.error(`[CombinedOCRService] Error comparing OCR results:`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      // Fallback: return the longer text with default confidence
      const fallbackText = ocrSpaceText.length > maverickText.length ? ocrSpaceText : maverickText;
      return {
        finalText: fallbackText,
        confidence: 0.5
      };
    }
  }

  /**
   * Validate if the final OCR text represents a menu using Groq
   */
  async validateMenu(finalText: string): Promise<MenuValidationResult> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[CombinedOCRService] Starting menu validation:`, {
      requestId,
      textLength: finalText.length,
      textPreview: finalText.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    try {
      // Import Groq dynamically to avoid SSR issues
      const { default: Groq } = await import('groq-sdk');
      
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
      }

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const prompt = `
        Analyze the following text and determine if it represents a restaurant menu.
        
        Text to analyze:
        """
        ${finalText}
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

      console.log(`[CombinedOCRService] Sending validation request to GPT:`, {
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

      const response = completion.choices[0]?.message?.content || '';
      
      console.log(`[CombinedOCRService] Received validation response:`, {
        requestId,
        responseLength: response.length,
        responsePreview: response.substring(0, 200),
        timestamp: new Date().toISOString()
      });
      
      // Clean and parse JSON response
      const cleanedResponse = this.cleanJsonResponse(response);
      
      console.log(`[CombinedOCRService] Cleaned JSON response:`, {
        requestId,
        cleanedResponse,
        timestamp: new Date().toISOString()
      });
      
      const validationResult = JSON.parse(cleanedResponse);
      
      console.log(`[CombinedOCRService] Menu validation completed:`, {
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
      console.error(`[CombinedOCRService] Error validating menu:`, {
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
   * Process image with both OCR services and validate if it's a menu
   */
  async processAndValidateMenu(base64Image: string): Promise<{ 
    combinedResult: CombinedOCRResult;
    validationResult: MenuValidationResult;
  }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[CombinedOCRService] Starting complete OCR and validation process:`, {
      requestId,
      base64Length: base64Image.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Step 1: Process with both OCR services
      console.log(`[CombinedOCRService] Step 1: Processing with dual OCR:`, {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const combinedResult = await this.processImageWithBothOCR(base64Image);
      
      console.log(`[CombinedOCRService] Step 1 completed: Dual OCR successful:`, {
        requestId,
        finalTextLength: combinedResult.finalText.length,
        confidence: combinedResult.confidence,
        timestamp: new Date().toISOString()
      });
      
      // Step 2: Validate if it's a menu
      console.log(`[CombinedOCRService] Step 2: Validating if text represents a menu:`, {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const validationResult = await this.validateMenu(combinedResult.finalText);
      
      console.log(`[CombinedOCRService] Complete process finished successfully:`, {
        requestId,
        isMenu: validationResult.isMenu,
        confidence: validationResult.confidence,
        reason: validationResult.reason,
        finalTextLength: combinedResult.finalText.length,
        processingDetails: combinedResult.processingDetails,
        timestamp: new Date().toISOString()
      });
      
      return {
        combinedResult,
        validationResult
      };
    } catch (error) {
      console.error(`[CombinedOCRService] Error in complete process:`, {
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
export const combinedOCRService = new CombinedOCRService();
export type { CombinedOCRResult, MenuValidationResult };