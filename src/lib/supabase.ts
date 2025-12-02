import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Server-side client with Clerk authentication
// Use this in Server Components and API routes
export async function createServerClient() {
  // Import auth only on server side to avoid webpack issues
  const { auth } = await import('@clerk/nextjs/server')
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      try {
        const { getToken } = await auth()
        // Get the Clerk session token without template - modern approach
        // Clerk will automatically add the required claims for Supabase RLS
        const token = await getToken()
        return token ?? null
      } catch (error) {
        console.error('[Supabase Server Client] Error getting token:', error)
        return null
      }
    },
  })
}

// Admin client for server-side operations
export const supabaseAdmin = (() => {
  // For development, if service role key is not available, use anon key with a warning
  if (!supabaseServiceRoleKey) {
    console.warn('[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not configured!')
    console.warn('[Supabase Admin] This will cause storage uploads and other admin operations to fail!')
    console.warn('[Supabase Admin] Please ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local')
    console.warn('[Supabase Admin] Falling back to anon key (this is only for development)')
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  console.log('[Supabase Admin] Service role key configured successfully')
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
})()

console.log('[Supabase] Server client configured with native Clerk integration')