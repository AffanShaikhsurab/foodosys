'use client'

import { useState, useEffect } from 'react'
import { useLocation } from '@/hooks/useLocation'

export default function Header() {
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const { location, isLoading, requestLocation } = useLocation()

  useEffect(() => {
    // Show success toast when location is obtained
    if (location && !location.error && !isLoading) {
      setShowSuccessToast(true)
      const timer = setTimeout(() => {
        setShowSuccessToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [location, isLoading])

  const handleLocationClick = () => {
    console.log('Location button clicked')
    console.log('Current location state:', location)
    
    // Always trigger location request when clicked
    console.log('Calling requestLocation...')
    requestLocation()
  }

  const handleRequestLocation = () => {
    console.log('Requesting location from prompt...')
    setShowLocationPrompt(false)
    requestLocation()
  }

  const getLocationIcon = () => {
    if (isLoading) {
      return 'ri-loader-4-line' // Loading spinner when fetching location
    }
    if (location && !location.error) {
      return 'ri-map-pin-fill' // Filled when location is available
    }
    return 'ri-map-pin-line' // Outline when no location
  }

  const getLocationButtonClass = () => {
    if (location && !location.error) {
      return 'location-btn location-enabled'
    }
    return 'location-btn'
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="user-avatar">
            <i className="ri-user-smile-line"></i>
          </div>
        </div>
        <div className="header-right">
          {isLoading && (
            <div className="location-status">
              <span className="location-loading">Getting location...</span>
            </div>
          )}
          <button 
            className={getLocationButtonClass()}
            onClick={handleLocationClick}
            disabled={isLoading}
            title={location && !location.error ? 'Location enabled' : 'Enable location access'}
          >
            <i className={`${getLocationIcon()} ${isLoading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      </header>

      {showLocationPrompt && (
        <div className="location-permission-prompt">
          <div className="prompt-content">
            <h3>Enable Location Access</h3>
            <p>
              {location?.error ? 
                'There was an issue getting your location. Try again?' :
                'Allow location access to see distances to restaurants'
              }
            </p>
            <div className="prompt-icon">
              <i className="ri-map-pin-line"></i>
            </div>
            <button 
              className="location-request-btn"
              onClick={handleRequestLocation}
              disabled={isLoading}
            >
              {isLoading ? 'Getting Location...' : 'Allow Location Access'}
            </button>
            {location?.error && (
              <p className="error-details">{location.error}</p>
            )}
            <button 
              className="prompt-cancel-btn"
              onClick={() => setShowLocationPrompt(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showSuccessToast && (
      <div className="location-toast">
        <i className="ri-check-line"></i>
        <span>Location enabled! Showing distances.</span>
      </div>
    )}
    </>
  )
}