import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

/**
 * Creates a Supabase client with Clerk authentication for client-side usage
 * This function should be used in Client Components
 * 
 * @param session - The Clerk session object (optional, will use current session if not provided)
 * @returns A SupabaseClient instance configured with Clerk authentication
 * 
 * @example
 * ```typescript
 * 'use client'
 * import { createClientSupabaseClient } from '@/lib/clerk-supabase'
 * import { useSession } from '@clerk/nextjs'
 * 
 * export default function MyClientComponent() {
 *   const { session } = useSession()
 *   const supabase = createClientSupabaseClient(session)
 *   
 *   const fetchData = async () => {
 *     const { data, error } = await supabase.from('my_table').select()
 *     console.log(data, error)
 *   }
 *   
 *   return <button onClick={fetchData}>Fetch Data</button>
 * }
 * ```
 */
export function createClientSupabaseClient(session?: any): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      if (session) {
        return session.getToken() ?? null
      }
      // If no session provided, try to get the current session
      // This works in client components where Clerk is initialized
      try {
        const clerkSession = await (window as any).Clerk?.session?.getToken()
        return clerkSession ?? null
      } catch {
        return null
      }
    },
  })
}

/**
 * React hook for creating a Supabase client with Clerk authentication
 * This is the recommended way to use Supabase in Client Components
 * 
 * @returns A SupabaseClient instance configured with Clerk authentication
 * 
 * @example
 * ```typescript
 * 'use client'
 * import { useClerkSupabaseClient } from '@/lib/clerk-supabase'
 * import { useEffect, useState } from 'react'
 * 
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient()
 *   const [data, setData] = useState(null)
 *   
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const { data, error } = await supabase.from('my_table').select()
 *       setData(data)
 *     }
 *     
 *     fetchData()
 *   }, [supabase])
 *   
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 */
export function useClerkSupabaseClient(): SupabaseClient {
  const { session } = useSession()
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return session?.getToken() ?? null
    },
  })
}

/**
 * Creates a Supabase client with a custom Clerk token
 * Useful when you have a token from a custom source
 * 
 * @param token - The Clerk session token
 * @returns A SupabaseClient instance configured with the provided token
 * 
 * @example
 * ```typescript
 * import { createSupabaseClientWithToken } from '@/lib/clerk-supabase'
 * 
 * // With a custom token
 * const supabase = createSupabaseClientWithToken('your_clerk_token_here')
 * ```
 */
export function createSupabaseClientWithToken(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return token
    },
  })
}

/**
 * Type definition for the Supabase client with Clerk authentication
 */
export type ClerkSupabaseClient = SupabaseClient

console.log('[Clerk-Supabase] Utility functions initialized')