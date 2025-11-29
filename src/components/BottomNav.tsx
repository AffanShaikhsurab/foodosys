'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'

export default function BottomNav() {
  const [activeNav, setActiveNav] = useState('home')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        setIsAuthenticated(!!user)
        setUserEmail(user?.email || null)
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsAuthenticated(false)
      setUserEmail(null)
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }
  
  if (isLoading) {
    return (
      <div className="bottom-nav-container">
        <div className="bottom-nav">
          <div className="nav-item">
            <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
            <span className="nav-label">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bottom-nav-container">
      <div className="bottom-nav">
        <Link href="/" className={`nav-item ${activeNav === 'home' ? 'active' : ''}`} onClick={() => setActiveNav('home')}>
          <i className="ri-home-4-fill"></i>
          <span className="nav-label">Home</span>
        </Link>
        
        {/* Center "Upload" FAB */}
        {isAuthenticated ? (
          <Link href="/upload" className="nav-upload">
            <i className="ri-camera-fill"></i>
            <span className="nav-label">Scan</span>
          </Link>
        ) : (
          <Link href="/auth" className="nav-upload" style={{ backgroundColor: '#FEF3C7' }}>
            <i className="ri-lock-line" style={{ color: '#92400E' }}></i>
            <span className="nav-label" style={{ color: '#92400E' }}>Sign In</span>
          </Link>
        )}

        {isAuthenticated ? (
          <div className="nav-item" onClick={handleSignOut} style={{ cursor: 'pointer' }}>
            <i className="ri-logout-box-r-line"></i>
            <span className="nav-label">Sign Out</span>
          </div>
        ) : (
          <Link href="/auth" className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')}>
            <i className="ri-user-line"></i>
            <span className="nav-label">Profile</span>
          </Link>
        )}
      </div>
      
      {/* User Email Display */}
      {isAuthenticated && userEmail && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(44, 62, 46, 0.9)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '200px'
        }}>
          {userEmail}
        </div>
      )}
    </div>
  )
}