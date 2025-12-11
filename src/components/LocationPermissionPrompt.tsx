'use client'

import { useState, useEffect } from 'react'
import { useLocation } from '@/hooks/useLocation'

export default function LocationPermissionPrompt() {
  const { location, isLoading, requestLocation } = useLocation()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Show prompt if location is not available and hasn't been dismissed
    if (!isDismissed && !location && !isLoading) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 1500) // Show after 1.5 seconds

      return () => clearTimeout(timer)
    } else if (!isDismissed && location?.error) {
      setShowPrompt(true)
    } else if (location && !location.error) {
      setShowPrompt(false)
      // Dispatch event to let TourProvider know location permission was granted
      window.dispatchEvent(new CustomEvent('locationPermissionResolved'))
    }
  }, [location, isLoading, isDismissed])

  const handleRequestLocation = () => {
    requestLocation()
    // Dispatch event to let TourProvider know location permission was handled
    window.dispatchEvent(new CustomEvent('locationPermissionResolved'))
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setIsDismissed(true)
    // Dispatch event to let TourProvider know location permission was handled
    window.dispatchEvent(new CustomEvent('locationPermissionResolved'))
  }

  if (!showPrompt) {
    return null
  }

  return (
    <>
      <div className="location-prompt-overlay" onClick={handleDismiss}></div>
      <div className="location-permission-popup">
        <button className="popup-close click-active" onClick={handleDismiss}>
          <i className="ri-close-line"></i>
        </button>
        <div className="popup-icon-container">
          <div className="popup-icon">
            <i className="ri-map-pin-line"></i>
          </div>
          {/* Ripple rings */}
          <div className="popup-ripple"></div>
          <div className="popup-ripple delay-1"></div>
        </div>
        <h3>Enable Location</h3>
        <p>
          {location?.error ?
            'Please allow location access to see walking distances to each food court.' :
            'Allow location access so you can see how far you are from each food court.'
          }
        </p>
        <button
          className="popup-btn-primary click-active"
          onClick={handleRequestLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
              Getting Location...
            </>
          ) : (
            <>
              <i className="ri-map-pin-line"></i>
              Allow Location
            </>
          )}
        </button>
        <button
          className="popup-btn-secondary click-active"
          onClick={handleDismiss}
        >
          Maybe Later
        </button>
        {location?.error && (
          <p className="popup-error">
            <i className="ri-error-warning-line"></i>
            {location.error}
          </p>
        )}
      </div>
    </>
  )
}