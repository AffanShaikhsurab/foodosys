# Foodosys Menu Upload & Retrieval - Debugging Guide

**Last Updated:** November 29, 2025

---

## Quick Start: Debug Menu Upload & Retrieval

### 1. Test Upload Flow (with detailed logs)

```bash
# Terminal 1: Start the dev server
cd C:\Users\Pramod\Downloads\Foodosys\foodosys
npm run dev

# Terminal 2: Upload a test image
# Go to http://localhost:3000/upload
# Select a restaurant (e.g., Magna)
# Upload an image
# Watch Terminal 1 for detailed logs
```

**What to look for in the logs:**

```
[Upload API] File validation: { hasFile: true, fileSize: XXXXX, restaurantSlug: "magna" }
[Upload API] Restaurant lookup: { restaurantFound: true, restaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080" }
[Upload API] About to call supabaseAdmin.storage.upload with: { bucket: 'menu-images', path: '...', bufferLength: XXXXX }
[Upload API] Storage upload response details: { hasError: false, hasUploadData: true, uploadDataPath: 'menus/magna/...' }
[Upload API] Creating menu image record in database: { restaurant_id: "5d503b51...", storage_path: "menus/magna/...", mime: "image/jpeg" }
[Upload API] Menu image record insertion response: { hasError: false, menuImageId: "...", menuImageRestaurantId: "5d503b51..." }
```

---

### 2. Test Retrieval Flow (with detailed logs)

```bash
# After successful upload, navigate to restaurant detail page
# Go to http://localhost:3000/restaurants/magna

# Watch Terminal 1 for detailed logs during page load
```

**What to look for in the logs:**

```
[Menus API] <requestId> Request received: { slug: "magna", timestamp: "..." }
[Menus API] <requestId> Restaurant lookup completed: { found: true, restaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080" }
[Menus API] <requestId> Building menu_images query: { restaurantId: "5d503b51...", filters: { status: ['ocr_done', 'ocr_pending'] } }
[Menus API] <requestId> Query executed: { duration: "XXms", recordsReturned: 1, restaurantId: "5d503b51..." }
[Menus API] <requestId> Menu 1: { id: "...", storage_path: "menus/magna/...", status: "ocr_pending" }
```

---

### 3. Use the Debug Trace Endpoint

This is the most comprehensive debug tool. It traces the entire flow in one request:

```bash
# Start server first (if not already running)
npm run dev

# In another terminal, run the trace:
curl "http://localhost:3000/api/debug/menu-trace?slug=magna"

# Or with pretty JSON:
curl -s "http://localhost:3000/api/debug/menu-trace?slug=magna" | jq .
```

