'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import MenuUpload from '@/components/MenuUpload'
import AnonymousUploadPopup from '@/components/AnonymousUploadPopup'
import { apiClient } from '@/lib/api'
import type { Restaurant } from '@/lib/types'
import { useLocation } from '@/hooks/useLocation'
import { useDistance } from '@/hooks/useDistance'
import { useUser } from '@clerk/nextjs'

export default function UploadPage() {
  const router = useRouter()
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [showAnonymousPopup, setShowAnonymousPopup] = useState(false)
  const [isAnonymousMode, setIsAnonymousMode] = useState(false)

  const { location, requestLocation, isLoading: isLocationLoading } = useLocation()
  const { calculateDistance } = useDistance()
  const [nearestRestaurant, setNearestRestaurant] = useState<Restaurant | null>(null)
  const { user } = useUser()

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Set authentication status
        setIsAuthenticated(!!user)

        // Fetch all restaurants
        const restaurantsData = await apiClient.getRestaurants()
        setRestaurants(restaurantsData.restaurants)

        // Request location after restaurants are fetched
        requestLocation()
      } catch (error) {
        console.error('Error initializing upload page:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializePage()
  }, [user])

  // Check for nearest restaurant when location and restaurants are available
  useEffect(() => {
    if (restaurants.length > 0 && location && !location.error) {
      let minDistance = Infinity
      let nearest: Restaurant | null = null

      restaurants.forEach(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          const distance = calculateDistance(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: restaurant.latitude, longitude: restaurant.longitude }
          )

          // Log for debugging
          console.log(`Distance to ${restaurant.name}: ${distance}m`)

          if (distance < minDistance) {
            minDistance = distance
            nearest = restaurant
          }
        }
      })

      // If we found a restaurant within 500m, recommend it
      if (nearest && minDistance < 500) {
        // Only update if we haven't selected one yet or if it's a better match
        if (!selectedRestaurant) {
          setNearestRestaurant(nearest)
          setSelectedRestaurant((nearest as Restaurant).slug)
          setMessage(`Looks like you're at ${(nearest as Restaurant).name}. We've selected it for you!`)
          setShowToast(true)

          setTimeout(() => {
            setShowToast(false)
          }, 4000)
        }
      }
    }
  }, [location, restaurants, calculateDistance, selectedRestaurant])

  const handleUploadSuccess = (response: any) => {
    setUploadStatus('success')
    setMessage('Uploaded Successfully!')
    setShowToast(true)

    setTimeout(() => {
      setShowToast(false)
      router.push('/')
    }, 2000)
  }

  const handleUploadError = (error: Error) => {
    setUploadStatus('error')
    setMessage(`Upload failed: ${error.message}`)
    setShowToast(true)

    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  const handleShowAnonymousPopup = () => {
    setShowAnonymousPopup(true)
  }

  const handleAnonymousUpload = () => {
    setIsAnonymousMode(true)
    setShowAnonymousPopup(false)
  }

  if (isLoading) {
    return (
      <div className="app-container" style={{ position: 'relative' }}>
        <div className="min-h-screen bg-[#FDFDE8] flex items-center justify-center">
          <div className="text-center">
            <div className="ri-loader-4-line text-4xl text-[#2C3E2E] animate-spin" style={{ animation: 'spin 1s linear infinite' }}></div>
            <p className="mt-4 text-[#889287]">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <div style={{ paddingTop: '5rem' }} className="upload-header">
        <div className="upload-title">Update Menu</div>
        <div className="upload-subtitle">You&apos;re helping ~30 students avoid a long walk. Nice! 🌱</div>
      </div>

      {/* Restaurant Selection */}
      <div className="form-group">
        <label className="label">Where are you?</label>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="location-select"
            style={nearestRestaurant && selectedRestaurant === nearestRestaurant.slug ? {
              borderColor: 'var(--accent-lime)',
              backgroundColor: '#F0FDF4'
            } : {}}
          >
            <option value="">Select Food Court...</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.slug} value={restaurant.slug}>
                {restaurant.name}
              </option>
            ))}
          </select>

          {isLocationLoading && !selectedRestaurant && (
            <div style={{
              position: 'absolute',
              right: '30px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <i className="ri-loader-4-line animate-spin text-gray-400"></i>
            </div>
          )}
        </div>

        {nearestRestaurant && selectedRestaurant === nearestRestaurant.slug && (
          <div style={{
            fontSize: '12px',
            color: '#166534',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <i className="ri-map-pin-user-fill"></i>
            Detected nearby location
          </div>
        )}
      </div>

      {/* Upload Component */}
      {selectedRestaurant ? (
        <MenuUpload
          restaurantSlug={selectedRestaurant}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          isAnonymousMode={isAnonymousMode}
          onShowAnonymousPopup={handleShowAnonymousPopup}
        />
      ) : (
        <div className="camera-zone">
          <div className="camera-ui">
            <div className="camera-btn">
              <i className="ri-camera-fill"></i>
            </div>
            <div className="camera-text">
              {isLocationLoading ? 'Locating...' : 'Select a location to start'}
            </div>
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="tip-container">
        <div className="tip-content">
          <i className="ri-lightbulb-flash-line tip-icon"></i>
          <div className="tip-text">
            <strong>Tip:</strong> Hold your camera steady and ensure prices and item names are clearly visible for best results.
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="toast">
          <i className="ri-checkbox-circle-fill"></i> {message}
        </div>
      )}

      {/* Anonymous Upload Popup */}
      <AnonymousUploadPopup
        isOpen={showAnonymousPopup}
        onClose={() => setShowAnonymousPopup(false)}
        onContinueAsAnonymous={handleAnonymousUpload}
      />

      <BottomNav />
    </div>
  )
}