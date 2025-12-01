import { supabase } from './supabase'
import { logAuth, logger } from './logger'

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, any>
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const startTime = Date.now()
  
  logAuth('Getting current user', {
    operation: 'get_current_user_start'
  })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const processingTime = Date.now() - startTime
    
    logAuth('Current user retrieved successfully', {
      operation: 'get_current_user_success',
      userId: user?.id || 'none',
      hasUser: !!user,
      processingTime
    })
    
    return user
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    logAuth('Error getting current user', {
      operation: 'get_current_user_error',
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getUserProfile(userId?: string): Promise<any | null> {
  try {
    const user = userId ? { id: userId } : await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('[DEBUG] User profile query result:', { data, error, userId: user.id })

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

export async function isAdmin(): Promise<boolean> {
  console.log('[DEBUG] isAdmin() function called')
  
  try {
    const profile = await getUserProfile()
    console.log('[DEBUG] Profile result:', profile)
    
    const isAdminUser = profile?.role === 'admin'
    console.log('[DEBUG] Admin check result:', { 
      role: profile?.role, 
      isAdmin: isAdminUser,
      profileExists: !!profile 
    })
    
    return isAdminUser
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}