**Response includes:**
- Restaurant lookup result
- All database records for that restaurant
- All storage files in the bucket
- File existence validation (checks if each DB record's file exists)
- Actual API query result
- Analysis and recommendations

---

## Understanding the Data Flow

### Upload Flow

```
1. User selects image file
          ↓
2. API receives file + restaurantSlug (e.g., "magna")
          ↓
3. Look up restaurant by slug → Get restaurantId (e.g., "5d503b51-...")
          ↓
4. Upload file to storage: menus/{slug}/{timestamp}-{filename}
          ↓
5. Create menu_images database record:
   - restaurant_id: restaurantId
   - storage_path: menus/magna/2025-11-29T14-06-10-001Z-menu.jpg
   - status: ocr_pending
   - uploaded_by: userId
          ↓
6. Run OCR (if available)
          ↓
7. Update status to ocr_done (if OCR succeeded) or keep as ocr_pending
```

### Retrieval Flow

```
1. User visits restaurant page with slug (e.g., /restaurants/magna)
          ↓
2. Frontend calls API: GET /api/restaurants/{slug}/menus
          ↓
3. API looks up restaurant by slug → Get restaurantId
          ↓
4. Query menu_images WHERE restaurant_id = restaurantId AND status IN ['ocr_done', 'ocr_pending']
          ↓
5. For each menu record, return:
   - id
   - storage_path (e.g., "menus/magna/2025-11-29T14-06-10-001Z-menu.jpg")
   - status
   - mime type
   - OCR results (if available)
          ↓
6. Frontend constructs public URL: {SUPABASE_URL}/storage/v1/object/public/menu-images/{storage_path}
          ↓
7. Image displays in browser
```

---

## Critical Mapping Points

### The Restaurant Slug → ID Mapping

**This is the core of the system:**

```javascript
// In upload route:
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('id')
  .eq('slug', restaurantSlug)  // slug comes from URL: /api/upload?slug=magna

// Result: restaurant.id = "5d503b51-1e6b-4cc6-9159-8d710ac49080"

// Then stored in database:
{
  restaurant_id: "5d503b51-1e6b-4cc6-9159-8d710ac49080",  // This is the KEY!
  storage_path: "menus/magna/..."
}

// In retrieval:
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('id')
  .eq('slug', slug)  // slug from URL: /api/restaurants/{slug}/menus

// Query with the same ID:
.eq('restaurant_id', "5d503b51-1e6b-4cc6-9159-8d710ac49080")
```

**If this mapping breaks, images won't be found.**

---

## Common Issues & Solutions

### Issue 1: Images uploaded but not showing in menu

**Trace with:**
```bash
curl "http://localhost:3000/api/debug/menu-trace?slug=magna" | jq '.analysis'
```

**Check for:**
- `database_check.totalMenusInDb > 0` (records exist?) ✅
- `storage_check.filesInStorage.length > 0` (files exist?) ✅
- `file_validation.fileExists = true` (files accessible?) ✅
- `api_query.recordsReturned > 0` (query returns data?) ✅

If all are true, issue is in frontend (MenuDisplay component).
If any are false, see specific solutions below.

### Issue 2: Database records exist but no files in storage

**Root cause:** Upload route succeeds in creating DB record but fails silently uploading to storage

**Check logs for:**
```
[Upload API] Storage upload response details: { hasError: true, uploadError: "..." }
```

**Solutions:**
1. Verify `supabaseAdmin` is initialized with service role key
2. Check storage bucket permissions
3. Ensure buffer is created correctly
4. Verify file path format: `menus/{slug}/{timestamp}-{filename}`

### Issue 3: API returns empty array

**Root cause:** Either no records in DB or query filters failing

**Check:**
```bash
# See what's actually in the database
curl "http://localhost:3000/api/debug/menu-trace?slug=magna" | jq '.steps.database_check'

# See what the query returns
curl "http://localhost:3000/api/debug/menu-trace?slug=magna" | jq '.steps.api_query'
```

**If database has records but query returns 0:**
- Check RLS policies
- Verify status values are correct (should be "ocr_pending" or "ocr_done")
- Look for typos in column names

### Issue 4: Restaurant lookup fails

**Root cause:** Slug doesn't exist in restaurants table

**Check:**
```bash
curl "http://localhost:3000/api/debug/menu-trace?slug=magna" | jq '.steps.restaurant_lookup'
```

**Solution:**
1. Verify slug is correct: `http://localhost:3000/api/debug/menu-trace?slug=magna`
2. Check restaurants table for available slugs
3. Use exact slug (case-sensitive)

---

## Database Schema Reference

### restaurants table
```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,  -- Used in URLs and upload routes
  location TEXT,
  distance_estimate_m INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example data:
-- id: 5d503b51-1e6b-4cc6-9159-8d710ac49080, slug: "magna"
-- id: 73d45ed7-9bd3-428b-b132-acca25548e19, slug: "maitri"
```

### menu_images table
```sql
CREATE TABLE menu_images (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,  -- FOREIGN KEY to restaurants.id
  storage_path TEXT NOT NULL,   -- Path in S3: menus/magna/filename.jpg
  mime TEXT,
  status TEXT DEFAULT 'ocr_pending',  -- Can be: ocr_pending, ocr_done
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The restaurant_id is the KEY that links to restaurants table!
```

### ocr_results table
```sql
CREATE TABLE ocr_results (
  id UUID PRIMARY KEY,
  image_id UUID NOT NULL,  -- FOREIGN KEY to menu_images.id
  raw_json JSONB,
  text TEXT,
  words JSONB,
  language TEXT,
  ocr_engine INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Storage Bucket Structure

```
menu-images (bucket)
├── menus/
│   ├── magna/
│   │   ├── 2025-11-29T14-06-10-001Z-menu.jpg
│   │   └── 2025-11-29T13-48-58-506Z-minimalist-menu-design.jpg
│   ├── maitri/
│   │   └── 2025-11-29T14-05-14-262Z-menu.jpg
│   ├── fiesta/
│   │   └── (empty)
│   └── oasis/
│       └── (empty)
```

**Public URL format:**
```
https://gzyhcqdgslztzhwqjceh.supabase.co/storage/v1/object/public/menu-images/menus/magna/2025-11-29T14-06-10-001Z-menu.jpg
```

---

## API Endpoints Reference

### Upload Menu Image
```
POST /api/upload
Body (FormData):
  - file: File
  - restaurantSlug: string (e.g., "magna")

Response:
  {
    success: true,
    menuImage: {
      id: "...",
      restaurant_id: "...",
      storage_path: "...",
      status: "ocr_pending"
    },
    status: "ocr_pending"
  }
```

### Retrieve Menus for Restaurant
```
GET /api/restaurants/{slug}/menus

Example: GET /api/restaurants/magna/menus

Response:
  {
    menus: [
      {
        id: "...",
        restaurant_id: "5d503b51-1e6b-4cc6-9159-8d710ac49080",
        storage_path: "menus/magna/...",
        status: "ocr_pending",
        mime: "image/jpeg",
        created_at: "...",
        ocr_results: []
      }
    ]
  }
```

### Debug Menu Trace (NEW)
```
GET /api/debug/menu-trace?slug={slug}

Example: GET /api/debug/menu-trace?slug=magna

Response: Comprehensive trace of entire flow with analysis
```

---

## Expected Console Output Timeline

### Upload Flow (Server Console)

```
[Upload API] File validation: ...
[Upload API] Restaurant lookup: ...
[Upload API] About to call supabaseAdmin.storage.upload with: ...
[Upload API] Storage upload response details: { hasError: false, hasUploadData: true }
[Upload API] Creating menu image record in database: ...
[Upload API] Menu image record insertion response: { hasError: false, menuImageId: "..." }
[Upload API] Upload completed successfully: ...
```

### Retrieval Flow (Server Console)

```
[Menus API] <id> Request received: { slug: "magna" }
[Menus API] <id> Restaurant lookup completed: { found: true }
[Menus API] <id> Building menu_images query: ...
[Menus API] <id> Query executed: { recordsReturned: 1 }
[Menus API] <id> Menu 1: { id: "...", storage_path: "menus/magna/..." }
[Menus API] <id> Returning response: { menuCount: 1 }
```

---

## Verification Checklist

After uploading an image, verify each step:

- [ ] Check upload logs show no errors
- [ ] Check database: `SELECT * FROM menu_images WHERE restaurant_id = '5d503b51-...';`
  - Should show 1+ records with correct `restaurant_id` and `storage_path`
- [ ] Check storage: `curl "http://localhost:3000/api/debug/menu-trace?slug=magna"` → `storage_check.filesInStorage`
  - Should show file with correct path
- [ ] Check file exists: Look for `fileExists: true` in debug trace
- [ ] Check API query: `curl "http://localhost:3000/api/restaurants/magna/menus"`
  - Should return array with 1+ items
- [ ] Check frontend: Navigate to /restaurants/magna
  - Image should display

If any step fails, use the debug trace to identify the exact issue.

---

## Next Steps if Issues Persist

1. **Run the debug trace:**
   ```bash
   curl -s "http://localhost:3000/api/debug/menu-trace?slug=magna" | jq .
   ```

2. **Share the full output** - it will show exactly where the flow breaks

3. **Check server logs** during upload and retrieval - look for error messages

4. **Verify environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` should be set
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be set
   - `SUPABASE_SERVICE_ROLE_KEY` should be set

5. **Test storage directly:**
   ```bash
   node -e "
   const { createClient } = require('@supabase/supabase-js');
   const admin = createClient('YOUR_URL', 'YOUR_SERVICE_KEY');
   admin.storage.from('menu-images').list('menus').then(r => console.log(JSON.stringify(r, null, 2)));
   "
   ```

---

## Log Output Examples

### Successful Upload
```
[Upload API] File validation: { hasFile: true, fileSize: 73785, restaurantSlug: "magna", requestId: "a1b2c3d" }
[Upload API] Restaurant lookup: { restaurantFound: true, restaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080", slug: "magna", requestId: "a1b2c3d" }
[Upload API] About to call supabaseAdmin.storage.upload with: { bucket: 'menu-images', path: 'menus/magna/2025-11-29T14-06-10-001Z-menu.jpg', bufferLength: 73785, contentType: 'image/jpeg', upsert: false, requestId: "a1b2c3d" }
[Upload API] Storage upload completed { requestId: "a1b2c3d", timestamp: "2025-11-29T14:06:10.125Z" }
[Upload API] Storage upload response details: { hasError: false, uploadError: undefined, uploadErrorCode: undefined, hasUploadData: true, uploadDataPath: 'menus/magna/2025-11-29T14-06-10-001Z-menu.jpg', requestId: "a1b2c3d" }
[Upload API] Creating menu image record in database: { restaurant_id: "5d503b51-1e6b-4cc6-9159-8d710ac49080", storage_path: "menus/magna/2025-11-29T14-06-10-001Z-menu.jpg", uploaded_by: "f6c095de-839d-4d66-bf5b-abe4096ae503", mime: "image/jpeg", status: "ocr_pending", requestId: "a1b2c3d" }
[Upload API] Menu image record insertion response: { hasError: false, menuImageError: undefined, menuImageId: "326a71cd-6f1e-4077-b204-cfce9430ab10", menuImageRestaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080", menuImageStoragePath: "menus/magna/2025-11-29T14-06-10-001Z-menu.jpg", requestId: "a1b2c3d" }
[Upload API] Upload completed successfully: { menuImageId: "326a71cd-6f1e-4077-b204-cfce9430ab10", ocrResultId: null, finalStatus: "ocr_pending", requestId: "a1b2c3d" }
```

### Successful Retrieval
```
[Menus API] a1b2c3d Request received: { slug: "magna", url: "http://localhost:3000/api/restaurants/magna/menus", timestamp: "2025-11-29T14:06:10.500Z" }
[Menus API] a1b2c3d Looking up restaurant by slug: { slug: "magna" }
[Menus API] a1b2c3d Restaurant lookup completed: { found: true, restaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080", restaurantName: "Magna", lookupDuration: "45ms" }
[Menus API] a1b2c3d Building menu_images query: { restaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080", filters: { restaurant_id: "5d503b51-1e6b-4cc6-9159-8d710ac49080", status: [ "ocr_done", "ocr_pending" ] } }
[Menus API] a1b2c3d Query executed: { duration: "28ms", error: undefined, errorCode: undefined, recordsReturned: 1, restaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080" }
[Menus API] a1b2c3d Menus found: { count: 1, restaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080" }
[Menus API] a1b2c3d Menu 1: { id: "326a71cd-6f1e-4077-b204-cfce9430ab10", restaurant_id: "5d503b51-1e6b-4cc6-9159-8d710ac49080", storage_path: "menus/magna/2025-11-29T14-06-10-001Z-menu.jpg", status: "ocr_pending", mime: "image/jpeg", created_at: "2025-11-29T14:06:10.244442+00:00", hasOcrResults: false }
[Menus API] a1b2c3d Returning response: { menuCount: 1, totalDuration: "89ms", restaurantId: "5d503b51-1e6b-4cc6-9159-8d710ac49080" }
```

---

## For Advanced Debugging

### Direct Database Query
```bash
# Using Supabase CLI to check data directly
npx supabase db pull

# Or via Node:
node -e "
const { createClient } = require('@supabase/supabase-js');
const db = createClient('URL', 'ANON_KEY');
db.from('menu_images')
  .select('*')
  .eq('restaurant_id', '5d503b51-1e6b-4cc6-9159-8d710ac49080')
  .then(r => console.log(JSON.stringify(r.data, null, 2)))
"
```

### Storage Direct Check
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const storage = createClient('URL', 'SERVICE_KEY').storage;
storage.from('menu-images').list('menus/magna')
  .then(r => console.log(JSON.stringify(r, null, 2)))
"
```

---

**For support:** Include the full output of `curl "http://localhost:3000/api/debug/menu-trace?slug=magna"` when reporting issues.
