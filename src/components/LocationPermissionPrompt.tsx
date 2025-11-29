'use client'

import { useState, useEffect } from 'react'
import { useLocation } from '@/hooks/useLocation'

export default function LocationPermissionPrompt() {
  const { location, isLoading, permissionRequested, requestLocation } = useLocation()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Show prompt if permission hasn't been requested yet or if there's an error
    if (!permissionRequested && !location) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else if (location?.error) {
      setShowPrompt(true)
    } else {
      setShowPrompt(false)
    }
  }, [permissionRequested, location])

  const handleRequestLocation = () => {
    setShowPrompt(false)
    requestLocation()
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="location-permission-prompt">
      <div className="prompt-content">
        <h3>Enable Location Access</h3>
        <p>
          {location?.error ? 
            'There was an issue getting your location. Try again?' :
            'Please allow location access to see distances to restaurants'
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
      </div>
    </div>
  )
}