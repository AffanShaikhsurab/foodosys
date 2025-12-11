import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

/**
 * Creates a Supabase client with Clerk authentication for server-side usage
 * This function should be used in Server Components, API routes, and Server Actions
 * Uses the modern Clerk-Supabase integration without deprecated JWT templates
 * 
 * @returns A SupabaseClient instance configured with Clerk authentication
 * 
 * @example
 * ```typescript
 * // In a Server Component
 * import { createServerSupabaseClient } from '@/lib/clerk-supabase-server'
 * 
 * export default async function MyServerComponent() {
 *   const supabase = createServerSupabaseClient()
 *   const { data, error } = await supabase.from('my_table').select()
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // In an API route
 * import { createServerSupabaseClient } from '@/lib/clerk-supabase-server'
 * 
 * export async function GET(request: Request) {
 *   const supabase = createServerSupabaseClient()
 *   const { data, error } = await supabase.from('my_table').select()
 *   return Response.json({ data, error })
 * }
 * ```
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
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
        console.error('[Clerk-Supabase-Server] Error getting token:', error)
        return null
      }
    },
  })
}

/**
 * Type definition for the Supabase client with Clerk authentication
 */
export type ClerkSupabaseClient = SupabaseClient

console.log('[Clerk-Supabase-Server] Server utility functions initialized')