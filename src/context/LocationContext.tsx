'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Location {
  latitude: number
  longitude: number
  error?: string
}

interface LocationContextType {
  location: Location | null
  isLoading: boolean
  permissionRequested: boolean
  requestLocation: () => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)

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
    // Don't clear location immediately to avoid UI flickering if we're just refreshing
    // setLocation(null)
    getCurrentPosition()
  }

  function getCurrentPosition() {
    console.log('Calling navigator.geolocation.getCurrentPosition...')

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

  // Auto-request location on mount (only for already granted permissions)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
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
        console.log('Permissions API not supported')
      })
    }
  }, [])

  return (
    <LocationContext.Provider value={{ location, isLoading, permissionRequested, requestLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationContext() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider')
  }
  return context
}
