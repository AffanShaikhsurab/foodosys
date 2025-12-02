/**
 * Menu OCR Test Script
 * Tests Modal.com DeepSeek OCR endpoint with menu image
 * 
 * Usage: node test-menu-ocr.js
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

// Configuration
const TEST_IMAGE_PATH = 'C:\\Users\\affan\\Downloads\\Menu_of_Fatto_a_Mano_Pizzeria,_North_Laine_(desserts).jpg';
const MODAL_ENDPOINT = process.env.MODAL_OCR_ENDPOINT || 'https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/';
const OCR_MODE = 'gundam'; // Using 'gundam' mode for better menu OCR (base_size=1024, image_size=640, crop_mode=True)

/**
 * Convert image file to base64
 */
function imageToBase64(imagePath) {
  console.log(`📖 Reading image: ${imagePath}`);
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Make HTTP/HTTPS POST request
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json'
      },
      timeout: 120000 // 2 minutes timeout for GPU processing
    };

    console.log(`\n📡 Making request to: ${url}`);
    console.log(`   Method: POST`);
    console.log(`   Mode: ${data.mode}`);
    console.log(`   Payload size: ${(Buffer.byteLength(postData) / 1024).toFixed(2)} KB`);

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`\n📥 Response received:`);
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Content-Type: ${res.headers['content-type']}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonResponse = JSON.parse(responseData);
            resolve(jsonResponse);
          } catch (e) {
            console.error('\n❌ Failed to parse JSON response');
            console.error(`   Error: ${e.message}`);
            console.error(`   Response: ${responseData.substring(0, 500)}`);
            reject(new Error(`Failed to parse JSON response: ${e.message}`));
          }
        } else {
          console.error('\n❌ HTTP Error Response:');
          console.error(`   Status: ${res.statusCode} ${res.statusMessage}`);
          console.error(`   Headers:`, JSON.stringify(res.headers, null, 2));
          console.error(`   Body: ${responseData.substring(0, 1000)}`);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error('\n❌ Request Error:');
      console.error(`   ${e.message}`);
      reject(e);
    });

    req.on('timeout', () => {
      console.error('\n⏱️  Request Timeout');
      req.destroy();
      reject(new Error('Request timeout after 2 minutes'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test Modal OCR endpoint
 */
async function testMenuOCR() {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║          🍕 Menu OCR Test - DeepSeek OCR on Modal.com              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log();

  const startTime = Date.now();

  try {
    // 1. Validate configuration
    console.log('🔧 Configuration:');
    console.log(`   Endpoint: ${MODAL_ENDPOINT}`);
    console.log(`   Mode: ${OCR_MODE}`);
    console.log(`   Image: ${TEST_IMAGE_PATH}`);
    console.log();

    // 2. Check if image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      throw new Error(`❌ Image file not found: ${TEST_IMAGE_PATH}`);
    }

    // 3. Get image info
    const stats = fs.statSync(TEST_IMAGE_PATH);
    console.log('📸 Image Details:');
    console.log(`   Path: ${TEST_IMAGE_PATH}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Modified: ${stats.mtime.toLocaleString()}`);
    console.log();

    // 4. Convert image to base64
    console.log('⚙️  Processing...');
    const base64Image = imageToBase64(TEST_IMAGE_PATH);
    console.log(`   ✓ Image encoded to base64 (${(base64Image.length / 1024).toFixed(2)} KB)`);

    // 5. Prepare request
    const requestPayload = {
      image_base64: base64Image,
      prompt: "<image>\n<|grounding|>Convert the document to markdown. ",
      mode: OCR_MODE,
      test_compress: false
    };

    // 6. Call Modal endpoint
    console.log('\n🚀 Sending OCR request to Modal...');
    const result = await makeRequest(MODAL_ENDPOINT, requestPayload);

    // 7. Display results
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║                          ✅ SUCCESS                                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`⏱️  Processing Time: ${duration} seconds`);
    console.log();
    
    console.log('📄 OCR Result:');
    console.log('─'.repeat(80));
    console.log(result.text || result);
    console.log('─'.repeat(80));
    console.log();

    if (result.mode) {
      console.log(`📊 Metadata:`);
      console.log(`   Mode: ${result.mode}`);
      if (result.config) {
        console.log(`   Config: ${JSON.stringify(result.config, null, 2)}`);
      }
      console.log();
    }

    // 8. Save results to file
    const outputPath = 'test-menu-ocr-result.json';
    const outputData = {
      timestamp: new Date().toISOString(),
      duration_seconds: parseFloat(duration),
      image_path: TEST_IMAGE_PATH,
      endpoint: MODAL_ENDPOINT,
      mode: OCR_MODE,
      result: result
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);
    console.log();

    console.log('✨ Test completed successfully!');
    console.log();
    
    return 0;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║                          ❌ FAILED                                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`⏱️  Time elapsed: ${duration} seconds`);
    console.log(`❌ Error: ${error.message}`);
    console.log();
    
    if (error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
      console.log();
    }

    console.log('🔍 Troubleshooting:');
    console.log('   1. Check Modal dashboard: https://modal.com/apps');
    console.log('   2. Verify endpoint URL is correct');
    console.log('   3. Ensure Modal deployment is active');
    console.log('   4. Check Modal logs for server errors');
    console.log('   5. Try redeploying: modal deploy deepseek_ocr.py');
    console.log();

    return 1;
  }
}

// Run the test
if (require.main === module) {
  testMenuOCR()
    .then(code => process.exit(code))
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testMenuOCR };
