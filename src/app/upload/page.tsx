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
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

export default function UploadPage() {
  const router = useRouter()
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [selectedRestaurantName, setSelectedRestaurantName] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [showAnonymousPopup, setShowAnonymousPopup] = useState(false)
  const [isAnonymousMode, setIsAnonymousMode] = useState(false)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)

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
          setSelectedRestaurantName((nearest as Restaurant).name)
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

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant.slug)
    setSelectedRestaurantName(restaurant.name)
    setShowRestaurantModal(false)
  }

  if (isLoading) {
    return (
      <div className="scan-page-body">
        <div className="lottie-loading-container">
          <DotLottieReact
            src="/Loading-Cat.lottie"
            loop
            autoplay
            style={{ width: '200px', height: '200px' }}
          />
          <p className="loading-text">Getting ready to scan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="scan-page-body">
      {/* Header: Gamification Context */}
      <header className="scan-header-section">
        <div className="karma-badge">
          <i className="ri-flashlight-fill"></i> Earn +50 Karma
        </div>
        <h1>Update Menu</h1>
        <p>You&apos;re helping ~30 students. Nice! 🌱</p>
      </header>

      {/* Location Selector */}
      <div className="location-bar">
        <div className="location-pill">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="loc-sub">
              {nearestRestaurant && selectedRestaurant === nearestRestaurant.slug
                ? 'Detected Location'
                : 'Selected Location'}
            </span>
            <span className="loc-text">
              <i className="ri-map-pin-user-fill" style={{ color: 'var(--primary-dark)' }}></i>
              {selectedRestaurantName || 'Select Location'}
            </span>
          </div>
          <button className="btn-change" onClick={() => setShowRestaurantModal(true)}>
            Change
          </button>
        </div>
      </div>

      {/* Main Camera/Upload View */}
      {selectedRestaurant ? (
        <MenuUpload
          restaurantSlug={selectedRestaurant}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          isAnonymousMode={isAnonymousMode}
          onShowAnonymousPopup={handleShowAnonymousPopup}
        />
      ) : (
        <div className="camera-container">
          <div className="camera-feed-bg"></div>

          {/* Overlay UI */}
          <div className="scan-overlay-frame">
            <div className="corner tl"></div>
            <div className="corner tr"></div>
            <div className="corner bl"></div>
            <div className="corner br"></div>
            <div className="laser-line"></div>
          </div>

          {/* Camera Controls */}
          <div className="camera-controls-bar">
            <button className="btn-icon">
              <i className="ri-image-line"></i>
            </button>

            {/* The Big Button - Prompts location selection */}
            <button
              className="shutter-btn disabled"
              onClick={() => setShowRestaurantModal(true)}
            >
              <div className="shutter-inner" style={{
                background: '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="ri-map-pin-line" style={{ fontSize: '24px', color: 'white' }}></i>
              </div>
            </button>

            <button className="btn-icon">
              <i className="ri-flashlight-line"></i>
            </button>
          </div>
        </div>
      )}

      {/* Contextual Tip */}
      <div className="tip-box">
        <div className="tip-icon-wrapper">
          <i className="ri-lightbulb-flash-fill"></i>
        </div>
        <span>
          {selectedRestaurant
            ? 'Hold steady. Ensure prices and items are clearly visible.'
            : 'Select a location above to start scanning menus.'}
        </span>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="toast">
          <i className="ri-checkbox-circle-fill"></i> {message}
        </div>
      )}

      {/* Restaurant Selection Modal */}
      {showRestaurantModal && (
        <div className="restaurant-select-modal" onClick={() => setShowRestaurantModal(false)}>
          <div className="restaurant-select-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              <i className="ri-map-pin-line" style={{ marginRight: '8px' }}></i>
              Select Food Court
            </h3>
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.slug}
                className={`restaurant-option ${selectedRestaurant === restaurant.slug ? 'selected' : ''}`}
                onClick={() => handleRestaurantSelect(restaurant)}
              >
                <div className="name">
                  {nearestRestaurant?.slug === restaurant.slug && (
                    <i className="ri-map-pin-user-fill" style={{ marginRight: '6px', color: 'var(--status-success)' }}></i>
                  )}
                  {restaurant.name}
                </div>
                <div className="location">{restaurant.location}</div>
              </div>
            ))}
          </div>
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