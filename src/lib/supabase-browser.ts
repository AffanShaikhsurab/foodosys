import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Browser client for client-side components
// Note: This client won't have Clerk auth context automatically
// For authenticated requests from client components, use createClerkSupabaseClient
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // We'll use Clerk for session management
        autoRefreshToken: false, // Clerk handles token refresh
    }
})

console.log('[Supabase Browser] Client configured')

// Create a Supabase client with Clerk authentication for client-side usage
export function createClerkSupabaseClient(session: any) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        async accessToken() {
            try {
                // Use getToken() without template - modern approach
                const token = await session?.getToken()
                return token ?? null
            } catch (error) {
                console.error('[Supabase Browser] Error getting token:', error)
                return null
            }
        },
    })
}

// Hook to create a Supabase client with Clerk authentication
export function useClerkSupabaseClient() {
    const { session } = useSession()
    
    return createClient(supabaseUrl, supabaseAnonKey, {
        async accessToken() {
            try {
                // Use getToken() without template - modern approach
                const token = await session?.getToken()
                return token ?? null
            } catch (error) {
                console.error('[Supabase Browser] Error getting token:', error)
                return null
            }
        },
    })
}
