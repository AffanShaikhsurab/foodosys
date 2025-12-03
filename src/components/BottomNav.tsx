'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { HomeRounded, PersonRounded, CameraAltRounded } from '@mui/icons-material'
import ProfileSignupPopup from './ProfileSignupPopup'

export default function BottomNav() {
  const pathname = usePathname()
  const { isLoaded, isSignedIn, user } = useUser()
  const [showProfilePopup, setShowProfilePopup] = useState(false)

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname?.startsWith(path)) return true
    return false
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!isSignedIn) {
      e.preventDefault()
      setShowProfilePopup(true)
    }
  }

  if (!isLoaded) {
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
    <>
      <div className="bottom-nav-container">
        <div className="bottom-nav">
          <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <HomeRounded sx={{ fontSize: 28 }} />
            <span className="nav-label">Home</span>
          </Link>

          {/* Center "Upload" FAB - Always accessible now */}
          <Link href="/upload" className="nav-upload">
            <CameraAltRounded sx={{ fontSize: 28 }} />
            <span className="nav-label">Scan</span>
          </Link>

          <Link
            href={isSignedIn ? "/settings" : "#"}
            onClick={handleProfileClick}
            className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonRounded sx={{ fontSize: 28 }} />
              {/* Profile Count Badge - Only show if signed in */}
              {isSignedIn && (
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
              )}
            </div>
            <span className="nav-label">Profile</span>
          </Link>
        </div>

        {/* User Email Display */}
        {isSignedIn && user?.primaryEmailAddress && (
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
            {user.primaryEmailAddress.emailAddress}
          </div>
        )}
      </div>

      <ProfileSignupPopup
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
      />
    </>
  )
}