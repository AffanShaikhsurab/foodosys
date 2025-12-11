import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from './clerk-supabase-server'

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, any>
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const user = await currentUser()

    if (!user) return null

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      user_metadata: {
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      },
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Note: signIn, signUp, and signOut are now handled by Clerk UI components
// Users will use Clerk's <SignIn />, <SignUp />, and <UserButton /> components

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

    const supabase = await createServerSupabaseClient()
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