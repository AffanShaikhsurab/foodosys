'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import ProfileSignupPopup from './ProfileSignupPopup'
import QRScanner from './QRScanner'
import { useLocation } from '@/hooks/useLocation'
import { useDistance } from '@/hooks/useDistance'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isNearRestaurant, setIsNearRestaurant] = useState(false)
  const [restaurants, setRestaurants] = useState<any[]>([])

  const { location } = useLocation()
  const { calculateDistance } = useDistance()

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('/api/restaurants')
        const data = await response.json()
        if (data.restaurants) {
          setRestaurants(data.restaurants)
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      }
    }
    fetchRestaurants()
  }, [])

  // Check if user is near any restaurant (< 40m)
  useEffect(() => {
    if (location && !location.error && restaurants.length > 0) {
      const nearbyRestaurant = restaurants.some(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          const distance = calculateDistance(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: restaurant.latitude, longitude: restaurant.longitude }
          )
          return distance < 40 // 40 meters threshold
        }
        return false
      })
      setIsNearRestaurant(nearbyRestaurant)
    }
  }, [location, restaurants, calculateDistance])

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

  const handleScanClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (isNearRestaurant) {
      // User is near a restaurant - show QR scanner with animation
      setIsScanning(true)
      setTimeout(() => {
        setShowQRScanner(true)
      }, 400) // Delay to allow button expansion animation
    } else {
      // User is not near any restaurant - navigate to upload page
      router.push('/upload')
    }
  }

  const handleCloseScanner = () => {
    setShowQRScanner(false)
    setTimeout(() => {
      setIsScanning(false)
    }, 300)
  }

  if (!isLoaded) {
    return (
      <div className="dock-container">
        <nav className="floating-dock">
          <div className="nav-item">
            <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite', fontSize: '24px' }}></i>
            <span>Loading...</span>
          </div>
        </nav>
      </div>
    )
  }

  return (
    <>
      <div className={`dock-container ${isScanning ? 'hidden' : ''}`}>
        <nav className="floating-dock">
          {/* Home */}
          <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <i className={`ri-home-4-${isActive('/') ? 'fill' : 'line'}`}></i>
            <span>Home</span>
          </Link>

          {/* SCAN FAB - Center Button with Smart Logic */}
          <div
            className={`dock-fab step-scan-button ${isScanning ? 'scanning' : ''}`}
            onClick={handleScanClick}
          >
            <i className="ri-qr-scan-2-line"></i>
            <span>Scan</span>
          </div>

          {/* Profile / Me */}
          <Link
            href={isSignedIn ? "/settings" : "#"}
            onClick={handleProfileClick}
            className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ri-user-smile-${isActive('/settings') ? 'fill' : 'line'}`}></i>
              {/* Signed in indicator dot */}
              {isSignedIn && (
                <span className="signed-in-dot"></span>
              )}
            </div>
            <span>Me</span>
          </Link>
        </nav>
      </div>

      <QRScanner isOpen={showQRScanner} onClose={handleCloseScanner} />

      <ProfileSignupPopup
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
      />
    </>
  )
}