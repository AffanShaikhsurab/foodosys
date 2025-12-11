'use client'

import { useState, useEffect } from 'react'

interface Location {
  latitude: number
  longitude: number
  error?: string
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Changed to false initially
  const [permissionRequested, setPermissionRequested] = useState(false)

  // Function to manually request location (call this on user interaction)
  const requestLocation = () => {
    console.log('Requesting location...')
    
    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported')
      setLocation({ 
        latitude: 0, 
        longitude: 0, 
        error: 'Geolocation is not supported by your browser' 
      })
      return
    }

    console.log('Setting loading state and requesting position...')
    setIsLoading(true)
    setPermissionRequested(true)
    setLocation(null) // Clear previous location
    getCurrentPosition()
  }

  // Auto-request location on mount (only for already granted permissions)
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return
    }

    // Check permission status first
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          // Permission already granted, get position
          requestLocation()
        }
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          if (result.state === 'granted') {
            requestLocation()
          }
        })
      }).catch(() => {
        // Fallback if permissions API is not supported - don't auto-request
        console.log('Permissions API not supported')
      })
    }
  }, [])

  function getCurrentPosition() {
    console.log('Calling navigator.geolocation.getCurrentPosition...')
    
    // Get current position - this will trigger the permission prompt if needed
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained:', position.coords.latitude, position.coords.longitude)
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        setIsLoading(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = 'Unknown error occurred'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Click to enable in browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.'
            break
        }
        
        setLocation({ 
          latitude: 0, 
          longitude: 0, 
          error: errorMessage 
        })
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // Allow cached position up to 5 minutes old
      }
    )
  }

  return { location, isLoading, permissionRequested, requestLocation }
}