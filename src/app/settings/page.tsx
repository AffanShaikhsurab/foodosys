'use client'

import { useState, useEffect } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import BottomNav from '@/components/BottomNav'
import { useRouter } from 'next/navigation'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  role: string
  base_location?: string
  dietary_preference?: string
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

  const { user, isLoaded } = useUser()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check authentication
        if (!user) {
          setLoading(false)
          // Don't redirect to auth page, allow anonymous users to see the sign-up prompt
          return
        }

        // Fetch user profile from API
        const profileResponse = await fetch('/api/profile')

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            // Profile doesn't exist, redirect to onboarding
            router.push('/onboarding')
            return
          }
          throw new Error('Failed to fetch profile')
        }

        const { profile } = await profileResponse.json()
        setUserProfile(profile)

        // Fetch user stats from API
        try {
          const contributionsResponse = await fetch('/api/contributions')
          if (contributionsResponse.ok) {
            const { contributions } = await contributionsResponse.json()
            const uploads = contributions?.filter((c: any) => c.contribution_type === 'upload').length || 0
            const helps = contributions?.length || 0

            // Get user rank from leaderboard
            const leaderboardResponse = await fetch('/api/leaderboard')
            if (leaderboardResponse.ok) {
              const { leaderboard } = await leaderboardResponse.json()
              const userEntry = leaderboard?.find((entry: any) => entry.user_id === profile.id)
              const rank = userEntry?.rank_position || 0
              setUserStats({ uploads, helps, rank })
            }
          }
        } catch (error) {
          console.error('Error fetching stats:', error)
          // Use default stats if API calls fail
          setUserStats({ uploads: 0, helps: 0, rank: 0 })
        }

        // Fetch user badges
        try {
          const badgesResponse = await fetch('/api/badges')
          if (badgesResponse.ok) {
            const { badges } = await badgesResponse.json()
            setUserBadges(badges || [])
          }
        } catch (error) {
          console.error('Error fetching badges:', error)
          setUserBadges([])
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        router.push('/onboarding')
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded) {
      fetchUserData()
    }
  }, [user, isLoaded, router])

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
        <div className="lottie-loading-container">
          <DotLottieReact
            src="/dance-cat.lottie"
            loop
            autoplay
            style={{ width: '200px', height: '200px' }}
          />
          <p className="loading-text">Loading your profile...</p>
        </div>
        <BottomNav />
      </>
    )
  }

  if (!userProfile) {
    return (
      <>
        {/* Profile Header for Anonymous */}
        <header className="profile-header">
          <a href="#" className="settings-btn"><i className="ri-settings-4-line"></i></a>

          <div className="avatar-container">
            <div className="avatar" style={{
              background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="ri-user-3-line" style={{ fontSize: '40px', color: '#889287' }}></i>
            </div>
            <div className="level-badge">?</div>
          </div>

          <h1 className="user-name">Anonymous User</h1>
          <div className="user-meta">
            <span>Guest</span>
          </div>
        </header>

        {/* Anonymous User Prompt */}
        <section className="karma-card">
          <div className="karma-top">
            <div>
              <span className="karma-score">0</span>
              <span className="karma-label">Karma Points</span>
            </div>
            <div className="rank-title">Guest</div>
          </div>
          <p className="impact-text">Sign up to track your contributions and join the community! 🚀</p>
        </section>

        {/* Benefits of Signing Up */}
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <div style={{
            background: 'rgba(220, 235, 102, 0.15)',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid rgba(220, 235, 102, 0.3)'
          }}>
            <h3 style={{ fontWeight: '600', marginBottom: '16px', color: 'var(--primary-dark)' }}>Why sign up?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <i className="ri-trophy-line" style={{ color: 'var(--primary-dark)', fontSize: '20px', marginTop: '2px' }}></i>
                <div>
                  <div style={{ fontWeight: '600' }}>Get Karma Points</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Earn points for each upload and climb the leaderboard</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <i className="ri-medal-line" style={{ color: 'var(--primary-dark)', fontSize: '20px', marginTop: '2px' }}></i>
                <div>
                  <div style={{ fontWeight: '600' }}>Unlock Achievements</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Collect badges as you contribute to the community</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <i className="ri-user-star-line" style={{ color: 'var(--primary-dark)', fontSize: '20px', marginTop: '2px' }}></i>
                <div>
                  <div style={{ fontWeight: '600' }}>Get Recognition</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Your name will appear on your contributions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Up Button */}
        <div style={{ padding: '0 20px', marginBottom: '100px' }}>
          <button
            onClick={() => router.push('/auth')}
            style={{
              width: '100%',
              background: 'var(--primary-dark)',
              color: 'white',
              padding: '16px',
              borderRadius: '999px',
              fontWeight: '600',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(44, 62, 46, 0.25)'
            }}
          >
            Sign Up Now
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Continue as Anonymous
            </button>
          </div>
        </div>

        <BottomNav />
      </>
    )
  }

  return (
    <>
      {/* Profile Header */}
      <header className="profile-header">
        <a href="#" className="settings-btn"><i className="ri-settings-4-line"></i></a>

        <div className="avatar-container">
          <img
            src={userProfile.avatar_url || "https://randomuser.me/api/portraits/men/86.jpg"}
            className="avatar"
            alt="Profile"
          />
          <div className="level-badge">{userProfile.level}</div>
        </div>

        <h1 className="user-name">{userProfile.display_name}</h1>
        <div className="user-meta">
          <span>{userProfile.role === 'admin' ? 'Admin' : `${userProfile.role || 'Trainee'} • ${userProfile.base_location || 'GEC 2'}`}</span>
        </div>

        {userProfile.role === 'admin' && (
          <div className="admin-tag">
            <i className="ri-shield-star-fill"></i> Admin
          </div>
        )}

        {userProfile.dietary_preference && (
          <div className="diet-tag">
            <div className="leaf"></div>
            {userProfile.dietary_preference.charAt(0).toUpperCase() + userProfile.dietary_preference.slice(1)}
          </div>
        )}
      </header>

      {/* The Karma Passport */}
      <section className="karma-card">
        <div className="karma-top">
          <div>
            <span className="karma-score">{userProfile.karma_points.toLocaleString()}</span>
            <span className="karma-label">Karma Points</span>
          </div>
          <div className="rank-title">{getLevelName()}</div>
        </div>

        <p className="impact-text">You&apos;ve saved ~{Math.round(userProfile.karma_points / 10)} pairs of legs from walking unnecessarily. Keep it up! 🏃‍♂️</p>

        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
        </div>
        <div className="progress-text">
          <span>Level {userProfile.level}</span>
          <span>{getPointsToNextLevel()} to Level {Math.min(userProfile.level + 1, 5)}</span>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-icon"><i className="ri-upload-cloud-2-line"></i></div>
          <span className="stat-value">{userStats.uploads}</span>
          <span className="stat-label">Uploads</span>
        </div>
        <div className="stat-box">
          <div className="stat-icon"><i className="ri-thumb-up-line"></i></div>
          <span className="stat-value">{userStats.helps}</span>
          <span className="stat-label">Helps</span>
        </div>
        <div className="stat-box">
          <div className="stat-icon"><i className="ri-trophy-line"></i></div>
          <span className="stat-value">#{userStats.rank || '-'}</span>
          <span className="stat-label">Rank</span>
        </div>
      </div>

      {/* Badges Section */}
      <div className="section-title">
        Badges
        <span className="see-all">View All</span>
      </div>
      <div className="badge-scroll">
        {userBadges.length > 0 ? (
          userBadges.map((badge, index) => (
            <div key={index} className="badge-item">
              <div className="badge-icon">{badge.badge_icon.includes('ri-') ? <i className={badge.badge_icon}></i> : badge.badge_icon}</div>
              <span className="badge-name">{badge.badge_name}</span>
            </div>
          ))
        ) : (
          <div className="badge-item">
            <div className="badge-icon">🐣</div>
            <span className="badge-name">Early Bird</span>
            <span className="badge-desc">First Upload</span>
          </div>
        )}

        {/* Locked badges preview */}
        <div className="badge-item locked">
          <div className="badge-icon">📸</div>
          <span className="badge-name">Shutterbug</span>
          <span className="badge-desc">Upload 10 Menus</span>
        </div>

        <div className="badge-item locked">
          <div className="badge-icon">🌟</div>
          <span className="badge-name">Local Hero</span>
          <span className="badge-desc">50 Helpful Votes</span>
        </div>
      </div>

      {/* Preferences Menu */}
      <div className="section-title" style={{ marginTop: '20px' }}>Preferences</div>
      <div className="menu-list">
        <a href="#" className="menu-row">
          <i className="ri-user-settings-line"></i>
          Edit Profile
          <i className="ri-arrow-right-s-line arrow"></i>
        </a>
        <a href="#" className="menu-row">
          <i className="ri-moon-line"></i>
          Appearance
          <i className="ri-arrow-right-s-line arrow"></i>
        </a>
        <a href="#" className="menu-row logout-row" onClick={handleSignOut}>
          <i className="ri-logout-box-r-line"></i>
          Log Out
          <i className="ri-arrow-right-s-line arrow"></i>
        </a>
      </div>

      <BottomNav />
    </>
  )
}