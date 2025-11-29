# Quick Fix Reference

## ✅ What Was Fixed

### 1. React Select Warning (FIXED)
- **File:** `src/app/upload/page.tsx`
- **Issue:** Using `selected` attribute instead of React's `defaultValue`
- **Status:** ✅ COMPLETE

### 2. Menus API Error (DEBUGGING READY)
- **File:** `src/app/api/restaurants/[slug]/menus/route.ts`
- **Changes:** Added 7 logging points to track exact failure
- **Status:** 🔍 Added logging, need test output

### 3. Upload API Error (DEBUGGING READY)
- **File:** `src/app/api/upload/route.ts`
- **Changes:** Added 10 logging points across all steps
- **Status:** 🔍 Added logging, need test output

---

## 🚀 Quick Start Debugging

### Step 1: See Server Running
✅ Dev server is running at **http://localhost:3001**

### Step 2: Open Browser DevTools
```
Press F12 or Ctrl+Shift+I
Go to Console tab
```

### Step 3: Test Restaurant Click
1. Click on "Restaurants" or open http://localhost:3001
2. Click on any restaurant (e.g., "Magna")
3. Watch browser console for logs starting with `[Menus API]`

### Step 4: Share Console Output
Copy all `[Menus API]` or `[Upload API]` logs and share with details:
- Which step succeeded ✅
- Which step failed ❌
- Any error messages shown

---

## 📋 Console Log Guide

### Menus API Logs (When you click restaurant)
```
[Menus API] Fetching menus for restaurant slug: magna
[Menus API] Restaurant lookup result: { restaurantError: null, restaurantId: 'uuid' }
[Menus API] Menu fetch result: { error: null, menus: 0 }
[Menus API] Returning 0 menus
```

**If fails at restaurant lookup:**
- Problem: Can't find restaurant by slug
- Check: Slug spelling, database has restaurants

**If fails at menu fetch:**
- Problem: Can't read menu_images table  
- Check: RLS policies, table permissions

### Upload API Logs (When you upload)
```
[Upload API] Uploading file to storage: { filePath: 'menus/magna/...', fileSize: 123456 }
[Upload API] Storage upload response: { uploadError: null, uploadData: {...} }
[Upload API] File uploaded successfully
[Upload API] Creating menu image record: { restaurant_id: 'uuid', status: 'ocr_pending' }
[Upload API] Menu image record response: { menuImageError: null, menuImageId: 'uuid' }
[Upload API] Starting OCR processing: { imageId: 'uuid' }
[Upload API] OCR completed: { success: true, processingTime: 2543 }
```

**If fails at storage upload:**
- Problem: Can't write to storage bucket
- Check: `menu-images` bucket exists, permissions set

**If fails at database insert:**
- Problem: Can't create menu_images record
- Check: RLS policies, table permissions

**If fails at OCR:**
- Problem: API call to OCR.Space failed
- Check: API key valid, API quota available

---

## 🔧 Helper Commands

```bash
# Test all APIs
npm run test-api

# Verify database tables exist
npm run verify-db

# View migration file
cat supabase/migrations/001_init_schema.sql

# Check environment
cat .env.local
```

---

## 📱 Test Workflow

1. **Terminal 1:** `npm run dev` (already running)
2. **Terminal 2:** 
   ```bash
   npm run verify-db
   npm run test-api
   ```
3. **Browser:**
   - Open http://localhost:3001
   - Press F12 for console
   - Click restaurant → watch [Menus API] logs
   - Try upload → watch [Upload API] logs

---

## ❓ If Still Getting Errors

### Screenshot the error:
1. Take screenshot of browser console
2. Take screenshot of server terminal logs
3. Share both

### Include these details:
- Which button you clicked (restaurant, upload, etc.)
- What error message shows
- Which `[API]` logs appear/don't appear
- What's the last successful log line

This helps identify the exact failure point!

---

## 🎯 Expected Behavior After Fix

**Menus Page Should:**
- ✅ Load without 500 error
- ✅ Show "No menus yet" if none uploaded (it's fine!)
- ✅ Show menu images if they exist
- ✅ Load OCR results

**Upload Page Should:**
- ✅ Load without React warning
- ✅ Select restaurant from dropdown
- ✅ Let you choose/capture photo
- ✅ Show progress while uploading
- ✅ Show success message

---

**Dev Server Status:** ✅ Running on http://localhost:3001  
**React Warning Fix:** ✅ Complete  
**Menus API Logging:** ✅ Ready to debug  
**Upload API Logging:** ✅ Ready to debug
