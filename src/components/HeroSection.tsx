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
          <h2>3 Menus Live</h2>
          <p>8 food courts are currently open.</p>
        </div>
        {/* SVG Wave decoration */}
        <svg className="deco-line" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: 'absolute', bottom: '20px', right: '0', width: '100%', height: '40px', opacity: '0.3', zIndex: '1' }}>
          <path d="M0 10 Q 25 20 50 10 T 100 10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </section>
  )
}