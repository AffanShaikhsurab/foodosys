# Clerk-Supabase Integration Setup Guide

This guide walks you through configuring Clerk authentication with your Supabase database.

## Prerequisites

- Clerk account (sign up at https://clerk.com)
- Supabase project
- Access to both Clerk and Supabase dashboards

---

## Step 1: Clerk Dashboard Setup

### 1.1 Create Clerk Application  
1. Go to https://dashboard.clerk.com
2. Click "Add application"
3. Name your application (e.g., "Foodosys")
4. Select "Next.js" as the framework
5. Click "Create application"

### 1.2 Enable Google OAuth
1. In your Clerk dashboard, navigate to **User & Authentication** → **Social Connections**
2. Find **Google** and click **Enable**
3. Choose one of the options:
   - **Use Clerk's Google OAuth** (easiest - no setup required)
   - **Use custom credentials** (requires Google Cloud Console setup)
4. For production, you'll need to configure your own Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs from Clerk dashboard
   - Copy Client ID and Client Secret to Clerk

### 1.3 Configure Supabase JWT Template
1. In Clerk dashboard, go to **Configure** → **JWT Templates**
2. Click **New Template**
3. Select **Supabase** from the list
4. This creates a pre-configured template with:
   - `role` claim set to `authenticated`
   - Other Supabase-required claims
5. Click **Save**
6. **Copy the template name** - you'll need this (default is "supabase")

### 1.4 Get API Keys
1. Navigate to **API Keys** in Clerk dashboard
2. Copy the following:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

---

## Step 2: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_HERE

# Existing Supabase variables should remain
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Important**: Never commit `.env.local` to version control. It should be in your `.gitignore`.

---

## Step 3: Supabase Dashboard Setup

### 3.1 Add Third-Party Auth Integration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Scroll to **Third-Party Auth** section
5. Click **Add Provider**
6. Select **Clerk**
7. Enter your Clerk domain:
   - For development: `your-app-name.clerk.accounts.dev`
   - For production: `your-custom-domain.com` (if using custom domain)
8. Click **Save**

### 3.2 Run Database Migration
Run the migration to update `user_profiles` table for Clerk compatibility:

```bash
# Using Supabase CLI
npx supabase migration up

# Or run the SQL directly in Supabase SQL Editor
```

The migration file is located at:
`supabase/migrations/20251202_clerk_integration.sql`

---

## Step 4: Verify Installation

### 4.1 Check Build
```bash
npm run build
```

Should complete without TypeScript errors.

### 4.2 Test Locally
```bash
npm run dev
```

### 4.3 Test Authentication Flow
1. Open http://localhost:3000
2. Try to access a protected route (e.g., `/upload`)
3. You should be redirected to `/sign-in`
4. Try signing in with Google
5. After authentication, you should be redirected back

---

## Step 5: Supabase RLS Configuration (Optional)

If you're using Row Level Security (RLS) policies, they will automatically work with Clerk tokens. Here's an example:

```sql
-- Example: Allow users to only see their own data
CREATE POLICY "Users can view own data"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.jwt()->>'sub' = user_id);
```

The `auth.jwt()` function in Supabase will automatically parse Clerk's JWT tokens.

---

## Troubleshooting

### Issue: "Missing Clerk environment variables"
**Solution**: Ensure both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are in `.env.local`

### Issue: "Unauthorized" when accessing Supabase
**Solution**: 
1. Verify JWT template is named "supabase" in Clerk
2. Check that Third-Party Auth is enabled in Supabase
3. Ensure Clerk domain is correct in Supabase settings

### Issue: Google OAuth not working
**Solution**:
1. Verify Google OAuth is enabled in Clerk dashboard
2. Check authorized redirect URIs in Google Cloud Console
3. Test with Clerk's development Google OAuth first

### Issue: User profiles not created
**Solution**:
1. Check database migration was applied
2. Verify `user_id` column is now TEXT type
3. Check Supabase logs for errors

---

## Next Steps

1. **Customize Appearance**: Update Clerk components' appearance in sign-in/sign-up pages
2. **Add User Profile**: Create user profile creation flow after sign-up
3. **Configure Webhooks**: Set up Clerk webhooks to sync user data to Supabase
4. **Production Setup**: Update to production keys and custom domain

---

## Resources

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk + Supabase Guide](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party-auth/clerk)
