# OCR Processing - Complete Flow & Debugging Guide

## Overview

The OCR (Optical Character Recognition) system processes menu images to extract text. Here's the complete flow with debugging information.

---

## 1. OCR Processing Flow

### Stage 1: Upload & Storage (In `/api/upload` route)
```
[User uploads image]
    ↓
[File validation - check size, type, format]
    ↓
[Look up restaurant by slug]
    ↓
[Create buffer from file]
    ↓
[Upload to Supabase Storage: menus/{slug}/{timestamp}-{filename}.jpg]
    ↓
[Create menu_images database record with status: 'ocr_pending']
    ↓
[Stage 2 - OCR Processing]
```

### Stage 2: OCR Processing (In `/lib/ocr.ts`)
```
[Convert image to base64]
    ↓
[Call OCR.Space API: POST https://api.ocr.space/Parse/Image]
    ↓
[API processes image and extracts text]
    ↓
[API returns ParsedText and metadata]
    ↓
[Save OCR results to ocr_results table]
    ↓
[Update menu_images status: 'ocr_done' or 'ocr_pending']
```

### Stage 3: Data Retrieval (In `/api/restaurants/[slug]/menus`)
```
[Client requests: GET /api/restaurants/{slug}/menus]
    ↓
[Look up restaurant by slug]
    ↓
[Query menu_images WHERE restaurant_id = X]
    ↓
[Return menu data with ocr_results if available]
```

---

## 2. OCR Service Details

### Location: `src/lib/ocr.ts`

**OCR.Space API Configuration:**
- **Endpoint:** `https://api.ocr.space/Parse/Image`
- **Method:** POST
- **API Key:** `${OCRSPACE_API_KEY}` (default: "helloworld" if not set)
- **OCR Engine:** 3 (Tesseract 4)
- **Language:** English (eng)
- **Format:** URL-encoded form data

**Two Processing Methods:**

#### Method 1: Parse from URL (Fast)
```typescript
ocrService.parseImageFromUrl(imageUrl, {
  language: 'eng',
  OCREngine: 3,
  isOverlayRequired: true
})
```
- **Pros:** Faster, cleaner API call
- **Cons:** Public URL required, needs storage to be public
- **Current Status:** Available but not used (uses base64 instead)

#### Method 2: Parse from Base64 (Reliable)
```typescript
ocrService.parseImageFromBase64(base64Image, {
  language: 'eng',
  OCREngine: 3,
  isOverlayRequired: true
})
```
- **Pros:** Works with any image data, doesn't require public URL
- **Cons:** Larger payload
- **Current Status:** ✅ ACTIVELY USED

---

## 3. Response Structure

### Success Response from OCR.Space:
```json
{
  "IsErroredOnProcessing": false,
  "ErrorMessage": null,
  "ErrorMessages": null,
  "ParsedResults": [
    {
      "TextOverlay": {
        "Lines": [
          {
            "LineText": "Masala Dosa",
            "Words": [...],
            "MaxHeight": 24,
            "MinTop": 100
          }
        ]
      },
      "ParsedText": "Masala Dosa - ₹45\nIdli Vada Set - ₹30\nVeg Pulao - ₹40",
      "ErrorMessage": ""
    }
  ],
  "ProcessingTimeInMilliseconds": 3500
}
```

### Error Response from OCR.Space:
```json
{
  "IsErroredOnProcessing": true,
  "ErrorMessage": ["Error: Image processing failed"],
  "ErrorMessages": ["Connection timeout", "Invalid API key"],
  "ParsedResults": null
}
```

---

## 4. Debug Logging Points

### A. Upload Route Logging
**File:** `src/app/api/upload/route.ts`

#### Log Point 1: OCR API Key Check
```
[Upload API] OCR API Key check: { 
  hasOcrKey: true/false,
  ocrKeyValue: "K8822328...",
  requestId: "abc123"
}
```
✅ **Purpose:** Verify API key is configured
⚠️ **Issue:** If `hasOcrKey: false`, OCR will fail

#### Log Point 2: File Validation
```
[Upload API] File validation: { 
  hasFile: true,
  fileName: "menu.jpg",
  fileSize: 245000,
  restaurantSlug: "magna",
  requestId: "abc123"
}
```
✅ **Purpose:** Confirm file received correctly

