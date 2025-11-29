# Database Migration Setup - QUICK FIX

## Problem
You're seeing this error when clicking on restaurants:
```
{
    "error": "Failed to fetch restaurants",
    "details": {
        "code": "PGRST205",
        "message": "Could not find the table 'public.restaurants' in the schema cache"
    }
}
```

**Root Cause:** The `restaurants` table (and all other database tables) don't exist in your Supabase database yet.

---

## Solution: Apply the Database Schema

### Option 1: Via Supabase Dashboard (RECOMMENDED - 2 minutes)

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com/
   - Login with your account

2. **Select Your Project**
   - Look for "gzyhcqdgslztzhwqjceh" (or your project name)

3. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New query" or "New SQL snippet"

4. **Copy the Migration SQL**
   - Open file: `supabase/migrations/001_init_schema.sql` in this project
   - Select all content (Ctrl+A)
   - Copy (Ctrl+C)

5. **Paste into SQL Editor**
   - Paste the SQL into the Supabase SQL editor (Ctrl+V)

6. **Execute**
   - Click the blue "Run" button (or press Ctrl+Enter)
   - Wait for completion (should see success messages)

7. **Verify**
   - Refresh your app in the browser
   - Click on restaurants - it should work now! ✅

---

### Option 2: Using Node.js Script (If automated is needed)

Run this command in your terminal:
```bash
npm run apply-migration
```

**First, update `package.json` to add:**
```json
{
  "scripts": {
    "apply-migration": "node scripts/apply-migration.js"
  }
}
```

---

## What Gets Created

The migration creates:
- ✅ `restaurants` - Main table for food courts
- ✅ `user_profiles` - User data and karma system
- ✅ `menu_images` - Uploaded menu images
- ✅ `ocr_results` - OCR processing results
- ✅ `menus` - Menu data
- ✅ `daily_contributions` - User contribution tracking
- ✅ `user_badges` - Badge system
- ✅ `leaderboard` - Ranking system
- ✅ 10 sample restaurants with data
- ✅ Security policies (RLS)
- ✅ Triggers and functions for karma system

---

## Verification Checklist

After applying migration, verify:
- [ ] No error in browser console
- [ ] Can click on restaurants and see list
- [ ] Can see restaurant details
- [ ] Restaurants include: Fiesta, Magna, Enroute, Oasis, etc.

---

## Troubleshooting

If you still see `PGRST205` error:

1. **Clear browser cache**
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

2. **Check database connection**
   - Verify `.env.local` has correct credentials
   - Check: `NEXT_PUBLIC_SUPABASE_URL`
   - Check: `SUPABASE_SERVICE_ROLE_KEY`

3. **Verify migration ran**
   - Go to Supabase > Tables
   - Look for `restaurants` table
   - Should see 10 rows if successful

4. **Restart dev server**
   ```bash
   npm run dev
   ```

---

## Quick Command Reference

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# View Supabase project
https://app.supabase.com/

# View your migration file
cat supabase/migrations/001_init_schema.sql
```

---

## Support

If you encounter issues:
1. Check Supabase dashboard for database status
2. Look at SQL Editor > Query history for errors
3. Verify authentication credentials in `.env.local`
4. Contact Supabase support if database is down
