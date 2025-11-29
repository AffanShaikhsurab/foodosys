# 🎬 VISUAL STEP-BY-STEP FIX GUIDE

## The Problem
```
Browser Console Error:
├─ error: "Failed to fetch restaurants"
├─ code: "PGRST205"
└─ message: "Could not find the table 'public.restaurants'"
```

**Translation:** Database table doesn't exist yet.

---

## The Solution (5 Steps)

### 👉 STEP 1: Open Supabase Dashboard

Go directly to:
```
https://app.supabase.com/project/gzyhcqdgslztzhwqjceh/sql
```

Or:
1. Open https://app.supabase.com/
2. Login
3. Find project "gzyhcqdgslztzhwqjceh"
4. Click "SQL Editor" in left menu

**Result:** You should see an editor with "Select or create a query" message.

---

### 👉 STEP 2: Create New Query

In the SQL Editor:
- Click **"+ New query"** button (top left)
- Or click **"New SQL snippet"**

**Result:** Empty SQL editor appears with cursor ready.

---

### 👉 STEP 3: Get the Migration SQL

**FASTEST WAY (Windows):**

Open PowerShell in project directory and run:
```powershell
type supabase\migrations\001_init_schema.sql | clip
```

Then skip to Step 4 and paste.

**MANUAL WAY:**
1. Open your project folder
2. Navigate to: `supabase → migrations → 001_init_schema.sql`
3. Open in any text editor
4. Select all (Ctrl+A)
5. Copy (Ctrl+C)

**Result:** Migration SQL copied to clipboard.

---

### 👉 STEP 4: Paste Into Supabase Editor

In the Supabase SQL editor:
- Click in the text area
- Paste (Ctrl+V)

**Result:** ~416 lines of SQL appear in editor.

---

### 👉 STEP 5: Execute the Migration

In Supabase SQL editor:
- Click **blue "Run" button** (top right)
- Or press **Ctrl+Enter**
- Wait for completion...

**Expected Result:**
```
✅ Success!
Query completed successfully
```

You'll see the green checkmark and query completed message.

---

## 🔍 How to Verify It Worked

### Option 1: Terminal Command
```bash
npm run verify-db
```

Should show:
```
✅ restaurants           - OK
✅ user_profiles         - OK
✅ menu_images           - OK
... etc
```

### Option 2: In Supabase Dashboard
1. Go to "Table Editor" (left sidebar)
2. Look for `restaurants` table
3. Click it - should see 10 rows with food court names

### Option 3: Test in Browser
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click on "Restaurants"
4. Should see list of food courts
5. No error in browser console

---

## 🍽️ Sample Data That Gets Created

After running migration, your database will have:

```
1. Fiesta Food Court       - Near Gate-2 (500m)
2. Magna Food Court        - Inside GEC-2 (300m)
3. Enroute Food Court      - Near Academic Block (600m)
4. Oasis Food Court        - Near Hostels (800m)
5. Multiplex Food Court    - Near Recreation Center (400m)
6. Gazebo Food Court       - Near ECC (700m)
7. Maitri Food Court       - Near Hostels (900m)
8. Arena Food Court        - Near Multiplex (750m)
9. Amoeba Food Court       - Near GEC-2 (650m)
10. Floating Restaurant    - Premium Area (1000m)
```

All 10 automatically created by migration.

---

## 📱 After Fix - What Should Work

After migration completes:

✅ **Click Restaurants** → See list of 10 food courts
✅ **No PGRST205 error** → Console is clean
✅ **Click restaurant name** → See restaurant details
✅ **All pages load** → No database errors
✅ **Menu upload works** → Can upload menus
✅ **User profile works** → Karma system functions

---

## ⚠️ If Something Goes Wrong

### Error: "Syntax Error" in SQL Editor
→ Check you copied the entire file, not partial

### Error: "No permission"
→ Use the service role key (should be in .env.local)
→ Try logging out and back in to Supabase

### Still seeing PGRST205 error
→ Hard refresh browser: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
→ Clear browser cache
→ Restart dev server: `npm run dev`

### Table exists but no data
→ Run: `npm run seed-restaurants`
→ This inserts the 10 sample restaurants

---

## 📋 Complete Checklist

- [ ] **Step 1:** Opened Supabase SQL Editor
- [ ] **Step 2:** Created new query
- [ ] **Step 3:** Copied migration SQL
  - Used command: `type supabase\migrations\001_init_schema.sql | clip`
  - OR manually copied from file
- [ ] **Step 4:** Pasted SQL into editor
- [ ] **Step 5:** Clicked Run and saw success ✅
- [ ] **Verify:** Ran `npm run verify-db` (all tables show ✅)
- [ ] **Browser:** Hard refreshed (Ctrl+Shift+R)
- [ ] **Test:** Clicked restaurants and saw list
- [ ] **Success:** No error in console ✅

---

## 🎯 Timeline

```
Start:         You have error
  ↓
5 min:         Open SQL Editor & copy SQL
  ↓
1 min:         Paste & click Run in Supabase
  ↓
2 min:         Wait for completion
  ↓
1 min:         Verify with npm script
  ↓
1 min:         Hard refresh & test
  ↓
End:           ✅ It works!
```

**Total Time: ~5-10 minutes**

---

## 💡 Pro Tips

1. **Copy with one command:**
   ```
   type supabase\migrations\001_init_schema.sql | clip
   ```

2. **Verify quickly:**
   ```
   npm run verify-db
   ```

3. **Debug if issues:**
   ```
   npm run debug-db
   ```

4. **Watch progress:**
   Keep Supabase dashboard open while running

5. **Browser cache:**
   Clear cache after migration (Ctrl+Shift+Delete)

---

## 🆘 Emergency Commands

If something breaks:

```bash
# See what's wrong
npm run debug-db

# Verify database state
npm run verify-db

# Reseed restaurants if empty
npm run seed-restaurants

# Check credentials
cat .env.local

# View migration file
cat supabase\migrations\001_init_schema.sql
```

---

## ✅ Success Indicators

You'll know it worked when:

1. ✅ No "PGRST205" error
2. ✅ Restaurants list appears on screen
3. ✅ `npm run verify-db` shows all ✅
4. ✅ Can click on each restaurant
5. ✅ Browser console is clean

---

## 📞 Need Help?

| Issue | Solution |
|-------|----------|
| "Paste button disabled" | Copy-paste should work - try Ctrl+V |
| "Run button grayed out" | Click in SQL text area first |
| "Still seeing error" | Hard refresh: Ctrl+Shift+R |
| "No data showing" | Run: npm run seed-restaurants |
| "Wrong project?" | Check URL contains: gzyhcqdgslztzhwqjceh |

---

## 🎉 You're Done When...

```
Browser shows restaurant list
      ↓
No errors in console
      ↓
Can click on restaurants
      ↓
All features work ✅
```

**Estimated Effort: 5-10 minutes**

Good luck! 🚀