#### Log Point 3: Restaurant Lookup
```
[Upload API] Restaurant lookup: { 
  restaurantError: null,
  restaurantFound: true,
  slug: "magna",
  requestId: "abc123"
}
```
❌ **Error:** If `restaurantFound: false`, check restaurant slug

#### Log Point 4: Storage Upload
```
[Upload API] Storage upload response details: { 
  hasError: false,
  uploadError: null,
  uploadDataPath: "menus/magna/2025-11-29T14-06-10Z-menu.jpg",
  uploadDataFullPath: "menus/magna/2025-11-29T14-06-10Z-menu.jpg",
  requestId: "abc123"
}
```
❌ **Error:** If `hasError: true`, check:
- File size limits
- Storage permissions
- Network connectivity

#### Log Point 5: Signed URL Creation
```
[Upload API] Signed URL creation response: { 
  signedURLError: null,
  hasSignedUrl: true,
  requestId: "abc123"
}
```
❌ **Error:** If `hasSignedUrl: false`, storage access is limited

#### Log Point 6: Menu Image DB Record
```
[Upload API] Menu image record insertion response: { 
  hasError: false,
  menuImageError: null,
  menuImageId: "5187e16b-73a6-449c-b949-c006d31a6226",
  menuImageRestaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080",
  menuImageStoragePath: "menus/magna/2025-11-29T14-06-10Z-menu.jpg",
  requestId: "abc123"
}
```
✅ **Purpose:** Database record created
❌ **Error:** If `hasError: true`, check:
- Database connection
- Foreign key constraints
- Column data types

#### Log Point 7: Base64 Conversion
```
[Upload API] Converted image to base64 with data URI: { 
  base64Length: 328450,
  mimeType: "image/jpeg",
  imageId: "5187e16b-73a6-449c-b949-c006d31a6226",
  requestId: "abc123"
}
```
✅ **Purpose:** Image ready for OCR

#### Log Point 8: OCR Processing Start
```
[Upload API] Starting OCR processing: { 
  imageId: "5187e16b-73a6-449c-b949-c006d31a6226",
  method: "base64",
  requestId: "abc123"
}
```
⏳ **Status:** OCR job initiated

#### Log Point 9: OCR Processing Complete ✅
```
[Upload API] OCR completed: { 
  success: true,
  processingTime: 3500,
  requestId: "abc123"
}
```
✅ **Status:** OCR succeeded - text extracted

#### Log Point 9b: OCR Processing Failed ❌
```
[Upload API] OCR processing failed: { 
  error: "OCR processing failed: Service temporarily unavailable",
  method: "base64",
  fullError: "{...}",
  requestId: "abc123"
}
```
❌ **Common Errors:**
- "Service temporarily unavailable" → API down
- "Invalid API key" → Wrong OCRSPACE_API_KEY
- "Request timeout" → Network issue or large image
- "Empty parse result" → Image too blurry/poor quality

#### Log Point 10: OCR Result Saved
```
[Upload API] OCR result saved: {
  ocrResultId: "ocr_12345",
  textLength: 342,
  requestId: "abc123"
}
```
✅ **Status:** Results stored in database

#### Log Point 11: Status Update
```
[Upload API] Upload completed successfully: { 
  menuImageId: "5187e16b...",
  ocrResultId: "ocr_12345",
  finalStatus: "ocr_done",
  requestId: "abc123"
}
```
✅ **Status:** Image marked as `ocr_done` (ready to display)

---

### B. OCR Service Logging
**File:** `src/lib/ocr.ts`

#### Log Point 1: Service Initialization
```
[OCR Service] Initialization check: {
  apiKeyProvided: false,
  envKey: true,
  envKeyValue: "K8822328...",
  finalKey: "K8822328..."
}
```
✅ **Purpose:** Verify OCR service is ready

#### Log Point 2: Base64 Processing Start
```
[OCR] Starting OCR processing from base64: {
  operation: 'ocr_base64_start',
  base64Length: 328450,
  language: 'eng',
  ocrEngine: 3,
  isOverlayRequired: true,
  hasApiKey: true
}
```
⏳ **Status:** Processing initiated

#### Log Point 3: API Request Sent
```
[OCR] Sending OCR API request for base64: {
  operation: 'ocr_api_base64_request',
  endpoint: 'https://api.ocr.space/Parse/Image',
  apiKey: 'K8822328...',
  paramsKeys: ['apikey', 'base64Image', 'language', 'OCREngine', 'isOverlayRequired']
}
```
📤 **Status:** Request heading to OCR.Space

