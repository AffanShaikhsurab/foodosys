# Admin System - Quick Start Guide

## What's New?
Your Foodosys app now has a complete admin system that allows designated administrators to delete any menu image uploaded by users. This helps moderate content and remove inappropriate or misused images.

## Features Added ✨

### 1. Mobile Swipe-to-Delete
- Admins can swipe left on any menu image card
- Red delete button appears when swiping
- Quick and intuitive content moderation

### 2. Desktop Delete Buttons
- Red "Delete Image" button in the feedback row
- Delete button in full-screen image viewer
- Clear visual indicators for admin users

### 3. Admin Badge
- Red "ADMIN" badge displayed on menu cards
- Helps identify admin capabilities

### 4. Security & Audit
- All deletions are logged in the database
- Admin-only API endpoints with authentication
- Row-level security policies enforced

## Quick Setup (3 Steps) 🚀

### Step 1: Run Database Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/migrations/006_admin_system.sql`
3. Click "Run"

### Step 2: Make Yourself Admin
Option A - Use the script (recommended):
```bash
node scripts/make-admin.js your-email@example.com
```

Option B - Manually in Supabase:
1. Go to Supabase Dashboard → Authentication → Users
2. Copy your user ID
3. Go to SQL Editor and run:
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = 'YOUR_USER_ID_HERE';
```

### Step 3: Test It Out
1. Sign in with your admin account
2. Go to any restaurant page with menu images
3. Try swiping left on an image (mobile) or clicking "Delete Image" (desktop)
4. You should see the admin badge and delete functionality

## Files Modified/Created

### New Files:
- `src/app/api/admin/delete-image/[imageId]/route.ts` - Delete API endpoint
- `supabase/migrations/006_admin_system.sql` - Database migration
- `scripts/make-admin.js` - Helper script to make users admin
- `ADMIN_SYSTEM_GUIDE.md` - Complete documentation

### Modified Files:
- `src/lib/types.ts` - Added UserProfile interface
- `src/lib/auth.ts` - Added getUserProfile() and isAdmin() functions
- `src/lib/api.ts` - Added deleteMenuImage() method
- `src/components/RestaurantDetail.tsx` - Added swipe-to-delete UI
- `src/components/ImageViewer.tsx` - Added delete button for admins

## How It Works

### For Mobile Users:
1. Admin swipes left on a menu image card
2. Red delete button appears
3. Releasing after 60px triggers delete confirmation
4. Admin confirms and optionally provides a reason
5. Image is deleted from storage and database

### For Desktop Users:
1. Admin clicks "Delete Image" button below menu card
2. OR clicks delete button in full-screen viewer
3. Confirmation dialog appears
4. Admin confirms and optionally provides a reason
5. Image is deleted

### Backend Process:
1. API verifies user is authenticated
2. Checks if user has admin role
3. Retrieves image details from database
4. Logs deletion in admin_activity_log
5. Deletes file from Supabase Storage
6. Removes database record (cascades to related tables)

## Security

- ✅ Authentication required
- ✅ Admin role verification
- ✅ Row-level security policies
- ✅ Audit trail for all deletions
- ✅ Secure API endpoints

## Need Help?

### Common Issues:

**Admin badge not showing?**
- Verify role is set to 'admin' in user_profiles table
- Sign out and sign back in
- Check browser console for errors

**Can't delete images?**
- Ensure you're signed in as admin
- Check that migration was run successfully
- Verify SUPABASE_SERVICE_ROLE_KEY is set in .env

**Script not working?**
- Check .env file has correct Supabase credentials
- Ensure user account exists
- Try running with `node --trace-warnings scripts/make-admin.js email@example.com`

### Get Support:
1. Check `ADMIN_SYSTEM_GUIDE.md` for detailed documentation
2. Review browser console for errors
3. Check Supabase logs in dashboard
4. Verify database migration was applied

## What's Next?

Consider these enhancements:
- [ ] Admin dashboard to view all deletions
- [ ] Bulk delete functionality
- [ ] User ban/unban system
- [ ] Email notifications for deletions
- [ ] Content moderation queue
- [ ] Analytics for admin actions

---

**Happy moderating! 🎉**

If you encounter any issues or have questions, refer to the complete guide in `ADMIN_SYSTEM_GUIDE.md`.
