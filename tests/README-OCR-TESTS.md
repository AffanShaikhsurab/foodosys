# Modal OCR Tests

This directory contains tests for the Modal.com DeepSeek OCR endpoint integration.

## Test Files

### 1. `test-modal-ocr.js` (Recommended for Quick Testing)
Simple JavaScript test that requires no additional dependencies.

**Usage:**
```bash
node tests/test-modal-ocr.js
```

**Features:**
- ✅ No additional dependencies required
- ✅ Tests OCR endpoint with local image
- ✅ Displays detailed results
- ✅ Saves results to `tests/ocr-test-result.txt`

### 2. `test-modal-ocr.ts` (Advanced TypeScript Testing)
Comprehensive TypeScript test suite with multiple test modes.

**Usage:**
```bash
# Single test with default image
npx tsx tests/test-modal-ocr.ts

# Test with custom image
npx tsx tests/test-modal-ocr.ts --image ./path/to/image.jpg

# Test with specific mode
npx tsx tests/test-modal-ocr.ts --mode large

# Run comprehensive tests (all modes)
npx tsx tests/test-modal-ocr.ts --comprehensive

# Show help
npx tsx tests/test-modal-ocr.ts --help
```

**Available Modes:**
- `tiny` - Fast, lower quality (512px)
- `small` - Balanced (640px)
- `base` - Recommended (1024px) ⭐
- `large` - High quality (1280px)
- `gundam` - Special crop mode (1024px base, 640px image)

## Default Test Image

Both tests use the following default image:
```
C:\Users\affan\Downloads\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg
```

## Environment Variables

### Optional Configuration

```bash
# Set custom Modal OCR endpoint (optional)
MODAL_OCR_ENDPOINT=https://your-modal-endpoint.modal.run/
```

The tests will use the hardcoded default endpoint if this is not set:
```
https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/
```

## What the Tests Verify

1. ✅ Image file exists and can be read
2. ✅ Image converts to base64 successfully
3. ✅ Modal OCR endpoint is reachable
4. ✅ Request/response format is correct
5. ✅ OCR processing completes successfully
6. ✅ Returned text is valid markdown
7. ✅ Processing time is reasonable

## Expected Output

### Success Example:
```
🚀 Modal.com DeepSeek OCR Test
═══════════════════════════════════════════════════════

📸 Image Details:
   Path: C:\Users\affan\Downloads\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg
   Size: 245.67 KB

🔄 Converting image to base64...
   Base64 length: 335,624 characters
   Conversion time: 45ms

🚀 Calling Modal OCR endpoint...
   Endpoint: https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/
   Mode: base
   Timestamp: 2025-12-02T10:30:00.000Z

✅ OCR Processing Successful!

📄 OCR Result:
   Mode: base
   Config: { base_size: 1024, image_size: 1024, crop_mode: false }
   Text length: 1,234 characters
   Processing time: 3456ms (3.46s)

📝 Extracted Text:
────────────────────────────────────────────────────────
[Extracted markdown text appears here...]
────────────────────────────────────────────────────────

💾 Result saved to: tests/ocr-test-result.txt

🎉 Test completed successfully!
```

## Troubleshooting

### Error: Image file not found
- Verify the image path is correct
- Use absolute paths or correct relative paths
- Check file permissions

### Error: Connection timeout
- Verify internet connection
- Check if Modal endpoint is running
- Try increasing timeout in code

### Error: HTTP 500 from endpoint
- Check Modal logs for the function
- Verify the image format is supported (JPEG, PNG)
- Try with a smaller image or different mode

### Error: Invalid JSON response
- Check Modal function is deployed correctly
- Verify endpoint URL is correct
- Check if there are any CORS or proxy issues

## Running Tests in CI/CD

For automated testing, you can use the JavaScript version:

```bash
# In package.json scripts
"test:ocr": "node tests/test-modal-ocr.js"

# Run with npm
npm run test:ocr
```

## Integration with Main Application

These tests verify the same endpoint used in production:
- `src/lib/modal-ocr.ts` - Main OCR service
- `src/app/api/upload/route.ts` - Menu upload API

The test results should match production behavior.
