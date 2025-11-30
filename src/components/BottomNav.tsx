'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { HomeRounded, PersonRounded, CameraAltRounded, LockRounded } from '@mui/icons-material'

export default function BottomNav() {
  const pathname = usePathname()
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

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname?.startsWith(path)) return true
    return false
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
        <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HomeRounded sx={{ fontSize: 28 }} />
            {/* Home Count Badge */}
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#FF8A80',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              height: '16px',
              width: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--primary-dark)',
              zIndex: 10
            }}>3</span>
          </div>
          <span className="nav-label">Home</span>
        </Link>

        {/* Center "Upload" FAB */}
        {isAuthenticated ? (
          <Link href="/upload" className="nav-upload">
            <CameraAltRounded sx={{ fontSize: 28 }} />
            <span className="nav-label">Scan</span>
          </Link>
        ) : (
          <Link href="/auth" className="nav-upload" style={{ backgroundColor: '#FEF3C7' }}>
            <LockRounded sx={{ fontSize: 24, color: '#92400E' }} />
            <span className="nav-label" style={{ color: '#92400E' }}>Sign In</span>
          </Link>
        )}

        {isAuthenticated ? (
          <Link href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonRounded sx={{ fontSize: 28 }} />
              {/* Profile Count Badge */}
              <span style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                backgroundColor: '#DCEB66',
                height: '8px',
                width: '8px',
                borderRadius: '50%',
                border: '1px solid var(--primary-dark)',
                zIndex: 10
              }}></span>
            </div>
            <span className="nav-label">Profile</span>
          </Link>
        ) : (
          <Link href="/auth" className={`nav-item ${isActive('/auth') ? 'active' : ''}`}>
            <PersonRounded sx={{ fontSize: 28 }} />
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