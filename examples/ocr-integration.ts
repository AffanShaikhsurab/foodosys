/*
Example: Integrate DeepSeek OCR into Foodosys menu upload flow

This example shows how to use Modal - deployed DeepSeek OCR
to process uploaded menu images and extract structured data.
*/

// Add this to your .env.local file:
// MODAL_OCR_ENDPOINT = https://yourname--deepseek-ocr-ocr-endpoint.modal.run

interface OCRResult {
    text: string;
    mode: string;
    config: {
        base_size: number;
        image_size: number;
        crop_mode: boolean;
    };
}

interface MenuItem {
    name: string;
    price?: string;
    description?: string;
    category?: string;
}

/**
 * Process a menu image using DeepSeek OCR on Modal
 */
export async function processMenuOCR(imageUrl: string): Promise<OCRResult> {
    const endpoint = process.env.MODAL_OCR_ENDPOINT;

    if (!endpoint) {
        throw new Error('MODAL_OCR_ENDPOINT not configured in environment variables');
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_url: imageUrl,
                mode: 'base', // Good quality for menu images
                prompt: '<image>\n<|grounding|>Convert the document to markdown. ',
            }),
        });

        if (!response.ok) {
            throw new Error(`OCR request failed: ${response.statusText}`);
        }

        const result: OCRResult = await response.json();
        return result;
    } catch (error) {
        console.error('Error processing OCR:', error);
        throw error;
    }
}

/**
 * Parse menu items from markdown OCR output
 * This is a simple parser - you may need to customize based on your menu formats
 */
export function parseMenuFromMarkdown(markdown: string): MenuItem[] {
    const items: MenuItem[] = [];
    const lines = markdown.split('\n');

    let currentCategory = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect category headers (## Category Name)
        if (line.startsWith('##')) {
            currentCategory = line.replace(/^#+\s*/, '').trim();
            continue;
        }

        // Detect menu items (- Item Name... $Price)
        if (line.startsWith('-') || line.startsWith('•')) {
            const itemText = line.replace(/^[-•]\s*/, '');

            // Try to extract price (look for $X.XX or similar patterns)
            const priceMatch = itemText.match(/\$?(\d+\.?\d*)/);
            const price = priceMatch ? `$${priceMatch[1]}` : undefined;

            // The item name is everything before the price
            const name = price
                ? itemText.substring(0, itemText.indexOf(priceMatch[0])).trim()
                : itemText.trim();

            // Look ahead for description (next line that's not empty and doesn't start with - or #)
            let description = '';
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine && !nextLine.startsWith('-') && !nextLine.startsWith('•')
                    && !nextLine.startsWith('#')) {
                    description = nextLine;
                    i++; // Skip the description line in next iteration
                }
            }

            items.push({
                name,
                price,
                description: description || undefined,
                category: currentCategory || undefined,
            });
        }
    }

    return items;
}

/**
 * Complete workflow: Upload image, run OCR, extract menu items
 */
export async function extractMenuItems(imageUrl: string): Promise<MenuItem[]> {
    console.log('Starting OCR processing for menu image...');

    // Step 1: Run OCR
    const ocrResult = await processMenuOCR(imageUrl);
    console.log('OCR completed, parsing menu items...');

    // Step 2: Parse markdown to extract structured menu data
    const menuItems = parseMenuFromMarkdown(ocrResult.text);
    console.log(`Extracted ${menuItems.length} menu items`);

    return menuItems;
}

/**
 * Example usage in a Next.js API route or server action
 */
export async function handleMenuUpload(formData: FormData) {
    const file = formData.get('menuImage') as File;

    // 1. Upload file to your storage (e.g., Supabase Storage)
    // const imageUrl = await uploadToStorage(file);
    const imageUrl = 'YOUR_UPLOADED_IMAGE_URL'; // Replace with actual upload

    try {
        // 2. Extract menu items using OCR
        const menuItems = await extractMenuItems(imageUrl);

        // 3. Save to database
        // await saveMenuItemsToDatabase(menuItems);

        return {
            success: true,
            itemsCount: menuItems.length,
            items: menuItems,
        };
    } catch (error) {
        console.error('Menu processing error:', error);
        return {
            success: false,
            error: 'Failed to process menu image',
        };
    }
}

// Example of what the parsed data looks like:
/*
[
  {
    name: "Caesar Salad",
    price: "$12.99",
    description: "Fresh romaine lettuce with parmesan and croutons",
    category: "Appetizers"
  },
  {
    name: "Margherita Pizza",
    price: "$16.99",
    description: "Classic pizza with fresh mozzarella and basil",
    category: "Main Course"
  }
]
*/
