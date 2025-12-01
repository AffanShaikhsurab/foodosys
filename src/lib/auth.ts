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

export async function signIn(email: string, password: string) {
  const startTime = Date.now()
  
  logAuth('Sign in attempt started', {
    operation: 'sign_in_start',
    email: email.replace(/(.{2}).*(@.*)/, '$1***$2') // Partially mask email for logging
  })
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      const processingTime = Date.now() - startTime
      
      logAuth('Sign in failed - Supabase error', {
        operation: 'sign_in_failed',
        processingTime,
        errorCode: error.name || 'unknown',
        errorMessage: error.message
      })
      
      throw error
    }
    
    const processingTime = Date.now() - startTime
    logAuth('Sign in completed successfully', {
      operation: 'sign_in_success',
      userId: data.user?.id,
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      processingTime
    })
    
    return data
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    logAuth('Sign in error - exception', {
      operation: 'sign_in_exception',
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    console.error('Sign in error:', error)
    throw error
  }
}

export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export async function createProfile(userId: string, displayName: string, avatarUrl?: string) {
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create profile')
    }

    const data = await response.json()
    return data.profile
  } catch (error) {
    console.error('Profile creation error:', error)
    throw error
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
  try {
    const profile = await getUserProfile()
    return profile?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}