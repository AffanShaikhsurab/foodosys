# OCR Debugging - Visual Reference Guide

## Complete OCR Flow with Logging Points

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    FOODOSYS OCR PROCESSING PIPELINE                        ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: USER UPLOADS IMAGE                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [User selects image] ──→ [Browser sends to /api/upload]                   │
│                                                                              │
│  LOG: [Upload API] Upload API request received                             │
│       └─ requestId: "abc123"                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: VALIDATE & AUTHENTICATE                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ✓ Check authentication token                                              │
│  ✓ Extract file from request                                               │
│  ✓ Validate file size and type                                             │
│                                                                              │
│  LOG: [Upload API] File validation                                         │
│       └─ hasFile: true, fileSize: 245000, restaurantSlug: "magna"          │
│                                                                              │
│  LOG: [Upload API] Authentication verification successful                  │
│       └─ userId: "f6c095de-..."                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: RESTAURANT LOOKUP                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Query: SELECT id FROM restaurants WHERE slug = 'magna'                   │
│                                                                              │
│  LOG: [Upload API] Restaurant lookup                                       │
│       └─ restaurantFound: true, restaurantId: "5d503b51-..."              │
│                                                                              │
│  IF NOT FOUND → Return 404 error                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: FILE UPLOAD TO STORAGE                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Convert file to Buffer                                                 │
│     LOG: [Upload API] Buffer created successfully                          │
│          └─ bufferSize: 245000                                             │
│                                                                              │
│  2. Upload to Supabase Storage bucket "menu-images"                        │
│     Path: menus/magna/2025-11-29T14-06-10Z-menu.jpg                       │
│     LOG: [Upload API] Storage upload response details                      │
│          └─ hasError: false, uploadDataPath: "menus/magna/..."            │
│                                                                              │
│  3. Create signed URL for OCR processing (5 min expiry)                   │
│     LOG: [Upload API] Signed URL creation response                         │
│          └─ hasSignedUrl: true                                             │
│                                                                              │
│  IF ERROR → Return storage error, throw exception                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: CREATE DATABASE RECORD                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Insert into menu_images:                                                  │
│  {                                                                           │
│    restaurant_id: "5d503b51-...",                                          │
│    storage_path: "menus/magna/2025-11-29T14-06-10Z-menu.jpg",             │
│    mime: "image/jpeg",                                                      │
│    status: "ocr_pending",  ← Status initially PENDING                      │
│    uploaded_by: "f6c095de-..."                                             │
│  }                                                                           │
│                                                                              │
│  LOG: [Upload API] Menu image record insertion response                    │
│       └─ menuImageId: "5187e16b-...", status: "ocr_pending"               │
│                                                                              │
│  IF ERROR → Return database error                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 6: PREPARE FOR OCR PROCESSING                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Verify OCR API Key is configured                                       │
│     LOG: [Upload API] OCR API Key check                                    │
│          └─ hasOcrKey: true, ocrKeyValue: "K8822328..."                   │
│                                                                              │
│  2. Convert file buffer to base64 with data URI prefix                    │
│     Format: data:image/jpeg;base64,/9j/4AAQSkZJRgABA...                  │
│     LOG: [Upload API] Converted image to base64                            │
│          └─ base64Length: 328450, imageId: "5187e16b-..."                │
│                                                                              │
│  3. Prepare OCR service call parameters                                    │
│     LOG: [Upload API] Starting OCR processing                              │
│          └─ method: "base64", imageId: "5187e16b-..."                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ TRY
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 7: OCR SERVICE INITIALIZATION                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  File: src/lib/ocr.ts                                                      │
│  Method: ocrService.parseImageFromBase64()                                │
│                                                                              │
│  1. Check OCR API Key                                                      │
│     LOG: [OCR Service] Initialization check                                │
│          └─ hasApiKey: true, apiKeyPrefix: "K8822328..."                 │
│                                                                              │
│  2. Prepare request parameters                                             │
│     - apikey: K88232808588957                                              │
│     - base64Image: data:image/jpeg;base64,...                             │
│     - language: eng                                                         │
│     - OCREngine: 3 (Tesseract 4)                                          │
│     - isOverlayRequired: true                                              │
│                                                                              │
│  LOG: [OCR Service] Prepared OCR API request parameters                    │
│       └─ paramCount: 5, bodySize: 328500                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 8: API CALL TO OCR.SPACE                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POST https://api.ocr.space/Parse/Image                                    │
│  Content-Type: application/x-www-form-urlencoded                           │
│                                                                              │
│  LOG: [OCR Service] Initiating fetch to OCR.Space API                      │
│       └─ timestamp: "2025-11-29T14:06:25.000Z"                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ NETWORK CALL (can take 2-8 seconds)                         │           │
│  │ - API processes image                                       │           │
│  │ - Extracts text using Tesseract 4                          │           │
│  │ - Detects text regions and lines                           │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  LOG: [OCR Service] Fetch completed                                        │
│       └─ status: 200, statusText: "OK", fetchDuration: 3500ms             │
│                                                                              │
│  IF STATUS ≠ 200 → ERROR: HTTP error                                       │
│  IF TIMEOUT → ERROR: fetch timeout                                         │
│  IF NETWORK ERROR → ERROR: connection refused                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 9: PARSE OCR RESPONSE                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Response JSON:                                                             │
│  {                                                                           │
│    "IsErroredOnProcessing": false,                                         │
│    "ErrorMessage": null,                                                    │
│    "ParsedResults": [{                                                      │
│      "ParsedText": "Masala Dosa - ₹45\nIdli Vada Set - ₹30\n...",       │
│      "TextOverlay": {                                                       │
│        "Lines": [ { "LineText": "Masala Dosa", ... }, ... ]               │
│      }                                                                       │
│    }],                                                                      │
│    "ProcessingTimeInMilliseconds": 3500                                    │
│  }                                                                           │
│                                                                              │
│  LOG: [OCR Service] Response JSON parsed successfully                      │
│       └─ isErroredOnProcessing: false, hasParsedResults: true             │
│                                                                              │
│  CHECK:                                                                     │
│  ✓ IsErroredOnProcessing = false? → Continue                              │
│  ✗ IsErroredOnProcessing = true? → ERROR: OCR processing failed           │
│  ✗ ParsedResults empty? → ERROR: No text extracted                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼ SUCCESS             ▼ FAILURE
          ┌──────────────────────────┐  ┌──────────────────────┐
          │ STAGE 10a: SUCCESS PATH  │  │ STAGE 10b: ERROR PATH│
          └──────────────────────────┘  └──────────────────────┘
                         │                        │
                         ▼                        ▼
          ┌──────────────────────────┐  ┌──────────────────────┐
          │ Log: OCR Processing      │  │ Log: OCR processing │
          │  Success                 │  │  FAILED              │
          │                          │  │ - errorMessage       │
          │ parsedTextLength: 342    │  │ - errorType          │
          │ textOverlayLines: 12     │  │ - errorStack         │
          │                          │  │                      │
          │ processingTime: 3500ms   │  │ Store error details  │
          └──────────────────────────┘  └──────────────────────┘
                         │                        │
                         ▼                        ▼
          ┌──────────────────────────┐  ┌──────────────────────┐
          │ STAGE 11a: SAVE RESULTS  │  │ STAGE 11b: SKIP SAVE │
          │                          │  │                      │
          │ Insert into ocr_results: │  │ ocrProcessing=false  │
          │ {                        │  │ Set finalStatus to   │
          │   image_id: ...,         │  │ "ocr_pending"        │
          │   text: "...",           │  │ (graceful fallback)  │
          │   words: [...],          │  │                      │
          │   language: "eng",       │  └──────────────────────┘
          │   ocr_engine: 3,         │           │
          │   processing_time_ms:    │           │
          │     3500                 │           │
          │ }                        │           │
          │                          │           │
          │ LOG: OCR result saved    │  LOG: Skipping OCR    │
          │      ocrResultId: "..." │       result save      │
          │                          │           │
          └──────────────────────────┘           │
                         │                       │
                         └───────────┬───────────┘
                                     ▼
          ┌──────────────────────────────────────────────┐
          │ STAGE 12: UPDATE IMAGE STATUS                │
          ├──────────────────────────────────────────────┤
          │                                               │
          │ IF OCR succeeded AND result saved:           │
          │   Update menu_images SET status = 'ocr_done' │
          │   Also set ocr_result_id = "ocr_..."         │
          │                                               │
          │ IF OCR failed:                               │
          │   Keep status = 'ocr_pending'                │
          │   (Image visible, text will be placeholder)  │
          │                                               │
          │ LOG: Updating menu image status              │
          │      finalStatus: "ocr_done" or "ocr_pending"│
          │                                               │
          └──────────────────────────────────────────────┘
                                    │
                                    ▼
          ┌──────────────────────────────────────────────┐
          │ STAGE 13: RETURN RESPONSE                    │
          ├──────────────────────────────────────────────┤
          │                                               │
          │ {                                            │
          │   "success": true,                           │
          │   "status": "ocr_done" | "ocr_pending",     │
          │   "menuImage": { ... },                      │
          │   "ocrResult": { ... },                      │
          │   "ocrProcessingDetails": {                  │
          │     "processed": true/false,                 │
          │     "error": null/errorObject,              │
          │     "resultId": "ocr_..." or null,          │
          │     "processingTime": 3500 or null          │
          │   }                                          │
          │ }                                            │
          │                                               │
          │ LOG: Upload completed successfully           │
          │      finalStatus: "ocr_done"/"ocr_pending"  │
          │                                               │
          └──────────────────────────────────────────────┘
                                    │
                                    ▼
          ┌──────────────────────────────────────────────┐
          │ CLIENT RECEIVES RESPONSE                     │
          │                                               │
          │ If status = "ocr_done":                      │
          │   ✓ Image uploaded                           │
          │   ✓ Text extracted                           │
          │   ✓ Ready to display                         │
          │                                               │
          │ If status = "ocr_pending":                   │
          │   ✓ Image uploaded                           │
          │   ⚠ Text not available (retry later)        │
          │   ✓ Placeholder text shown                   │
          │                                               │
          └──────────────────────────────────────────────┘
