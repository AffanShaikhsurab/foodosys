import { createClient } from '@supabase/supabase-js'
import { logSupabase, logger } from './logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug logging for environment variables
console.log('[Supabase Init] Environment check:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceRoleKey,
  urlValue: supabaseUrl?.substring(0, 30),
  serviceKeyPrefix: supabaseServiceRoleKey?.substring(0, 20),
  allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('supabase')).sort()
})

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

logSupabase('Supabase clients created successfully', {
  operation: 'supabase_clients_created',
  clientType: 'both',
  config: {
    autoRefreshToken: true,
    persistSession: true
  }
})