# OCR Debugging - Quick Start Guide

## What Was Added? ✅

Comprehensive debugging logs for the entire OCR processing pipeline so you can see exactly what happens at each step when images are uploaded and processed.

---

## Where to Find Logs?

### Terminal (During Upload)
```bash
npm run dev

# When you upload an image, look for these logs:
[Upload API] ... 
[OCR Service] ...
```

### What to Look For
1. **API Key Check** - Is OCR API key configured?
2. **File Upload** - Did file upload to storage succeed?
3. **Restaurant Lookup** - Was restaurant found?
4. **OCR Processing** - Did OCR.Space API respond?
5. **Text Extraction** - What text was found?
6. **Status** - Final status: `ocr_done` or `ocr_pending`?

---

## Quick Diagnosis

### Upload Successful with OCR ✅
**Look for these logs in order:**
```
[Upload API] OCR API Key check: { hasOcrKey: true }
[Upload API] File validation: { hasFile: true }
[Upload API] Restaurant lookup: { restaurantFound: true }
[Upload API] Storage upload response: { hasError: false }
[Upload API] Menu image record insertion: { hasError: false }
[OCR Service] Base64 OCR Start: { ... }
[OCR Service] Fetch completed: { status: 200 }
[OCR Service] OCR Processing Success: { parsedTextLength: >0 }
[Upload API] Upload completed successfully: { finalStatus: "ocr_done" }
```

### Upload Successful but OCR Failed ⚠️
**Look for:**
```
[Upload API] OCR processing FAILED: { error: "..." }
[Upload API] Continuing without OCR - image will be stored as ocr_pending
[Upload API] Upload completed successfully: { finalStatus: "ocr_pending" }
```
✅ Image still stored and visible, just no text extracted

### Upload Failed ❌
**Look for error message and identify stage:**
- Storage error → Check permissions
- Database error → Check schema
- OCR error → Check API key or image quality

---

## Common Scenarios

### 1. API Key Not Set
**Error Log:**
```
[Upload API] OCR API Key check: { hasOcrKey: false }
```

**Fix:**
```bash
# Add to .env.local
OCRSPACE_API_KEY=K88232808588957

# Restart
npm run dev
```

---

### 2. OCR.Space API Down
**Error Log:**
```
[OCR Service] Fetch Error: { error: "fetch failed" }
[Upload API] OCR processing FAILED
[Upload API] Upload completed: { finalStatus: "ocr_pending" }
```

**Status:** Image uploaded successfully, OCR will retry later

---

### 3. Poor Image Quality
**Success Log but Low Quality:**
```
[OCR Service] OCR Processing Success: { parsedTextLength: 0 }
[Upload API] Upload completed: { finalStatus: "ocr_done" }
```

**Result:** Image stored, no text extracted, placeholder used

---

### 4. Large Image (Timeout)
**Error Log:**
```
[OCR Service] Fetch Error: { error: "fetch timeout" }
[Upload API] Upload completed: { finalStatus: "ocr_pending" }
```

**Status:** Image uploaded, OCR timed out (>30 seconds)

---

## Using Request Tracing

Every upload has a unique **requestId** for tracking:

```
[Upload API] Upload API request received { requestId: "abc123" }
                         ↓
[Upload API] File validation { requestId: "abc123" }
                         ↓
[Upload API] Starting OCR processing { requestId: "abc123" }
                         ↓
[OCR Service] Base64 OCR Start { requestId: "abc123" }
                         ↓
[Upload API] Upload completed { requestId: "abc123" }
```

**To find all logs for a specific upload:**
```bash
# In terminal, search for the requestId
grep "abc123" 
```

---

## Log File Locations

### Where logs appear:
- ✅ VS Code terminal when running `npm run dev`
- ✅ Node.js console output
- ✅ Can be piped to file if needed

### Example:
```bash
# Save logs to file
npm run dev > app-logs.txt 2>&1

# View in real-time with grep
npm run dev 2>&1 | grep "OCR"
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "status": "ocr_done",
  "ocrProcessingDetails": {
    "processed": true,
    "error": null,
    "resultId": "ocr_12345",
    "processingTime": 3500
  }
}
```

### Partial Failure (Image Uploaded, OCR Failed)
```json
{
  "success": true,
  "status": "ocr_pending",
  "ocrProcessingDetails": {
    "processed": false,
    "error": {
      "errorMessage": "Service temporarily unavailable",
      "errorType": "Error"
    },
    "resultId": null,
    "processingTime": null
  }
}
```

