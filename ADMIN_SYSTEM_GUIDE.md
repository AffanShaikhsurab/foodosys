# Admin System Documentation

## Overview
The Foodosys admin system allows designated administrators to manage and moderate menu images uploaded by users. This feature helps maintain content quality and remove inappropriate or misused images.

## Features

### 1. **Admin Role Assignment**
- Users can be assigned the 'admin' role in the `user_profiles` table
- Admins have elevated permissions to delete any menu image

### 2. **Swipe to Delete (Mobile)**
- On mobile devices, admins can swipe left on any menu image card
- A red delete button appears when swiping
- Swiping beyond 60px triggers the delete confirmation

### 3. **Delete Button (Desktop & Mobile)**
- Admin users see a red "Delete Image" button in the feedback row
- Clicking this button triggers a confirmation dialog
- Optional reason for deletion can be provided

### 4. **Full-Screen Delete**
- When viewing images in full-screen mode, admins see a delete button in the top-right corner
- Quick access to delete functionality from the image viewer

### 5. **Admin Badge**
- Admin users have a red "ADMIN" badge displayed on menu image cards
- Visual indicator of elevated permissions

### 6. **Audit Trail**
- All admin deletions are logged in the `admin_activity_log` table
- Includes: admin user ID, action type, target ID, reason, and metadata
- Complete audit history for accountability

## Setup Instructions

### Step 1: Run the Database Migration
Execute the SQL migration file in your Supabase SQL editor:
```bash
# Navigate to Supabase Dashboard → SQL Editor
# Copy and paste the contents of:
supabase/migrations/006_admin_system.sql
```

### Step 2: Create an Admin User
1. Create a user account through your normal sign-up process
2. Get the user's UUID from the Supabase Dashboard (Authentication → Users)
3. Update their role in the database:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = 'YOUR_USER_UUID_HERE';
```

### Step 3: Test Admin Access
1. Sign in with the admin user account
2. Navigate to any restaurant page with menu images
3. Verify you see:
   - Red "ADMIN" badge on menu cards
   - Delete button in the feedback row
   - Ability to swipe left to delete (mobile)
   - Delete button in full-screen viewer

## Usage

### Deleting Images (Mobile)
1. Navigate to a restaurant page
2. Swipe left on a menu image card
3. Continue swiping to reveal the red delete button
4. Release to trigger delete confirmation
5. Confirm deletion and optionally provide a reason

### Deleting Images (Desktop)
1. Navigate to a restaurant page
2. Click the red "Delete Image" button below any menu card
3. Confirm deletion in the popup dialog
4. Optionally provide a reason for deletion

### Deleting from Full-Screen View
1. Click on any menu image to view full-screen
2. Click the red delete button in the top-right corner
3. Confirm deletion and provide optional reason

## Security

### Authentication
- Delete API endpoint (`/api/admin/delete-image/[imageId]`) verifies:
  1. Valid authentication token is provided
  2. User exists in the database
  3. User has admin role in `user_profiles`

### Row Level Security (RLS)
- RLS policies ensure only admins can delete menu images
- Original uploaders can also delete their own images
- All database operations respect RLS policies

### Audit Logging
- Every deletion is logged with:
  - Admin user ID
  - Timestamp
  - Image ID and storage path
  - Reason for deletion (if provided)
  - Action metadata

## API Endpoints

### DELETE `/api/admin/delete-image/[imageId]`
Deletes a menu image (admin only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "reason": "Optional reason for deletion"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "imageId": "uuid",
  "reason": "Reason text"
}
```

**Response (Unauthorized):**
```json
{
  "error": "Forbidden: Admin access required"
}
```

## Database Schema

### New Tables

#### `admin_activity_log`
Tracks all admin actions for audit purposes
```sql
- id: UUID (PK)
- admin_user_id: UUID (FK to auth.users)
- action_type: TEXT ('delete_menu' | 'delete_image' | 'ban_user' | 'unban_user')
- target_id: UUID
- target_type: TEXT ('menu' | 'menu_image' | 'user')
- reason: TEXT (optional)
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

#### `admin_credentials`
Stores admin login credentials (if using separate admin auth)
```sql
- id: UUID (PK)
- username: TEXT (unique)
- password_hash: TEXT
- last_login: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Modified Tables

#### `user_profiles`
- Updated `role` constraint to include 'admin'
- Values: 'trainee' | 'employee' | 'admin'

## Helper Functions

### `is_admin(user_uuid UUID)`
Returns boolean indicating if user is admin
```sql
SELECT is_admin(); -- For current user
SELECT is_admin('user-uuid-here'); -- For specific user
```

### `verify_admin_credentials(username TEXT, password TEXT)`
Verifies admin login credentials
```sql
SELECT * FROM verify_admin_credentials('foodosys_admin', 'password');
```

### `admin_delete_menu(menu_id UUID, reason TEXT)`
Deletes a menu with logging
```sql
SELECT admin_delete_menu('menu-uuid', 'Reason for deletion');
```

### `admin_delete_menu_image(image_id UUID, reason TEXT)`
Deletes a menu image with logging
```sql
SELECT admin_delete_menu_image('image-uuid', 'Reason for deletion');
```

## Best Practices

1. **Always Provide Reasons**: When deleting content, provide clear reasons for transparency
2. **Review Audit Logs**: Regularly review the `admin_activity_log` table
3. **Limit Admin Access**: Only assign admin role to trusted users
4. **Communicate Policies**: Inform users about content moderation policies
5. **Document Decisions**: Keep records of why content was removed

## Troubleshooting

### Admin badge not showing
- Verify user has 'admin' role in `user_profiles` table
- Check browser console for errors
- Ensure you're signed in with the admin account

### Delete button not working
- Verify API endpoint is accessible
- Check authentication token is valid
- Review browser console for error messages
- Ensure admin role is properly set

### Swipe not working on mobile
- Ensure you're using a touch-enabled device
- Check that swipe distance exceeds 60px threshold
- Verify touch events are not being blocked by other elements

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs in the dashboard
3. Verify database migrations were applied correctly
4. Check that RLS policies are enabled

## Default Admin Credentials

**Username:** `foodosys_admin`  
**Password:** `FdSys@2025!Adm1n$Secure#Mgmt`

⚠️ **IMPORTANT:** Change this password immediately after first login!

## Security Recommendations

1. Change default admin password immediately
2. Use strong, unique passwords for admin accounts
3. Enable two-factor authentication (if available)
4. Regularly audit admin activity logs
5. Limit the number of admin users
6. Review and remove admin access when no longer needed
