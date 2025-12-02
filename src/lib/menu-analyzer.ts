import Groq from 'groq-sdk'
import { validateMenuStructure, MenuStructure } from './menu-validation'

// Initialize Groq API
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export class MenuAnalyzer {
  /**
   * Analyze menu from image using Groq model
   */
  async analyzeMenuFromImage(base64Image: string): Promise<MenuStructure> {
    try {
      const prompt = `
        Analyze this menu image and extract the menu items in a structured JSON format.
        
        Return a JSON object with the following structure:
        {
          "sections": [
            {
              "name": "Section Name (e.g., Breakfast, Lunch, Dinner, Snacks)",
              "items": [
                {
                  "name": "Item Name",
                  "price": "Price (e.g., ₹50, $10.99)",
                  "description": "Optional description if available"
                }
              ]
            }
          ]
        }
        
        Important guidelines:
        1. Group items into logical sections based on the menu layout
        2. Extract item names exactly as they appear
        3. Extract prices with currency symbols
        4. Include descriptions only if they are clearly separate from the item name
        5. If no clear sections exist, create a single "General" section
        6. Return valid JSON only, no additional text
      `

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes menu images and extracts menu items in structured JSON format. Always respond with valid JSON only."
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
                  url: base64Image
                }
              }
            ]
          }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.5,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      });

      const text = completion.choices[0]?.message?.content || '';
      
      // Clean and parse the JSON response
      const cleanedText = this.cleanJsonResponse(text)
      const menuData = JSON.parse(cleanedText)
      
      // Validate and fix the structure
      return validateMenuStructure(menuData)
    } catch (error) {
      console.error('Error analyzing menu from image:', error)
      throw new Error(`Failed to analyze menu from image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Analyze menu from OCR text using Groq model
   */
  async analyzeMenuFromText(ocrText: string): Promise<MenuStructure> {
    try {
      const prompt = `
        Analyze this menu text and extract the menu items in a structured JSON format.
        
        Text to analyze:
        ${ocrText}
        
        Return a JSON object with the following structure:
        {
          "sections": [
            {
              "name": "Section Name (e.g., Breakfast, Lunch, Dinner, Snacks)",
              "items": [
                {
                  "name": "Item Name",
                  "price": "Price (e.g., ₹50, $10.99)",
                  "description": "Optional description if available"
                }
              ]
            }
          ]
        }
        
        Important guidelines:
        1. Group items into logical sections based on the menu layout
        2. Extract item names exactly as they appear
        3. Extract prices with currency symbols
        4. Include descriptions only if they are clearly separate from the item name
        5. If no clear sections exist, create a single "General" section
        6. Return valid JSON only, no additional text
      `

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes menu text and extracts menu items in structured JSON format. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.5,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      });

      const text = completion.choices[0]?.message?.content || '';
      
      // Clean and parse the JSON response
      const cleanedText = this.cleanJsonResponse(text)
      const menuData = JSON.parse(cleanedText)
      
      // Validate and fix the structure
      return validateMenuStructure(menuData)
    } catch (error) {
      console.error('Error analyzing menu from text:', error)
      throw new Error(`Failed to analyze menu from text: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clean the JSON response from Groq to remove any extra text
   */
  private cleanJsonResponse(text: string): string {
    // Remove any markdown code blocks
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    // Find the first { and the last } to extract just the JSON
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }
    
    return cleaned.trim()
  }
}

// Export a singleton instance
export const menuAnalyzer = new MenuAnalyzer()