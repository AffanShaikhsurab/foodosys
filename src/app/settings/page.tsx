'use client'

import { useState, useEffect } from 'react'
import { useClerkSupabaseClient } from '@/lib/clerk-supabase'
import { createProfile } from '@/lib/auth-client'
import { useClerk, useUser } from '@clerk/nextjs'
import BottomNav from '@/components/BottomNav'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  role: string
  karma_points: number
  level: number
}

interface UserStats {
  uploads: number
  helps: number
  rank: number
}

interface UserBadge {
  badge_name: string
  badge_icon: string
  badge_color: string
  earned_at: string
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({ uploads: 0, helps: 0, rank: 0 })
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Use the Clerk-integrated Supabase client for authenticated requests
  const authenticatedSupabase = useClerkSupabaseClient()
  // Get the current user from Clerk
  const { user } = useUser()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user from Clerk
        if (!user) {
          setLoading(false)
          router.push('/auth')
          return
        }
        
        // Convert Clerk user to our AuthUser format
        const authUser = {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          user_metadata: {
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          },
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await authenticatedSupabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          throw profileError
        }

        if (!profile) {
          // If profile doesn't exist, create a default one
          const displayName = authUser.user_metadata?.fullName || authUser.email?.split('@')[0] || 'User'
          const newProfile = await createProfile(authUser.id, displayName)
          
          if (newProfile) {
            setUserProfile(newProfile)
            setUserStats({ uploads: 0, helps: 0, rank: 0 })
            setUserBadges([])
            setLoading(false)
            return
          }
        }

        // Fetch user stats
        const { data: contributions, error: contributionsError } = await authenticatedSupabase
          .from('daily_contributions')
          .select('*')
          .eq('user_id', (profile as { id: string }).id)

        if (contributionsError) throw contributionsError

        // Calculate stats
        const uploads = (contributions as any[])?.filter((c: any) => c.contribution_type === 'upload').length || 0
        const helps = (contributions as any[])?.length || 0

        // Get user rank from leaderboard
        const { data: leaderboardData, error: leaderboardError } = await authenticatedSupabase
          .from('leaderboard')
          .select('rank_position')
          .eq('user_id', (profile as { id: string }).id)
          .single()

        if (leaderboardError && leaderboardError.code !== 'PGRST116') throw leaderboardError

        const rank = (leaderboardData as any)?.rank_position || 0

        // Fetch user badges
        const { data: badges, error: badgesError } = await authenticatedSupabase
          .from('user_badges')
          .select('*')
          .eq('user_id', (profile as { id: string }).id)

        if (badgesError) throw badgesError

        setUserProfile(profile)
        setUserStats({ uploads, helps, rank })
        setUserBadges(badges || [])
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const getLevelIcon = () => {
    if (!userProfile) return 'ri-medal-fill'
    
    switch (userProfile.level) {
      case 5: return 'ri-vip-crown-fill'
      case 4: return 'ri-trophy-fill'
      case 3: return 'ri-medal-fill'
      case 2: return 'ri-award-fill'
      default: return 'ri-medal-fill'
    }
  }

  const getNextLevelPoints = () => {
    if (!userProfile) return 0
    
    switch (userProfile.level) {
      case 1: return 500
      case 2: return 1000
      case 3: return 1500
      case 4: return 2000
      case 5: return 2000 // Max level
      default: return 500
    }
  }

