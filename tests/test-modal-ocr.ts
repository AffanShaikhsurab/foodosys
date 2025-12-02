/**
 * Test Suite for Modal.com DeepSeek OCR Endpoint
 * 
 * This test verifies that the Modal-hosted DeepSeek OCR endpoint
 * correctly processes images and returns OCR results.
 */

import * as fs from 'fs';
import * as path from 'path';

interface OCRResponse {
  text: string;
  mode: string;
  config: {
    base_size: number;
    image_size: number;
    crop_mode: boolean;
  };
}

interface TestResult {
  success: boolean;
  error?: string;
  response?: OCRResponse;
  duration?: number;
  metadata?: {
    endpoint: string;
    imagePath: string;
    imageSize: number;
    timestamp: string;
  };
}

/**
 * Convert local image file to base64
 */
function imageToBase64(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Test the Modal OCR endpoint with a local image
 */
async function testModalOCR(
  imagePath: string,
  endpointUrl?: string,
  mode: string = 'base'
): Promise<TestResult> {
  const startTime = Date.now();
  const endpoint = endpointUrl || process.env.MODAL_OCR_ENDPOINT || 'https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/';

  try {
    // Validate image exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Get image stats
    const stats = fs.statSync(imagePath);
    console.log(`📸 Image Details:`);
    console.log(`   Path: ${imagePath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log();

    // Convert image to base64
    console.log('🔄 Converting image to base64...');
    const base64Image = imageToBase64(imagePath);
    console.log(`   Base64 length: ${base64Image.length} characters`);
    console.log();

    // Call Modal OCR endpoint
    console.log('🚀 Calling Modal OCR endpoint...');
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Mode: ${mode}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: base64Image,
        prompt: "<image>\n<|grounding|>Convert the document to markdown. ",
        mode: mode
      })
    });

    const duration = Date.now() - startTime;

    console.log('📡 Response received:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Duration: ${duration}ms`);
    console.log();

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCR API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: OCRResponse = await response.json();

    console.log('✅ OCR Processing Successful!');
    console.log();
    console.log('📄 OCR Result:');
    console.log(`   Mode: ${result.mode}`);
    console.log(`   Config:`, result.config);
    console.log(`   Text length: ${result.text.length} characters`);
    console.log();
    console.log('📝 Extracted Text:');
    console.log('─'.repeat(80));
    console.log(result.text);
    console.log('─'.repeat(80));
    console.log();

    return {
      success: true,
      response: result,
      duration,
      metadata: {
        endpoint,
        imagePath,
        imageSize: stats.size,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ OCR Test Failed!');
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   Duration: ${duration}ms`);
    console.error();

    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
      console.error();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration
    };
  }
}

/**
 * Run multiple tests with different modes
 */
async function runComprehensiveTests(imagePath: string): Promise<void> {
  console.log('🧪 Starting Comprehensive Modal OCR Tests');
  console.log('═'.repeat(80));
  console.log();

  const modes = ['tiny', 'base', 'large'];
  const results: { mode: string; result: TestResult }[] = [];

  for (const mode of modes) {
    console.log(`\n🔬 Testing with mode: ${mode.toUpperCase()}`);
    console.log('─'.repeat(80));
    const result = await testModalOCR(imagePath, undefined, mode);
    results.push({ mode, result });
    
    // Wait a bit between requests to avoid overwhelming the endpoint
    if (mode !== modes[modes.length - 1]) {
      console.log('⏳ Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(80));
  results.forEach(({ mode, result }) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? `${result.duration}ms` : 'N/A';
    const textLength = result.response?.text.length || 0;
    console.log(`${status} | Mode: ${mode.padEnd(6)} | Duration: ${duration.padEnd(8)} | Text: ${textLength} chars`);
  });
  console.log();

  const successCount = results.filter(r => r.result.success).length;
  const totalCount = results.length;
  console.log(`\n🎯 Overall: ${successCount}/${totalCount} tests passed`);
  console.log();
}

/**
 * Main test runner
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Default test image path
  const defaultImagePath = 'C:\\Users\\affan\\Downloads\\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg';
  
  // Parse command line arguments
  let imagePath = defaultImagePath;
  let mode = 'base';
  let comprehensive = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--image' && args[i + 1]) {
      imagePath = args[i + 1];
      i++;
    } else if (args[i] === '--mode' && args[i + 1]) {
      mode = args[i + 1];
      i++;
    } else if (args[i] === '--comprehensive' || args[i] === '--all') {
      comprehensive = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Modal OCR Test Suite\n');
      console.log('Usage: tsx test-modal-ocr.ts [options]\n');
      console.log('Options:');
      console.log('  --image <path>      Path to test image (default: test image in Downloads)');
      console.log('  --mode <mode>       OCR mode: tiny, small, base, large, gundam (default: base)');
      console.log('  --comprehensive     Run tests with multiple modes');
      console.log('  --help, -h          Show this help message');
      console.log('\nEnvironment Variables:');
      console.log('  MODAL_OCR_ENDPOINT  Modal OCR endpoint URL (optional)');
      console.log('\nExamples:');
      console.log('  tsx test-modal-ocr.ts');
      console.log('  tsx test-modal-ocr.ts --image ./menu.jpg --mode base');
      console.log('  tsx test-modal-ocr.ts --comprehensive');
      return;
    }
  }

  console.log('🚀 Modal.com DeepSeek OCR Test');
  console.log('═'.repeat(80));
  console.log();

  // Check if endpoint is configured
  const endpoint = process.env.MODAL_OCR_ENDPOINT || 'https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/';
  console.log('⚙️  Configuration:');
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Image: ${imagePath}`);
  console.log(`   Mode: ${comprehensive ? 'All modes' : mode}`);
  console.log();

  if (comprehensive) {
    await runComprehensiveTests(imagePath);
  } else {
    await testModalOCR(imagePath, undefined, mode);
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export functions for use in other tests
export { testModalOCR, runComprehensiveTests, imageToBase64 };
