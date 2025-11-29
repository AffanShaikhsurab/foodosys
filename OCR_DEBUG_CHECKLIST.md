# OCR Debugging Checklist & Testing Guide

## Quick Diagnostic Flow

```
┌─ OCR Processing Started
├─ [1] Check API Key Configuration
├─ [2] Check Image Upload to Storage
├─ [3] Check Base64 Conversion
├─ [4] Check OCR.Space API Call
├─ [5] Check OCR Result Parsing
├─ [6] Check Database Save
└─ [7] Check Status Update
```

---

## Pre-Upload Checklist

### Step 1: Verify Environment Setup
```bash
# Check if OCR API key is configured
echo $env:OCRSPACE_API_KEY

# Should output: K88232808588957 or your key
# If empty, add to .env.local:
OCRSPACE_API_KEY=K88232808588957
```

### Step 2: Check Dev Server is Running
```bash
# Terminal 1
npm run dev

# Should output:
# > ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 3: Verify Storage Bucket
```bash
# Check if menu-images bucket exists in Supabase
# Should have:
# - Name: menu-images
# - Visibility: Public
# - Already has: menus/magna/*, menus/maitri/*
```

---

## Upload Testing Steps

### Test 1: Upload Clear Menu Image
**Location:** http://localhost:3000/upload

**Steps:**
1. Select restaurant: "Magna Food Court"
2. Take or upload a clear, well-lit menu photo
3. Submit

**Expected Logs (in terminal):**
```
[Upload API] OCR API Key check: { hasOcrKey: true, requestId: "abc123" }
[Upload API] File validation: { hasFile: true, fileSize: 245000, requestId: "abc123" }
[Upload API] Restaurant lookup: { restaurantFound: true, requestId: "abc123" }
[Upload API] Storage upload response details: { hasError: false, requestId: "abc123" }
[Upload API] Menu image record insertion response: { hasError: false, menuImageId: "5187e...", requestId: "abc123" }

[OCR Service] Base64 OCR Start: { base64Length: 328450, hasApiKey: true, requestId: "abc123" }
[OCR Service] API Request Details: { endpoint: ".../Parse/Image", requestId: "abc123" }
[OCR Service] Fetch completed: { status: 200, statusText: "OK", fetchDuration: 3500, requestId: "abc123" }
[OCR Service] Response JSON parsed successfully: { isErroredOnProcessing: false, requestId: "abc123" }
[OCR Service] OCR Processing Success: { processingTime: 3500, parsedTextLength: 342, requestId: "abc123" }

[Upload API] OCR Service response received: { hasResponse: true, isErrored: false, parsedResultsCount: 1, processingTime: 3500, requestId: "abc123" }
[Upload API] OCR completed successfully: { success: true, processingTime: 3500, textLength: 342, requestId: "abc123" }
[Upload API] OCR result saved successfully: { ocrResultId: "ocr_12345", imageId: "5187e...", requestId: "abc123" }
[Upload API] Upload completed successfully: { menuImageId: "5187e...", ocrResultId: "ocr_12345", finalStatus: "ocr_done", requestId: "abc123" }
```

**Expected Response:**
```json
{
  "success": true,
  "status": "ocr_done",
  "menuImage": { "id": "5187e16b...", "restaurant_id": "5d503b51...", "status": "ocr_done" },
  "ocrResult": { "id": "ocr_12345", "text": "Masala Dosa - ₹45\nIdli Vada Set - ₹30..." },
  "ocrProcessingDetails": {
    "processed": true,
    "error": null,
    "resultId": "ocr_12345",
    "processingTime": 3500
  }
}
```

✅ **Success Indicators:**
- `finalStatus: "ocr_done"` - OCR succeeded
- `parsed text` in response - Text extracted
- OCR Service logs show success - API call worked

---

### Test 2: Upload Blurry Image (OCR Partial Success)
**Expected Behavior:**
- Image stored successfully
- OCR processes but may return empty or partial text
- Status: `ocr_done` (even with poor quality)
- Component should handle gracefully

**Expected Logs:**
```
[OCR Service] OCR Processing Success: { parsedTextLength: 0, textOverlayLines: 0 }
[Upload API] OCR completed successfully: { success: true, textLength: 0 }
[Upload API] Upload completed successfully: { finalStatus: "ocr_done", ocrResultId: "ocr_..." }
```

---

### Test 3: Large Image (Potential Timeout)
**Expected Behavior:**
- File stored successfully
- OCR times out after ~30 seconds
- Status: `ocr_pending` (fallback)
- Image still displayable without text

**Expected Error Logs:**
```
[OCR Service] Fetch Error: { error: "fetch timeout", fetchDuration: 30000 }
[Upload API] OCR processing FAILED: { error: "fetch timeout", method: "base64" }
[Upload API] Skipping OCR result save - OCR processing did not succeed
[Upload API] Upload completed successfully: { finalStatus: "ocr_pending" }
```

**Response Status:** `"ocr_pending"` (OCR will retry)

---

## Error Diagnosis Guide

### Error Case 1: OCR API Key Missing
**Symptoms:**
```
[Upload API] OCR API Key check: { hasOcrKey: false }
[OCR Service] Initialization check: { hasApiKey: false }
```

**Diagnosis:** Environment variable not set

**Fix:**
```bash
# Add to .env.local
OCRSPACE_API_KEY=K88232808588957