```

---

## Error Decision Tree

```
                    ┌─ OCR Processing Started
                    │
        ┌───────────┴───────────┐
        │                       │
    API Key            Restaurant
     Exists?             Exists?
       │                    │
   YES │ NO            YES │ NO
       │  │               │  │
       ▼  ▼               ▼  ▼
    CONT ERROR          CONT ERROR
                            │
        ┌───────────┬───────┘
        │           │
    Storage    File
     Upload    Too Big?
    Success?    │
        │       │
    YES │ NO   │
        │  │   ▼
        ▼  ▼ ERROR
    CONT ERROR
        │
        ├─────────────────────────────┐
        │                             │
    DB Record              Base64
      Create              Conversion
    Success?              Success?
        │                    │
    YES │ NO             YES │ NO
        │  │                │  │
        ▼  ▼                ▼  ▼
    CONT ERROR           CONT ERROR
        │
        ├──────────────────────────────────┐
        │                                  │
    OCR API              Network
    Responds?            Connection?
        │                    │
    YES │ NO             YES │ NO
        │  │                │  │
        ▼  ▼                ▼  ▼
    CHECK ERROR          CHECK ERROR
        │
        ├──────────────────────┐
        │                      │
    API Returns            Text
    Error?               Extracted?
        │                    │
    YES │ NO             YES │ NO
        │  │                │  │
        ▼  ▼                ▼  ▼
    ERROR SAVE            SAVE EMPTY
        │                    │
        └────────┬───────────┘
                 │
            RETURN RESPONSE
                 │
        ┌────────┴────────┐
        │                 │
    ocr_done          ocr_pending
    (success)         (fallback)
