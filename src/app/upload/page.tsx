'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import MenuUpload from '@/components/MenuUpload'
import { getCurrentUser } from '@/lib/auth'
import { apiClient } from '@/lib/api'
import type { Restaurant } from '@/lib/types'
import { useLocation } from '@/hooks/useLocation'
import { useDistance } from '@/hooks/useDistance'

export default function UploadPage() {
  const router = useRouter()
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  const { location, requestLocation, isLoading: isLocationLoading } = useLocation()
  const { calculateDistance } = useDistance()
  const [nearestRestaurant, setNearestRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/auth?redirectTo=/upload')
          return
        }
        setIsAuthenticated(true)

        // Fetch all restaurants
        const restaurantsData = await apiClient.getRestaurants()
        setRestaurants(restaurantsData.restaurants)

        // Request location after restaurants are fetched
        requestLocation()
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.push('/auth?redirectTo=/upload')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  if (isLoading) {
    return (
      <div className="app-container" style={{ position: 'relative' }}>
        <div className="min-h-screen bg-[#FDFDE8] flex items-center justify-center">
          <div className="text-center">
            <div className="ri-loader-4-line text-4xl text-[#2C3E2E] animate-spin" style={{ animation: 'spin 1s linear infinite' }}></div>
            <p className="mt-4 text-[#889287]">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to auth page
  }

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="fixed top-6 left-6 z-10 w-10 h-10 bg-[#E8E8E8] rounded-full flex items-center justify-center shadow-sm"
      >
        <i className="ri-arrow-left-line text-xl text-[#2C3E2E]"></i>
      </button>

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

      <BottomNav />
    </div>
  )
}