# Clerk-Supabase Integration Fix

## Problem Summary

The profile page was not working because the Clerk-Supabase integration was not properly configured. The code was already using the **new third-party auth provider method** (not the deprecated JWT template method), but there were several issues:

1. **Missing Template Parameter**: The `getToken()` calls were not specifying the `'supabase'` template parameter
2. **Insufficient Error Handling**: Token retrieval errors were not being caught and logged
3. **Non-Authenticated Middleware**: The middleware was creating a Supabase client without Clerk authentication

## Changes Made

### 1. Fixed Token Retrieval in All Supabase Clients

Updated the following files to use the correct `getToken({ template: 'supabase' })` pattern:

#### `src/lib/clerk-supabase.ts`
- ✅ Fixed `useClerkSupabaseClient()` hook
- ✅ Fixed `createClientSupabaseClient()` function
- ✅ Added error handling for token retrieval

#### `src/lib/clerk-supabase-server.ts`
- ✅ Fixed `createServerSupabaseClient()` function
- ✅ Added error handling for token retrieval

#### `src/lib/supabase.ts`
- ✅ Fixed `createServerClient()` function
- ✅ Added error handling for token retrieval

#### `src/lib/supabase-browser.ts`
- ✅ Fixed `useClerkSupabaseClient()` hook
- ✅ Fixed `createClerkSupabaseClient()` function
- ✅ Added error handling for token retrieval

### 2. Fixed Middleware Authentication

#### `src/middleware.ts`
- ✅ Now retrieves Clerk token before creating Supabase client
- ✅ Passes token in Authorization header to Supabase client
- ✅ Properly authenticates profile checks during onboarding verification

## Required Configuration Steps

### Step 1: Configure Clerk for Supabase Integration

1. **Go to Clerk Dashboard**
   - Navigate to: [https://dashboard.clerk.com](https://dashboard.clerk.com)
   - Select your application

2. **Enable Supabase Integration**
   - Go to **Integrations** → **Supabase**
   - Click **Activate Supabase Integration**
   - This will automatically create a JWT template named `'supabase'` with the required claims

3. **Copy Your Clerk Domain**
   - After activation, you'll see your Clerk domain (e.g., `your-app.clerk.accounts.dev`)
   - Save this for the next step

### Step 2: Configure Supabase to Accept Clerk as Auth Provider

1. **Go to Supabase Dashboard**
   - Navigate to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Add Clerk as Third-Party Provider**
   - Go to **Authentication** → **Sign In / Up**
   - Scroll to **Third-Party Auth**
   - Click **Add provider**
   - Select **Clerk** from the list
   - Paste your Clerk domain from Step 1
   - Click **Save**

### Step 3: Verify Row Level Security (RLS) Policies

Your RLS policies should use `auth.jwt()` to access Clerk session data. Example:

```sql
-- Example: Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  (auth.jwt()->>'sub') = user_id
);

-- Example: Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  (auth.jwt()->>'sub') = user_id
);
```

**Important JWT Claims Available:**
- `sub`: Clerk user ID (use this for user_id columns)
- `role`: Will be `'authenticated'` for logged-in users
- `email`: User's email address
- `org_id`: Organization ID (if using Clerk Organizations)
- `org_role`: Organization role (if using Clerk Organizations)

### Step 4: Verify Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Testing the Fix

### 1. Test Profile Page Access

1. **Sign in to your application**
   ```bash
   npm run dev
   ```

2. **Navigate to the profile/settings page**
   - The page should load without authentication errors
   - User profile data should be displayed correctly

3. **Check Browser Console**
   - Should NOT see any Supabase authentication errors
   - Should NOT see "Error getting token" messages

### 2. Test API Routes

Test the profile API routes:

```bash
# In browser dev tools console, after signing in:
fetch('/api/profile')
  .then(r => r.json())
  .then(console.log)
```

Should return your profile data without errors.

### 3. Verify Token Generation

Add this temporary code to check if tokens are being generated:

```typescript
// In any client component
import { useSession } from '@clerk/nextjs'

const { session } = useSession()
const token = await session?.getToken({ template: 'supabase' })
console.log('Supabase token:', token)
```

The token should be a valid JWT string (starts with `eyJ`).

## Common Issues and Solutions

### Issue 1: "Template 'supabase' not found"

**Solution**: You need to activate the Supabase integration in the Clerk Dashboard (see Step 1 above).

### Issue 2: "JWT verification failed" or "Invalid token"

**Possible Causes**:
1. Supabase is not configured to accept Clerk as a third-party provider
2. The Clerk domain in Supabase doesn't match your actual Clerk domain

**Solution**: Verify Step 2 configuration is correct.

### Issue 3: Profile page shows "Profile not found"

**Possible Causes**:
1. User profile doesn't exist in the database
2. RLS policies are blocking access

**Solution**:
1. Check if the user has a profile in `user_profiles` table
2. Verify RLS policies allow the user to read their own profile
3. Check the `user_id` column matches the Clerk user ID

### Issue 4: "Missing Supabase environment variables"

**Solution**: Verify `.env.local` has all required Supabase credentials (see Step 4).

## How the Integration Works Now

### Client-Side Flow

1. User signs in with Clerk → Clerk creates a session
2. User navigates to profile page
3. Component uses `useClerkSupabaseClient()` hook
4. Hook calls `session.getToken({ template: 'supabase' })`
5. Clerk returns a JWT with `role: 'authenticated'` claim
6. Supabase validates the JWT against Clerk's public keys
7. RLS policies check `auth.jwt()->>'sub'` matches user_id
8. Query succeeds and returns user's data

### Server-Side Flow (API Routes)

1. API route receives request with Clerk session cookie
2. Route calls `createServerSupabaseClient()`
3. Function uses `auth().getToken({ template: 'supabase' })`
4. Clerk returns a JWT with `role: 'authenticated'` claim
5. Supabase client includes token in `accessToken()` callback
6. RLS policies validate token and allow/deny access
7. Query returns results based on RLS policies

## Key Differences from Deprecated Method

### Old Method (Deprecated JWT Templates)
- Required manual JWT template creation
- Needed custom JWT secret configuration
- Required `iss` and `aud` claims matching
- More error-prone setup

### New Method (Third-Party Auth Provider)
- ✅ Automatic template creation via integration
- ✅ No JWT secret configuration needed
- ✅ Simplified setup in both Clerk and Supabase
- ✅ Better security with automatic key rotation
- ✅ Uses `auth.jwt()` function in RLS policies

## Next Steps

1. ✅ **Complete Step 1**: Enable Supabase integration in Clerk Dashboard
2. ✅ **Complete Step 2**: Add Clerk as provider in Supabase Dashboard
3. ✅ **Test the profile page**: Sign in and navigate to settings/profile
4. ✅ **Verify RLS policies**: Ensure policies use `auth.jwt()->>'sub'`
5. ✅ **Monitor logs**: Check for any token retrieval errors

## Support Resources

- [Clerk-Supabase Integration Docs](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase Third-Party Auth Docs](https://supabase.com/docs/guides/auth/third-party-auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Status**: All code changes completed ✅  
**Next Action Required**: Configure Clerk and Supabase dashboards (Steps 1 & 2)
