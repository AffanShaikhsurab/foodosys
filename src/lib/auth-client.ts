// Client-side auth utilities that don't import server-only modules

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, any>
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