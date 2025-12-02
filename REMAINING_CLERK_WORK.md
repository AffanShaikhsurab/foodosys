# Remaining Implementation Steps for Clerk Integration

## Components That Still Need Updating

The following client components import server-only auth functions from `@/lib/auth.ts` and need to be updated to use Clerk hooks:

### 1. `src/app/upload/page.tsx`
- **Current**: Imports `getCurrentUser` from `@lib/auth`
- **Needed**: Replace with `useUser` from `@clerk/nextjs`
- **Changes**:
  ```typescript
  // Remove
  import { getCurrentUser } from '@/lib/auth'
  
  // Add
  import { useUser } from '@clerk/nextjs'
  
  // In component
  const { isLoaded, isSignedIn } = useUser()
  
  // Replace getCurrentUser() calls with isSignedIn checks
  ```

### 2. `src/components/MenuUpload.tsx`
- **Current**: Imports `getCurrentUser` from `@/lib/auth`
- **Needed**: Replace with `useUser` from `@clerk/nextjs`
- **Changes**: Same pattern as upload page above

### 3. `src/components/RestaurantDetail.tsx` 
- **Current**: Imports `isAdmin` from `@/lib/auth`
- **Needed**: Use Clerk's public metadata or server-side check
- **Note**: Admin check may need to be moved to server-side or use Clerk roles

## Quick Fix Command

To temporarily bypass build errors (not recommended for production):

1. Comment out the problematic imports in these files
2. Replace auth checks with temporary placeholders
3. Test locally with Clerk setup

## Or: Complete Manual Fix

The cleanest approach is to manually edit each file:
1. Open the file
2. Update imports to use `useUser` from `@clerk/nextjs`
3. Replace auth state checks with `isLoaded` and `isSignedIn`
4. Test the component

## Why This Happened

The integration hit file corruption issues when trying to do partial replacements on large complex files. The settings page was successfully migrated, but upload-related files are still using the old auth system.

## Next Steps

1. Add your Clerk API keys to `.env.local`
2. Manually update the 3 files above
3. Run `npm run build` to verify all TypeScript errors are resolved
4. Follow the `CLERK_SETUP_GUIDE.md` for dashboard configuration
