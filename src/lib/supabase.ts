import { createClient } from '@supabase/supabase-js'
import { logSupabase, logger } from './logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

logSupabase('Supabase clients initialized', {
  operation: 'supabase_init',
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceRoleKey,
  urlPrefix: supabaseUrl?.substring(0, 20) + '...'
})

// Create a singleton instance for the browser to prevent multiple instances
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })
  
  return supabaseInstance
})()

// Admin client for server-side operations
export const supabaseAdmin = (() => {
  // For development, if service role key is not available, use anon key with a warning
  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not configured. Using anon key for admin operations. This should be fixed in production.')
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
})()

logSupabase('Supabase clients created successfully', {
  operation: 'supabase_clients_created',
  clientType: 'both',
  config: {
    autoRefreshToken: true,
    persistSession: true
  }
})