```

---

## Request Timeline

```
Client Upload Start: T+0ms
    ↓
Server Receives:     T+50ms
    ↓
File Validation:     T+100ms
    ↓
Restaurant Lookup:   T+200ms (DB query: ~100ms)
    ↓
Storage Upload:      T+1200ms (Network: ~1000ms)
    ↓
DB Record Insert:    T+1500ms (DB: ~300ms)
    ↓
Base64 Conversion:   T+1700ms (Local: ~200ms)
    ↓
OCR API Call:        T+5200ms (Network: ~3500ms)
    ↓
Response Parse:      T+5300ms (Local: ~100ms)
    ↓
OCR Result Save:     T+5600ms (DB: ~300ms)
    ↓
Status Update:       T+5900ms (DB: ~300ms)
    ↓
Response Return:     T+6000ms
    ↓
Client Receives:     T+6100ms

Total Time: ~6 seconds (expected range: 3-10 seconds)
```

---

## Log Message Levels

### Information Logs (✓)
```
[Upload API] File validation: { ... }
[Upload API] Restaurant lookup: { ... }
[OCR Service] Fetch completed: { ... }
```

### Error Logs (✗)
```
[Upload API] OCR processing FAILED: { ... }
[OCR Service] Fetch Error: { ... }
[Upload API] Failed to save OCR result: { ... }
```

### Success Logs (✅)
```
[Upload API] Upload completed successfully: { ... }
[OCR Service] OCR Processing Success: { ... }
[Upload API] OCR result saved successfully: { ... }
```

---

## Key Metrics to Watch

| Metric | Normal | Slow | Problem |
|--------|--------|------|---------|
| File Upload | 500-1500ms | 2000-3000ms | > 5000ms |
| OCR Processing | 2000-4000ms | 5000-8000ms | > 15000ms |
| Database Ops | 100-500ms | 500-1000ms | > 2000ms |
| Total Duration | 3000-6000ms | 7000-10000ms | > 15000ms |

---

## Common Log Patterns

### ✅ Success Pattern
```
OCR API Key check: hasOcrKey: true
Restaurant lookup: restaurantFound: true
Storage upload: hasError: false
Menu image record: hasError: false
OCR completed: success: true, textLength: >100
Upload completed: finalStatus: "ocr_done"
```

### ❌ API Key Error Pattern
```
OCR API Key check: hasOcrKey: false
Upload completed: finalStatus: "ocr_pending"
```

### ❌ Network Error Pattern
```
Fetch Error: { error: "fetch timeout" }
OCR processing FAILED
Upload completed: finalStatus: "ocr_pending"
```

### ❌ Poor Quality Image Pattern
```
OCR completed: success: true, textLength: 0
Upload completed: finalStatus: "ocr_done" (status=done even with empty text)
```

