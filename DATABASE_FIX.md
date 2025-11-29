# 🚨 Database Issue - Complete Solution Guide

## Problem Summary
When you click on restaurants, you see:
```json
{
  "error": "Failed to fetch restaurants",
  "details": {
    "code": "PGRST205",
    "message": "Could not find the table 'public.restaurants' in the schema cache"
  }
}
```

## Root Cause
**The `restaurants` table (and all other required tables) do not exist in your Supabase database yet.**

The migration SQL file exists in your project (`supabase/migrations/001_init_schema.sql`) but hasn't been executed against your Supabase database.

---

## ✅ SOLUTION - Apply the Database Migration (2 Minutes)

### Step 1: Open Supabase SQL Editor
Go to this link directly:
👉 **https://app.supabase.com/project/gzyhcqdgslztzhwqjceh/sql**

Or manually:
1. Go to https://app.supabase.com/
2. Login
3. Select your project
4. Click "SQL Editor" in left sidebar

### Step 2: Create New Query
- Click "+ New query" or "New SQL snippet"

### Step 3: Copy Migration SQL
Copy all of the following and paste it into the SQL editor.

**Run this SQL in Supabase:**
```sql
-- Paste the entire contents of: supabase/migrations/001_init_schema.sql
```

**Quick way to copy on Windows:**
```powershell
type supabase\migrations\001_init_schema.sql | clip
```
Then paste in Supabase SQL Editor.

### Step 4: Execute
- Click the blue "Run" button (or press Ctrl+Enter)
- Wait for success message (green checkmark)

---

## 📊 What Gets Created

The migration creates all necessary tables:
- ✅ `restaurants` - 10 sample food courts
- ✅ `user_profiles` - User data with karma system
- ✅ `menu_images` - Menu image uploads
- ✅ `ocr_results` - OCR processing results
- ✅ `menus` - Menu content
- ✅ `daily_contributions` - User contribution tracking
- ✅ `user_badges` - Badge/achievement system
- ✅ `leaderboard` - Ranking system
- ✅ `local_credentials` - Offline login data

Plus:
- 📍 Security policies (Row-Level Security)
- ⚙️ Database functions and triggers
- 🌱 Seed data (10 restaurants)

---

## 🔍 After Running Migration

### Verify It Worked
1. **Option 1: Use verification script**
   ```bash
   npm run verify-db
   ```
   Should show all tables ✅

2. **Option 2: Manual verification**
   - In Supabase, go to "Table Editor"
   - Look for `restaurants` table
   - Should see 10 rows

### Test in Your App
1. **Hard refresh browser**
   - Windows: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

2. **Click on "Restaurants"**
   - Should see list of 10 food courts
   - Error should be gone ✅

---

## 🛠️ Helpful Commands

```bash
# Show migration setup instructions
npm run setup-db

# Verify database is ready
npm run verify-db

# Debug database issues
npm run debug-db

# Seed restaurants (after migration)
npm run seed-restaurants

# Start development server
npm run dev
```

---

## 🚀 Quick Action Plan

### For Immediate Fix:
1. ⏱️ **Takes 2 minutes**
2. Go to: https://app.supabase.com/project/gzyhcqdgslztzhwqjceh/sql
3. Copy-paste migration SQL from: `supabase/migrations/001_init_schema.sql`
4. Click "Run"
5. Refresh app
6. Done! ✅

### Verification:
```bash
# After running migration
npm run verify-db
npm run dev
```

---

## ❓ FAQ

**Q: How do I know if the migration worked?**
A: Run `npm run verify-db` - should show all tables with ✅

**Q: Why can't I just run it automatically?**
A: Supabase.js SDK doesn't support executing arbitrary SQL for security reasons. You must run it via their SQL Editor.

**Q: What if I get an error when running the SQL?**
A: 
- Check the error message in Supabase
- Make sure you have `service_role` key configured
- Try running the seed separately if table creation part succeeds

**Q: Do I need to run migrations on every dev session?**
A: No - run once, it persists. Only run again if you modify the schema.

**Q: Where are the restaurants coming from?**
A: They're seeded automatically by the migration (10 sample food courts).

---

## 🔗 Important Links

| Link | Purpose |
|------|---------|
| https://app.supabase.com/project/gzyhcqdgslztzhwqjceh/sql | SQL Editor (where you paste migration) |
| https://app.supabase.com/project/gzyhcqdgslztzhwqjceh | Project Dashboard |
| `supabase/migrations/001_init_schema.sql` | Migration file in this project |
| `MIGRATION_GUIDE.md` | Detailed migration guide |

---

## 📞 Next Steps

1. **Apply migration** (5 min)
2. **Verify** with `npm run verify-db` (1 min)
3. **Test** in browser (1 min)
4. **Done!** 🎉

---

**Last Updated:** November 29, 2025
**Status:** Ready to execute
**Time to Fix:** ~5 minutes
