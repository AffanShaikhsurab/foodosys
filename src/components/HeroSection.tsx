'use client'

import { useState, useEffect } from 'react'

interface HeroSectionProps {
  location: any
  isLoading: boolean
  requestLocation: () => void
}

export default function HeroSection({ location, isLoading, requestLocation }: HeroSectionProps) {
  const [locationText, setLocationText] = useState('Getting location...')

  useEffect(() => {
    if (location && !location.error) {
      setLocationText('Current Location')
    } else if (location?.error) {
      if (location.error.includes('permission denied')) {
        setLocationText('Location disabled')
      } else {
        setLocationText('Location unavailable')
      }
    } else {
      setLocationText('Detecting location...')
    }
  }, [location])

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ restaurantCount: 0, menuCount: 0 })
  const { restaurantCount, menuCount } = stats

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/restaurants')
        const data = await response.json()
        if (data.restaurants) {
          setStats({
            restaurantCount: data.restaurants.length,
            menuCount: data.restaurants.length
          })
        }
      } catch (e) {
        console.error('Error fetching stats:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const handleLocationClick = () => {
    // If location was previously denied, show instructions
    if (location?.error && location.error.includes('permission denied')) {
      alert('To enable location:\n\n1. Click the lock/icon in your browser address bar\n2. Change location permission to "Allow"\n3. Refresh the page')
    } else {
      requestLocation()
    }
  }

  return (
    <section className="hero-section">
      {/* Location Bar */}
      <div className="location-bar" onClick={handleLocationClick}>
        <div className="location-icon">
          <i className="ri-map-pin-line"></i>
        </div>
        <div className="location-text">
          <div className="location-label">Deliver to</div>
          <div className={`location-value ${location?.error && location.error.includes('permission denied') ? 'disabled' : ''}`}>
            {isLoading ? (
              <span className="location-loading">
                <i className="ri-loader-4-line animate-spin"></i>
                Detecting location...
              </span>
            ) : (
              <>
                {location?.error && location.error.includes('permission denied') && (
                  <i className="ri-error-warning-line" style={{ marginRight: '6px' }}></i>
                )}
                {locationText}
              </>
            )}
          </div>
        </div>
        <div className="location-arrow">
          <i className="ri-arrow-down-s-line"></i>
        </div>
      </div>

      <div className="status-card">
        <div className="status-header">
          <span className="status-pill">Live Updates</span>
          <i className="ri-restaurant-2-line" style={{ fontSize: '20px', opacity: '0.8' }}></i>
        </div>
        <div className="status-main">
          {loading ? (
            <>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                Loading...
              </h2>
              <p style={{ opacity: '0.85', fontSize: '15px' }}>Fetching menu data...</p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                {menuCount} Menu{menuCount !== 1 ? 's' : ''} Live
              </h2>
              <p style={{ opacity: '0.85', fontSize: '15px', lineHeight: '1.5' }}>
                {restaurantCount} food court{restaurantCount !== 1 ? 's' : ''} available.
              </p>
            </>
          )}
        </div>
        {/* SVG Wave decoration */}
        <svg className="deco-line" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: 'absolute', bottom: '20px', right: '0', width: '100%', height: '40px', opacity: '0.3', zIndex: '1' }}>
          <path d="M0 10 Q 25 20 50 10 T 100 10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </section>
  )
}