# Restart dev server
npm run dev
```

---

### Error Case 2: OCR.Space API Unreachable
**Symptoms:**
```
[OCR Service] Fetch Error: { error: "ECONNREFUSED", fetchDuration: 3000 }
[Upload API] OCR processing FAILED: { error: "fetch failed", method: "base64" }
```

**Diagnosis:** Network issue or API down

**Fix:**
```bash
# Check API status
curl https://api.ocr.space/About.json

# If fails, API is down - wait or check status page
# https://status.ocr.space/

# If network issue, check internet connection
ping api.ocr.space
```

---

### Error Case 3: Invalid API Key
**Symptoms:**
```
[OCR Service] Response JSON parsed successfully: { isErroredOnProcessing: true }
[OCR Service] URL OCR Error: { isErroredOnProcessing: true, errorMessage: ["Invalid API key"] }
[Upload API] OCR processing FAILED: { error: "OCR processing failed: Invalid API key" }
```

**Diagnosis:** API key is wrong or expired

**Fix:**
```bash
# Verify your key is correct
echo $env:OCRSPACE_API_KEY

# Get new key from: https://ocr.space/ocrapi
# Free tier key: K88232808588957
```

---

### Error Case 4: Image Upload Fails
**Symptoms:**
```
[Upload API] Storage upload response details: { hasError: true, uploadError: "Access Denied" }
```

**Diagnosis:** Storage permissions issue

**Fix:**
```bash
# In Supabase console:
# Storage → menu-images → Policies
# Verify RLS policies allow inserts
# Should allow authenticated users or all users for testing
```

---

### Error Case 5: Database Insert Fails
**Symptoms:**
```
[Upload API] Menu image record insertion response: { hasError: true, menuImageError: "Column type mismatch" }
```

**Diagnosis:** Schema mismatch

**Fix:**
```bash
# Check schema in Supabase
SELECT * FROM information_schema.columns 
WHERE table_name = 'menu_images';

# Verify columns:
# - id: uuid
# - restaurant_id: uuid
# - storage_path: text
# - mime: text
# - status: text (values: 'ocr_pending', 'ocr_done')
# - uploaded_by: uuid
# - created_at: timestamp
```

---

### Error Case 6: OCR Result Save Fails
**Symptoms:**
```
[Upload API] OCR result save response: { hasError: true, ocrSaveError: "relation ocr_results does not exist" }
```

**Diagnosis:** Table doesn't exist

**Fix:**
```sql
-- Create ocr_results table if missing
CREATE TABLE ocr_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid NOT NULL REFERENCES menu_images(id) ON DELETE CASCADE,
  raw_json jsonb,
  text text,
  words jsonb,
  language text DEFAULT 'eng',
  ocr_engine integer DEFAULT 3,
  processing_time_ms integer,
  created_at timestamp DEFAULT now()
);
```

---

## Live Debugging Terminal Commands

### Watch OCR Logs in Real-time
```bash
# Terminal 1: Start dev server with OCR logs
npm run dev 2>&1 | grep -E "\[OCR|Upload API.*OCR"

# Shows only OCR-related logs
```

### Search for Specific Upload
```bash
# After upload, search for the request ID
# (shown in first log line after upload starts)

# All logs for this upload:
npm run dev 2>&1 | grep "abc123"
```

### Test OCR API Directly
```powershell
# Create test image (1x1 white PNG with black text)
# Then test OCR endpoint

$base64Image = "base64_encoded_image_here"

$body = @"
apikey=K88232808588957&base64Image=$base64Image&language=eng&OCREngine=3&isOverlayRequired=true
"@

Invoke-RestMethod -Uri "https://api.ocr.space/Parse/Image" `
  -Method Post `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $body
```

---

## Browser Console Checks

### After Upload Succeeds
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for POST request to `/api/upload`
4. Check Response body:
```json
{
  "success": true,
  "status": "ocr_done",
  "ocrProcessingDetails": {
    "processed": true,
    "error": null,
    "resultId": "ocr_12345"
  }
}
```

### If Upload Fails
Look for error response with details:
```json
{
  "success": false,
  "error": "Failed to upload file to storage",
  "details": "..."
}
```

---

## Database Verification Commands

### Check Uploaded Images
```sql
SELECT id, restaurant_id, storage_path, status, created_at
FROM menu_images
ORDER BY created_at DESC
LIMIT 5;

-- Expected output:
-- id                                    | restaurant_id                         | storage_path                                  | status     | created_at
-- 5187e16b-73a6-449c-b949-c006d31a6226 | 5d503b51-1e6b-4cc6-9159-8d710ac49080 | menus/magna/2025-11-29T14-06-10Z-menu.jpg     | ocr_done   | 2025-11-29 14:06:20
```

### Check OCR Results
```sql
SELECT id, image_id, LENGTH(text) as text_length, processing_time_ms, created_at
FROM ocr_results
ORDER BY created_at DESC
LIMIT 5;

