/**
 * Simple Modal OCR Test Script (JavaScript)
 * 
 * Quick test to verify Modal.com DeepSeek OCR endpoint works
 * Usage: node tests/test-modal-ocr.js
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

// Configuration
const TEST_IMAGE_PATH = 'C:\\Users\\affan\\Downloads\\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg';
const MODAL_ENDPOINT = process.env.MODAL_OCR_ENDPOINT || 'https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/';
const OCR_MODE = 'base';

/**
 * Convert image file to base64
 */
function imageToBase64(imagePath) {
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
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonResponse = JSON.parse(responseData);
            resolve(jsonResponse);
          } catch (e) {
            reject(new Error(`Failed to parse JSON response: ${e.message}`));
          }
        } else {
          console.error('\n❌ HTTP Error Response:');
          console.error(`   Status: ${res.statusCode} ${res.statusMessage}`);
          console.error(`   Headers:`, res.headers);
          console.error(`   Body: ${responseData}`);
          console.error();
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test Modal OCR endpoint
 */
async function testModalOCR() {
  console.log('🚀 Modal.com DeepSeek OCR Test');
  console.log('═'.repeat(80));
  console.log();

  try {
    // Check if image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      throw new Error(`Image file not found: ${TEST_IMAGE_PATH}`);
    }

    // Get image info
    const stats = fs.statSync(TEST_IMAGE_PATH);
    console.log('📸 Image Details:');
    console.log(`   Path: ${TEST_IMAGE_PATH}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log();

    // Convert to base64
    console.log('🔄 Converting image to base64...');
    const startConvert = Date.now();
    const base64Image = imageToBase64(TEST_IMAGE_PATH);
    const convertDuration = Date.now() - startConvert;
    console.log(`   Base64 length: ${base64Image.length} characters`);
    console.log(`   Conversion time: ${convertDuration}ms`);
    console.log();

    // Call OCR endpoint
    console.log('🚀 Calling Modal OCR endpoint...');
    console.log(`   Endpoint: ${MODAL_ENDPOINT}`);
    console.log(`   Mode: ${OCR_MODE}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log();

    const startOCR = Date.now();
    const result = await makeRequest(MODAL_ENDPOINT, {
      image_base64: base64Image,
      prompt: "<image>\n<|grounding|>Convert the document to markdown. ",
      mode: OCR_MODE
    });
    const ocrDuration = Date.now() - startOCR;

    console.log('✅ OCR Processing Successful!');
    console.log();
    console.log('📄 OCR Result:');
    console.log(`   Mode: ${result.mode}`);
    console.log(`   Config:`, JSON.stringify(result.config, null, 2));
    console.log(`   Text length: ${result.text.length} characters`);
    console.log(`   Processing time: ${ocrDuration}ms (${(ocrDuration / 1000).toFixed(2)}s)`);
    console.log();
    console.log('📝 Extracted Text:');
    console.log('─'.repeat(80));
    console.log(result.text);
    console.log('─'.repeat(80));
    console.log();

    // Save result to file
    const outputPath = 'tests/ocr-test-result.txt';
    const outputData = `Modal OCR Test Result
${'='.repeat(80)}

Test Date: ${new Date().toISOString()}
Image: ${TEST_IMAGE_PATH}
Endpoint: ${MODAL_ENDPOINT}
Mode: ${OCR_MODE}
Processing Time: ${ocrDuration}ms

OCR Configuration:
${JSON.stringify(result.config, null, 2)}

Extracted Text:
${'─'.repeat(80)}
${result.text}
${'─'.repeat(80)}
`;
    
    fs.writeFileSync(outputPath, outputData);
    console.log(`💾 Result saved to: ${outputPath}`);
    console.log();

    console.log('🎉 Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test Failed!');
    console.error(`   Error: ${error.message}`);
    console.error();
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
testModalOCR();