#### Log Point 4a: API Success ✅
```
[OCR] OCR processing completed successfully for base64: {
  operation: 'ocr_base64_processing_success',
  processingTime: 3500,
  hasParsedResults: true,
  parsedTextLength: 342,
  textOverlayLines: 12,
  apiProcessingTime: 3500
}
```
✅ **Status:** Text extracted successfully
- `parsedTextLength: 342` → 342 characters extracted
- `textOverlayLines: 12` → 12 lines detected

#### Log Point 4b: API Error ❌
```
[OCR] OCR processing failed for base64: {
  operation: 'ocr_base64_processing_failed',
  processingTime: 35000,
  hasError: true,
  errorMessages: ["Service temporarily unavailable"],
  errorDetails: ["Could not connect to service"]
}
```
❌ **Status:** OCR.Space API error
- **Check:** API status at https://api.ocr.space
- **Check:** API key validity
- **Check:** Network connectivity

---

## 5. Common Errors & Solutions

### Error: "OCR API Key check: { hasOcrKey: false }"
**Problem:** Environment variable not set
```bash
# Add to .env.local or .env
OCRSPACE_API_KEY=K88232808588957
```
**Solution:** Restart dev server

---

### Error: "OCR processing failed: Service temporarily unavailable"
**Problem:** OCR.Space API is down or overloaded
**Check:**
- https://api.ocr.space/status
- Try again in a few minutes
- Rate limits: ~200 requests/hour for free tier

---

### Error: "OCR processing failed: Invalid API key"
**Problem:** OCRSPACE_API_KEY is wrong
**Solution:**
```bash
# Verify API key in logs:
# [OCR Service] Initialization check: { envKeyValue: "K8822328..." }

# Check if it matches your key:
echo $env:OCRSPACE_API_KEY
```

---

### Error: "Image too blurry" or Empty ParsedText
**Problem:** Image quality too poor
**Solutions:**
- Ensure good lighting when taking photo
- Avoid motion blur
- Keep text size reasonably large
- Clean camera lens

---

### Error: "Database error: Failed to save OCR result"
**Problem:** Database insert failed
**Check:**
- ocr_results table exists
- Column types match (text: string, processing_time_ms: number)
- Foreign key image_id exists in menu_images

---

## 6. Debugging in Action

### Step 1: Check Upload Logs
```bash
npm run dev

# When uploading, look for:
[Upload API] OCR API Key check: { hasOcrKey: true }
[Upload API] Starting OCR processing: { imageId: "...", method: "base64" }
[Upload API] OCR completed: { success: true, processingTime: 3500 }
[Upload API] Upload completed successfully: { finalStatus: "ocr_done" }
```

### Step 2: Check OCR Logs
```bash
# In the same terminal, look for:
[OCR Service] Initialization check: { hasApiKey: true }
[OCR] Starting OCR processing from base64: { base64Length: 328450 }
[OCR] OCR processing completed successfully: { parsedTextLength: 342 }
```

### Step 3: Verify Database
```bash
# Check menu_images table
SELECT id, status, storage_path FROM menu_images WHERE restaurant_id = '5d503b51-...';

# Result should show:
# id                                    | status    | storage_path
# 5187e16b-73a6-449c-b949-c006d31a6226 | ocr_done  | menus/magna/2025-11-29T14-06-10Z-menu.jpg

# Check ocr_results table
SELECT id, image_id, text FROM ocr_results;

# Result should show extracted text
```

### Step 4: Test Retrieval
```bash
curl "http://localhost:3000/api/restaurants/magna/menus"

# Response should include:
{
  "menus": [{
    "id": "5187e16b-...",
    "status": "ocr_done",
    "storage_path": "menus/magna/...",
    "ocr_results": [{
      "text": "Masala Dosa - ₹45\nIdli Vada Set - ₹30...",
      "processing_time_ms": 3500,
      "ocr_engine": 3
    }]
  }]
}
```

---

## 7. Performance Metrics

### Expected Processing Times

| Stage | Time | Notes |
|-------|------|-------|
| File upload to storage | 500-1500ms | Depends on file size |
| Base64 conversion | 50-200ms | Local operation |
| OCR API call | 2000-8000ms | Depends on API load & image complexity |
| Database write | 200-500ms | Typical query time |
| **Total** | **3000-10000ms** | 3-10 seconds end-to-end |