-- Expected output:
-- id             | image_id                          | text_length | processing_time_ms | created_at
-- ocr_12345      | 5187e16b-73a6-449c-b949-c006d31a | 342         | 3500               | 2025-11-29 14:07:00
```

### Find Images Without OCR
```sql
SELECT id, storage_path, status
FROM menu_images
WHERE status = 'ocr_pending'
ORDER BY created_at DESC;

-- These images either:
-- - Haven't had OCR processed yet
-- - Had OCR timeout/failure
```

### Check OCR Performance
```sql
SELECT 
  COUNT(*) as total,
  AVG(processing_time_ms) as avg_time_ms,
  MAX(processing_time_ms) as max_time_ms,
  MIN(processing_time_ms) as min_time_ms
FROM ocr_results;

-- Expected:
-- total | avg_time_ms | max_time_ms | min_time_ms
-- 3     | 3700        | 5200        | 2100
```

---

## Performance Benchmarks

### Normal Processing (Clear Image)
```
Upload: 1000ms
Base64 conversion: 150ms
OCR API: 3500ms
Database save: 300ms
Total: ~5000ms (5 seconds)
```

### Large Image (Potential Timeout)
```
Upload: 2000ms
Base64 conversion: 500ms
OCR API: 30000ms+ (TIMEOUT)
Status: ocr_pending (failed)
Total: ~30000ms+ (30+ seconds)
```

### Poor Quality Image
```
Upload: 1000ms
Base64 conversion: 150ms
OCR API: 2500ms
Database save: 300ms
Result: parsed but empty/partial text
Total: ~4000ms (4 seconds)
Status: ocr_done (with poor quality text)
```

---

## Step-by-Step Debug Session Example

### Scenario: Upload Not Returning Text

**Step 1: Check Server Logs**
```
[Upload API] OCR completed successfully: { success: true, textLength: 0 }
↑ Problem: textLength is 0, so no text was extracted
```

**Step 2: Check OCR Service Logs**
```
[OCR Service] OCR Processing Success: { parsedTextLength: 0, textOverlayLines: 0 }
↑ Confirmed: OCR.Space API returned no text
```

**Step 3: Likely Causes**
- Image is too blurry
- Image doesn't contain readable text
- Wrong language specified (currently: 'eng')
- Image is rotated/upside down

**Step 4: Solution**
- Try with clearer image
- Check if text is English
- Try rotating image 90°/180°/270°
- Check image directly in OCR space web app: https://ocr.space

---

## Common Success Patterns

### Pattern 1: Quick Clear Image
```
[Upload API] File validation: { fileSize: 200000 }
[Upload API] Starting OCR processing: { imageId: "..." }
[OCR Service] Fetch completed: { fetchDuration: 2800 }
[OCR Service] OCR Processing Success: { parsedTextLength: 456 }
[Upload API] Upload completed successfully: { finalStatus: "ocr_done", ocrResultId: "..." }

✅ Signs of success:
- Fetch under 4 seconds
- parsedTextLength > 100
- finalStatus: ocr_done
```

### Pattern 2: Large Image (Slower)
```
[Upload API] File validation: { fileSize: 8000000 }
[Upload API] Starting OCR processing: { imageId: "..." }
[OCR Service] Fetch completed: { fetchDuration: 8500 }
[OCR Service] OCR Processing Success: { parsedTextLength: 892 }
[Upload API] Upload completed successfully: { finalStatus: "ocr_done" }

✅ Expected:
- Larger file = longer processing
- But still completes under 10 seconds
- Text extracted successfully
```

### Pattern 3: OCR Timeout (Graceful Fallback)
```
[Upload API] Starting OCR processing: { imageId: "..." }
[OCR Service] Fetch Error: { error: "fetch timeout", fetchDuration: 30000 }
[Upload API] OCR processing FAILED: { error: "fetch timeout" }
[Upload API] Continuing without OCR - image will be stored as ocr_pending
[Upload API] Upload completed successfully: { finalStatus: "ocr_pending" }

✅ Handled gracefully:
- Image still uploaded and stored
- Status: ocr_pending (fallback)
- User can still view image without OCR text
```

---

## Summary Checklist

Before reporting OCR issues, verify:

- [ ] Dev server running (`npm run dev`)
- [ ] OCRSPACE_API_KEY environment variable set
- [ ] Menu-images storage bucket exists and is public
- [ ] menu_images table has correct schema
- [ ] ocr_results table exists
- [ ] Server logs show OCR service initialization successful
- [ ] Image is clear and well-lit
- [ ] Image has readable text
- [ ] File size is reasonable (<10MB recommended)
- [ ] Internet connection is stable
- [ ] OCR.Space API is accessible (not down)

**If OCR still fails:**
1. Save the requestId from logs
2. Check all error logs with that requestId
3. Identify which stage failed (fetch, parse, save)
4. Check corresponding error case section above
5. Apply the fix
6. Retry upload

