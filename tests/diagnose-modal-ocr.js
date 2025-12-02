/**
 * Modal OCR Endpoint Diagnostic Tool
 * 
 * Tests connectivity and configuration of the Modal OCR endpoint
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

const MODAL_ENDPOINT = process.env.MODAL_OCR_ENDPOINT || 'https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/';
const TEST_IMAGE_PATH = 'C:\\Users\\affan\\Downloads\\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg';

console.log('🔍 Modal OCR Endpoint Diagnostics');
console.log('═'.repeat(80));
console.log();

// Test 1: Check endpoint URL format
console.log('✓ Test 1: Endpoint URL Configuration');
console.log(`  Endpoint: ${MODAL_ENDPOINT}`);
try {
  const url = new URL(MODAL_ENDPOINT);
  console.log(`  Protocol: ${url.protocol}`);
  console.log(`  Host: ${url.hostname}`);
  console.log(`  Port: ${url.port || (url.protocol === 'https:' ? '443' : '80')}`);
  console.log(`  Path: ${url.pathname}`);
  console.log('  ✅ URL is valid\n');
} catch (e) {
  console.log(`  ❌ Invalid URL: ${e.message}\n`);
  process.exit(1);
}

// Test 2: Check test image
console.log('✓ Test 2: Test Image File');
console.log(`  Path: ${TEST_IMAGE_PATH}`);
if (fs.existsSync(TEST_IMAGE_PATH)) {
  const stats = fs.statSync(TEST_IMAGE_PATH);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`  ✅ Image file exists\n`);
} else {
  console.log(`  ❌ Image file not found\n`);
  process.exit(1);
}

// Test 3: Test with minimal payload
console.log('✓ Test 3: Endpoint Connectivity with Minimal Payload');
console.log('  Sending minimal test request...\n');

const urlObj = new URL(MODAL_ENDPOINT);
const client = urlObj.protocol === 'https:' ? https : http;

// Create a tiny test image (1x1 red pixel PNG in base64)
const tinyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

const testData = JSON.stringify({
  image_base64: tinyImage,
  prompt: "<image>\n<|grounding|>Convert the document to markdown. ",
  mode: "tiny"  // Use smallest mode for quick test
});

const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
  path: urlObj.pathname + urlObj.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  },
  timeout: 60000  // 60 second timeout
};

const startTime = Date.now();

const req = client.request(options, (res) => {
  let responseData = '';
  
  console.log(`  Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`  Response Headers:`, res.headers);
  console.log();

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const duration = Date.now() - startTime;
    console.log(`  Response Time: ${duration}ms`);
    console.log(`  Response Body Length: ${responseData.length} bytes`);
    console.log();
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('  ✅ Endpoint is reachable and responding\n');
      
      try {
        const json = JSON.parse(responseData);
        console.log('✓ Test 4: Response Format');
        console.log('  ✅ Response is valid JSON');
        console.log('  Response structure:', Object.keys(json));
        if (json.text !== undefined) {
          console.log('  ✅ Has "text" field');
        }
        if (json.mode !== undefined) {
          console.log('  ✅ Has "mode" field');
        }
        if (json.config !== undefined) {
          console.log('  ✅ Has "config" field');
        }
        console.log();
        console.log('📄 Sample Response:');
        console.log(JSON.stringify(json, null, 2).substring(0, 500));
        console.log();
        console.log('🎉 All diagnostic tests passed! The endpoint is working correctly.');
      } catch (e) {
        console.log('  ⚠️  Response is not JSON:', responseData.substring(0, 200));
      }
    } else {
      console.log('  ❌ Endpoint returned error status\n');
      console.log('  Response Body:');
      console.log('  ─'.repeat(40));
      console.log(' ', responseData.substring(0, 1000));
      console.log('  ─'.repeat(40));
      console.log();
      
      // Provide troubleshooting tips
      console.log('🔧 Troubleshooting Tips:');
      console.log('  1. Verify the Modal function is deployed and running');
      console.log('  2. Check Modal logs: modal logs deepseek-ocr');
      console.log('  3. Verify the endpoint URL is correct');
      console.log('  4. Try redeploying: modal deploy deepseek_ocr.py');
      console.log('  5. Check if the Modal GPU quota is available');
    }
  });
});

req.on('error', (e) => {
  console.log(`  ❌ Connection error: ${e.message}\n`);
  console.log('🔧 Troubleshooting Tips:');
  console.log('  1. Check your internet connection');
  console.log('  2. Verify the endpoint URL is correct');
  console.log('  3. Check if Modal.com is accessible');
  console.log('  4. Try: curl ' + MODAL_ENDPOINT);
});

req.on('timeout', () => {
  console.log('  ❌ Request timed out after 60 seconds\n');
  console.log('🔧 This could indicate:');
  console.log('  1. The Modal function is cold-starting (first request can be slow)');
  console.log('  2. The GPU is not available');
  console.log('  3. Network connectivity issues');
  req.destroy();
});

req.write(testData);
req.end();