### Example Timeline:
```
00:00 - Upload started
00:01 - File upload to storage: 1200ms
00:02 - Base64 conversion: 150ms
00:04 - OCR API processing: 3500ms
00:07 - Database save: 300ms
00:08 - Complete! Status: ocr_done
```

---

## 8. Advanced Debugging

### Enable Verbose Logging
Add to `src/app/api/upload/route.ts`:
```typescript
// At the top of POST handler
console.log('[Upload API] Full request body:', {
  headers: Object.fromEntries(request.headers),
  contentType: request.headers.get('content-type')
})
```

### Test OCR Directly
Create `test-ocr.js`:
```javascript
const { ocrService } = require('./src/lib/ocr');

(async () => {
  try {
    const result = await ocrService.parseImageFromUrl(
      'https://example.com/menu.jpg'
    );
    console.log('OCR Result:', result);
  } catch (error) {
    console.error('OCR Error:', error.message);
  }
})();
```

### Monitor Database Inserts
```sql
-- Watch for ocr_results being created
SELECT 
  COUNT(*) as total_ocr_results,
  COUNT(CASE WHEN text IS NOT NULL THEN 1 END) as with_text,
  COUNT(CASE WHEN text IS NULL THEN 1 END) as without_text
FROM ocr_results;

-- Find slowest OCR operations
SELECT 
  id, 
  processing_time_ms, 
  image_id,
  LENGTH(text) as text_length
FROM ocr_results
ORDER BY processing_time_ms DESC
LIMIT 10;
```

---

## 9. Request Tracing

Every upload request has a unique **requestId** to trace end-to-end:

```
[Upload API] Upload API request received { requestId: "abc123" }
  ↓
[Upload API] File validation { requestId: "abc123" }
  ↓
[Upload API] Restaurant lookup { requestId: "abc123" }
  ↓
[Upload API] Storage upload { requestId: "abc123" }
  ↓
[OCR] Starting OCR processing { requestId: "abc123" } ← Same ID!
  ↓
[Upload API] OCR completed { requestId: "abc123" }
```

**To trace a specific upload:**
```bash
# In terminal, look for log lines with the requestId
grep "abc123" logs.txt

# Or in VS Code terminal, search upward for the requestId
```

---

## 10. Current Implementation Status

✅ **Working:**
- File upload to storage
- Database record creation
- Base64 image conversion
- OCR.Space API integration
- Result storage in database
- Status tracking (ocr_pending → ocr_done)

⚠️ **Needs Monitoring:**
- OCR API reliability (sometimes times out)
- Large image handling (>5MB may fail)
- Rate limiting (200 req/hour free tier)

🔄 **Future Improvements:**
- Fallback OCR provider if primary fails
- Webhook for async OCR processing
- Image preprocessing before OCR
- Confidence score tracking
- Manual text correction interface

---

## 11. Test Scenarios

### Scenario 1: Successful Upload & OCR
```
Input: Clear, well-lit menu photo
Expected: status: "ocr_done", text extracted correctly
Logs: OCR completed successfully
```

### Scenario 2: Upload with OCR Timeout
```
Input: Very large image (10MB+)
Expected: status: "ocr_pending", image stored, OCR skipped
Logs: OCR processing failed: Request timeout
```

### Scenario 3: Poor Image Quality
```
Input: Blurry, low-light menu photo
Expected: status: "ocr_done", text may be incomplete/garbled
Logs: OCR completed successfully (API says success even if result poor)
```

### Scenario 4: No OCR API Key
```
Input: Any image
Expected: status: "ocr_pending", image stored, OCR skipped
Logs: hasOcrKey: false in logs
```

---

## Summary

The OCR system is **end-to-end traceable** with **detailed logging at every step**. Use the **requestId** to track any upload from start to finish. Check the logs to identify exactly where issues occur.

**Key Files:**
- `/src/lib/ocr.ts` - OCR service
- `/src/app/api/upload/route.ts` - Upload handler
- `/src/app/api/restaurants/[slug]/menus/route.ts` - Retrieval handler

**Key Logs to Watch:**
1. `[Upload API] OCR API Key check` - API key present?
2. `[Upload API] Starting OCR processing` - Job initiated?
3. `[Upload API] OCR completed` - Success or failure?
4. `[Upload API] Upload completed successfully` - Final status?

