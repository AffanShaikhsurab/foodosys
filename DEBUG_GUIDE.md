# Debugging Guide - Failed to Fetch Menus & Upload Issues

## Issues Fixed

### 1. ✅ React Warning - Select Element
**Before:**
```tsx
<option value="magna" selected>Magna Food Court (Detected)</option>
```

**After:**
```tsx
<select defaultValue="magna">
  <option value="magna">Magna Food Court (Detected)</option>
</select>
```

**Fix:** Replaced HTML `selected` attribute with React `defaultValue` prop.

---

### 2. 🔍 "Failed to Fetch Menus" - 500 Error
**Issue:** `/api/restaurants/[slug]/menus` endpoint returning 500 error

**Root Causes (to investigate with new logging):**
- Restaurant not found by slug
- Permission issues reading `menu_images` table
- RLS (Row Level Security) policy blocking access
- Malformed OrderBy clause with `photo_taken_at`

**Fixes Applied:**
- ✅ Added comprehensive console logging at every step
- ✅ Fixed `.order()` clause (removed problematic `photo_taken_at`)
- ✅ Better error messages with context

**Debug Output to Check:**
```
[Menus API] Fetching menus for restaurant slug: magna
[Menus API] Restaurant lookup result: { restaurantError: null, restaurantId: '...' }
[Menus API] Menu fetch result: { error: null, menus: 0 }
[Menus API] Returning 0 menus
```

---

### 3. 🔍 "Failed to Upload File" - 500 Error
**Issue:** `/api/upload` endpoint failing at storage or database steps

**New Logging Points:**
```
[Upload API] Uploading file to storage: { filePath: '...', fileSize: 123456, mimeType: 'image/jpeg' }
[Upload API] Storage upload response: { uploadError: null, uploadData: {...} }
[Upload API] File uploaded successfully: { filePath: '...' }
[Upload API] Menu image record response: { menuImageError: null, menuImageId: '...' }
[Upload API] Starting OCR processing: { imageId: '...' }
[Upload API] OCR completed: { success: true, processingTime: 2543 }
```

---

## How to Debug

### Step 1: Check Browser Console
1. Open your app at `http://localhost:3001` (port may vary)
2. Open DevTools: Press `F12` or `Ctrl+Shift+I`
3. Go to **Console** tab
4. Click on a restaurant
5. Look for `[Menus API]` logs
6. Look for `[Upload API]` logs

### Step 2: Check Server Logs
Your terminal running `npm run dev` will show:
- All `[Menus API]` and `[Upload API]` logs
- Network errors
- Database errors

### Step 3: Test Each Component

**Test Restaurants Fetch:**
```bash
curl http://localhost:3001/api/restaurants
```

**Test Menus for a Restaurant:**
```bash
curl http://localhost:3001/api/restaurants/magna/menus
```

**Check Browser Console for Upload:**
1. Go to Upload page
2. Select a restaurant
3. Try to upload
4. Watch console for `[Upload API]` logs

---

## Common Issues & Solutions

### Issue: Menus show as empty
**Possible Causes:**
- No menu images uploaded yet (expected!)
- RLS policies blocking read access
- Wrong restaurant slug

**Solution:**
1. Check database with Supabase dashboard
2. Verify `menu_images` has records with status='ocr_done'
3. Verify restaurant slug matches exactly

### Issue: Upload fails at storage
**Possible Causes:**
- `menu-images` storage bucket doesn't exist
- Permissions not set correctly on bucket
- File too large

**Solution:**
1. Go to Supabase > Storage
2. Verify bucket `menu-images` exists
3. Check bucket policies allow authenticated uploads

### Issue: Upload fails at OCR
**Possible Causes:**
- OCR.Space API key invalid
- API quota exceeded
- Image URL not accessible

**Solution:**
1. Check `.env.local` has `OCRSPACE_API_KEY`
2. Verify API key at https://ocr.space/ocrapi
3. Check error message in logs

---

## Next Steps

1. **Restart dev server** (already running at 3001)
2. **Open app**: http://localhost:3001
3. **Test restaurants page** - should load without error
4. **Click a restaurant** - should show menus (logs will appear)
5. **Try uploading** - watch console for detailed logs
6. **Share console output** if still getting errors

---

## Files Modified

1. **`src/app/upload/page.tsx`**
   - Fixed React warning: Changed `selected` to `defaultValue`

2. **`src/app/api/restaurants/[slug]/menus/route.ts`**
   - Added extensive console logging
   - Removed problematic `.order('photo_taken_at')` clause

3. **`src/app/api/upload/route.ts`**
   - Added logging at storage upload
   - Added logging at signed URL creation
   - Added logging at database insert
   - Added logging at OCR processing

---

## Environment Check

Your `.env.local` should have:
```
NEXT_PUBLIC_SUPABASE_URL=https://gzyhcqdgslztzhwqjceh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OCRSPACE_API_KEY=K88232808588957
```

All keys present? ✅ Check with:
```bash
cat .env.local
```

---

## Still Having Issues?

Check:
1. ✅ All logging shows in console
2. ✅ Error messages are clear
3. ✅ Server logs show request flow
4. ✅ Database has correct tables
5. ✅ Storage bucket exists
6. ✅ API keys are valid

Share the console output and we can debug further!