  const getProgressPercentage = () => {
    if (!userProfile) return 0
    
    const currentLevelMin = userProfile.level <= 1 ? 0 : 
                          userProfile.level <= 2 ? 500 :
                          userProfile.level <= 3 ? 1000 :
                          userProfile.level <= 4 ? 1500 : 2000
                          
    const nextLevelPoints = getNextLevelPoints()
    const pointsInCurrentLevel = userProfile.karma_points - currentLevelMin
    const pointsNeededForNextLevel = nextLevelPoints - currentLevelMin
    
    if (userProfile.level >= 5) return 100
    return Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100))
  }

  const getLevelName = () => {
    if (!userProfile) return 'Beginner'
    
    switch (userProfile.level) {
      case 5: return 'Mess Legend'
      case 4: return 'Food Expert'
      case 3: return 'Regular'
      case 2: return 'Contributor'
      default: return 'Beginner'
    }
  }

  const getPointsToNextLevel = () => {
    if (!userProfile) return 0
    
    const nextLevelPoints = getNextLevelPoints()
    return Math.max(0, nextLevelPoints - userProfile.karma_points)
  }

  const { signOut } = useClerk()
  
  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <>
        <div className="p-4 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </>
    )
  }

  if (!userProfile) {
    return (
      <>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <p>Please log in to view your profile.</p>
        </div>
        <BottomNav />
      </>
    )
  }

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <button className="icon-btn">
          <i className="ri-arrow-left-line"></i>
        </button>
        <button className="icon-btn">
          <i className="ri-settings-4-line"></i>
        </button>
      </div>

      {/* Hero Section */}
      <div className="profile-hero">
        <div className="avatar-container">
          <img 
            src={userProfile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"} 
            className="avatar" 
            alt="User Photo"
          />
          <div className="level-badge">
            <i className={getLevelIcon()}></i>
          </div>
        </div>
        <h2 className="user-name">{userProfile.display_name}</h2>
        <div className="user-handle">{userProfile.role} • Batch 2025</div>
      </div>

      {/* Points / Karma Card */}
      <div className="impact-card">
        <div className="impact-bg"></div>
        
        <div className="points-row">
          <span className="points-val">{userProfile.karma_points.toLocaleString()}</span>
          <span className="points-label">Karma</span>
        </div>
        <div className="impact-subtitle">You saved approx. {Math.round(userProfile.karma_points / 10)}km of walking for others!</div>

        {/* Progress to next level */}
        <div className="progress-label">
          <span>{getLevelName()}</span>
          <span>{getPointsToNextLevel()} to go</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-val">{userStats.uploads}</div>
          <div className="stat-label">Uploads</div>
        </div>
        <div className="stat-item">
          <div className="stat-val">{userStats.helps}</div>
          <div className="stat-label">Helps</div>
        </div>
        <div className="stat-item">
          <div className="stat-val">#{userStats.rank || '-'}</div>
          <div className="stat-label">Rank</div>
        </div>
      </div>

      {/* Badges Scroller */}
      <div className="section-title">Achievements</div>
      <div className="badges-scroll">
        {userBadges.length > 0 ? (
          userBadges.map((badge, index) => (
            <div key={index} className="badge-card">
              <div className="badge-icon" style={{ background: badge.badge_color + '20', color: badge.badge_color }}>
                <i className={badge.badge_icon}></i>
              </div>
              <span className="badge-name">{badge.badge_name}</span>
            </div>
          ))
        ) : (
          <div className="badge-card">
            <div className="badge-icon locked">
              <i className="ri-lock-fill"></i>
            </div>
            <span className="badge-name">No badges yet</span>
          </div>
        )}
        
        {/* Locked badges for preview */}
        <div className="badge-card">
          <div className="badge-icon locked">
            <i className="ri-trophy-fill"></i>
          </div>
          <span className="badge-name">Top 3</span>
        </div>
        <div className="badge-card">
          <div className="badge-icon locked">
            <i className="ri-map-pin-user-fill"></i>
          </div>
          <span className="badge-name">Explorer</span>
        </div>
      </div>

      {/* Profile Actions */}
      <div className="section-title" style={{ marginTop: '12px' }}>Account</div>
      <div className="menu-list">
        <a href="#" className="menu-item">
          <div className="menu-left">
            <i className="ri-history-line menu-icon"></i> Upload History
          </div>
          <i className="ri-arrow-right-s-line" style={{ color: '#ccc' }}></i>
        </a>
        <a href="#" className="menu-item">
          <div className="menu-left">
            <i className="ri-notification-3-line menu-icon"></i> Notifications
          </div>
          <i className="ri-arrow-right-s-line" style={{ color: '#ccc' }}></i>
        </a>
        <a href="#" className="menu-item" onClick={handleSignOut}>
          <div className="menu-left">
            <i className="ri-logout-box-r-line menu-icon" style={{ color: '#FF8A80' }}></i> 
            <span style={{ color: '#FF8A80' }}>Log Out</span>
          </div>
        </a>
      </div>

      <BottomNav />
    </>
  )
}