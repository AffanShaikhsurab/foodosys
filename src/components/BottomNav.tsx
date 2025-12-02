'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { HomeRounded, PersonRounded, CameraAltRounded, LockRounded } from '@mui/icons-material'

export default function BottomNav() {
  const pathname = usePathname()
  const { isLoaded, isSignedIn, user } = useUser()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname?.startsWith(path)) return true
    return false
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
    <div className="bottom-nav-container">
      <div className="bottom-nav">
        <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <HomeRounded sx={{ fontSize: 28 }} />
          <span className="nav-label">Home</span>
        </Link>

        {/* Center "Upload" FAB */}
        {isSignedIn ? (
          <Link href="/upload" className="nav-upload">
            <CameraAltRounded sx={{ fontSize: 28 }} />
            <span className="nav-label">Scan</span>
          </Link>
        ) : (
          <Link href="/sign-in" className="nav-upload" style={{ backgroundColor: '#FEF3C7' }}>
            <LockRounded sx={{ fontSize: 24, color: '#92400E' }} />
            <span className="nav-label" style={{ color: '#92400E' }}>Sign In</span>
          </Link>
        )}

        {isSignedIn ? (
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
          <Link href="/sign-in" className={`nav-item ${isActive('/sign-in') ? 'active' : ''}`}>
            <PersonRounded sx={{ fontSize: 28 }} />
            <span className="nav-label">Profile</span>
          </Link>
        )}
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
  )
}