---

## Database Check

### View Uploaded Images
```sql
SELECT id, storage_path, status, created_at
FROM menu_images
ORDER BY created_at DESC
LIMIT 5;

-- status: 'ocr_done' = text extracted
-- status: 'ocr_pending' = awaiting OCR or OCR failed
```

### View Extracted Text
```sql
SELECT id, image_id, LENGTH(text) as text_length, processing_time_ms
FROM ocr_results
ORDER BY created_at DESC
LIMIT 5;

-- Check if ocr_results exist for your image
```

---

## Performance Expectations

**Normal Upload (Clear Image):**
- Total time: 3-6 seconds
- OCR processing: 2-4 seconds
- Result: ✅ `status: "ocr_done"`

**Large Image:**
- Total time: 5-10 seconds
- OCR processing: 4-8 seconds
- Result: ✅ `status: "ocr_done"` (slower but succeeds)

**Timeout (Very Large/Complex):**
- Total time: 30+ seconds
- OCR processing: ~30 seconds then timeout
- Result: ⚠️ `status: "ocr_pending"` (image stored, OCR failed)

**Poor Quality:**
- Total time: 3-5 seconds
- OCR processing: 2-3 seconds
- Result: ✅ `status: "ocr_done"` but `textLength: 0` (no text extracted)

---

## Debugging Workflow

```
1. Upload image → Watch terminal logs

2. Look for [Upload API] or [OCR Service] in logs

3. Check for success or error patterns

4. If error, read the error message

5. Match error to troubleshooting section below

6. Apply fix and retry
```

---

## Troubleshooting

| Problem | Log Pattern | Fix |
|---------|------------|-----|
| API key missing | `hasOcrKey: false` | Set `OCRSPACE_API_KEY` in .env.local |
| Restaurant not found | `restaurantFound: false` | Check restaurant slug is correct |
| Storage error | `hasError: true` (upload) | Check storage permissions |
| Database error | `hasError: true` (menu_images) | Check table schema |
| OCR timeout | `fetch timeout` | Try smaller image or wait for API |
| Poor quality | `parsedTextLength: 0` | Use clearer, well-lit image |
| API down | `fetch failed` | Wait for OCR.Space to come back up |

---

## Files with Detailed Guides

1. **OCR_PROCESSING_GUIDE.md** - Complete flow with every log point explained
2. **OCR_DEBUG_CHECKLIST.md** - Step-by-step testing and error diagnosis
3. **OCR_FLOW_DIAGRAM.md** - Visual diagrams of the entire pipeline
4. **OCR_DEBUGGING_IMPLEMENTATION.md** - What was added and why

---

## Key Takeaways

✅ **Every step is logged** - Can identify exactly where issues occur  
✅ **Request tracing** - Use requestId to follow flow from start to finish  
✅ **Error details** - Stack traces and error types included  
✅ **Graceful fallback** - Image uploads even if OCR fails  
✅ **Performance tracking** - See timing for each stage  

---

## Next Steps

1. **Start dev server:** `npm run dev`
2. **Upload test image:** Navigate to `/upload`
3. **Watch terminal** for logs
4. **Check response** in Network tab (DevTools)
5. **Query database** to verify results

---

## Quick Reference

**When logs show:**
- ✅ `"ocr_done"` → Success, text extracted
- ⚠️ `"ocr_pending"` → Image stored, OCR awaiting or failed
- ❌ Error message → Identify issue and apply fix

**Always check:**
- requestId exists (for tracing)
- Error message explains what went wrong
- Database has matching record
- API response includes details

---

## Support Files Created

```
OCR_PROCESSING_GUIDE.md        ← Complete documentation
OCR_DEBUG_CHECKLIST.md         ← Testing and diagnosis guide  
OCR_FLOW_DIAGRAM.md            ← Visual flow diagrams
OCR_DEBUGGING_IMPLEMENTATION.md ← What was added
OCR_QUICK_START.md             ← This file
```

All files are in the project root directory.

---

## Summary

You now have **complete visibility** into the OCR processing pipeline with detailed logging at every step. Use the logs to diagnose issues, monitor performance, and understand exactly what's happening when images are uploaded and processed.

**Happy debugging!** 🎯

