'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import CourtCard from './CourtCard'
import { useDistance } from '@/hooks/useDistance'
import { getCombinedAvailability, clearAvailabilityCache, RestaurantAvailabilityInfo } from '@/lib/combined-availability'
import { cacheStaticRestaurants } from '@/lib/data-cache'
import { preloadRestaurantImages, getRestaurantThumbnailUrl, getRestaurantImageUrl } from '@/lib/image-preloader'

interface Restaurant {
  id: string
  name: string
  location: string
  latitude: number
  longitude: number
  slug: string
}

interface CourtListProps {
  userLocation: any
  locationLoading: boolean
}

// Shimmer Card Component - matches the real card layout
function ShimmerCard({ delay = 0 }: { delay: number }) {
  return (
    <div
      className="mess-card shimmer-card-container"
      style={{
        animationDelay: `${delay}s`,
        pointerEvents: 'none'
      }}
    >
      {/* Card Top: Shimmer Image + Info */}
      <div className="card-top">
        <div className="shimmer-box shimmer-card-image"></div>
        <div className="card-info">
          <div className="card-header">
            <div className="shimmer-box shimmer-text-lg"></div>
            <div className="shimmer-box shimmer-badge"></div>
          </div>
          <div className="shimmer-box shimmer-text-sm"></div>
        </div>
      </div>

      {/* Menu Snippet Shimmer */}
      <div className="menu-snippet shimmer-snippet">
        <div className="shimmer-box shimmer-text-full"></div>
      </div>

      {/* Card Footer Shimmer */}
      <div className="card-footer">
        <div className="shimmer-box shimmer-status"></div>
        <div className="shimmer-box shimmer-icon"></div>
      </div>

      <style jsx>{`
        .shimmer-card-container {
          opacity: 1 !important;
          animation: slideUpFade 0.5s ease-out forwards !important;
        }
        
        .shimmer-box {
          background: linear-gradient(
            90deg,
            rgba(228, 228, 228, 0.6) 0%,
            rgba(240, 240, 240, 0.9) 50%,
            rgba(228, 228, 228, 0.6) 100%
          );
          background-size: 200% 100%;
          animation: shimmerMove 1.2s ease-in-out infinite;
          border-radius: 8px;
        }
        
        .shimmer-card-image {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-md, 20px);
          flex-shrink: 0;
        }
        
        .shimmer-text-lg {
          width: 120px;
          height: 20px;
        }
        
        .shimmer-text-sm {
          width: 80px;
          height: 14px;
          margin-top: 8px;
        }
        
        .shimmer-badge {
          width: 50px;
          height: 24px;
          border-radius: 999px;
        }
        
        .shimmer-snippet {
          background: rgba(255, 255, 255, 0.5) !important;
          padding: 12px 14px !important;
        }
        
        .shimmer-text-full {
          width: 100%;
          height: 16px;
        }
        
        .shimmer-status {
          width: 100px;
          height: 16px;
        }
        
        .shimmer-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        
        @keyframes shimmerMove {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  )
}

export default function CourtList({ userLocation, locationLoading }: CourtListProps) {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [menuAvailability, setMenuAvailability] = useState<Record<string, boolean>>({})
  const [mealAvailability, setMealAvailability] = useState<Record<string, RestaurantAvailabilityInfo>>({})
  const [menuStats, setMenuStats] = useState({ withMenus: 0, total: 0, withCurrentMealMenu: 0 })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionData, setTransitionData] = useState<{
    rect: DOMRect | null
    court: any | null
  }>({ rect: null, court: null })
  const { calculateDistance } = useDistance()

  // Pull to refresh state
  const [pullStartY, setPullStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchRestaurants = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      if (!forceRefresh) {
        const cachedData = typeof window !== 'undefined' ? localStorage.getItem('foodosys_home_data') : null
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
            setRestaurants(parsed.restaurants)
            setMenuAvailability(parsed.menuAvailability)
            setMealAvailability(parsed.mealAvailability)
            setMenuStats(parsed.menuStats)

            // Ensure static cache is populated even when using homepage cache
            const staticData = parsed.restaurants.map((r: Restaurant) => ({
              id: r.id,
              name: r.name,
              location: r.location,
              slug: r.slug,
              imageUrl: getRestaurantImageUrl(r.id),
              thumbnailUrl: getRestaurantThumbnailUrl(r.id)
            }))
            cacheStaticRestaurants(staticData)

            setIsLoading(false)
            return
          }
        }
      }

      const response = await fetch('/api/restaurants', { cache: 'no-store' })
      const data = await response.json()

      if (data.restaurants) {
        setRestaurants(data.restaurants)

        // Check menu availability for all restaurants
        const restaurantIds = data.restaurants.map((r: Restaurant) => r.id)
        const { menuAvailability: availability, mealAvailability: mealAvail } = await getCombinedAvailability(restaurantIds, forceRefresh)

        // Check meal-specific availability
        // (Meal availability already included in combined call)

        // Preload restaurant images in background for instant transitions
        preloadRestaurantImages(restaurantIds)

        // Cache static restaurant data for instant hero section rendering
        const staticData = data.restaurants.map((r: Restaurant) => ({
          id: r.id,
          name: r.name,
          location: r.location,
          slug: r.slug,
          imageUrl: getRestaurantImageUrl(r.id),
          thumbnailUrl: getRestaurantThumbnailUrl(r.id)
        }))
        cacheStaticRestaurants(staticData)

        // Count restaurants with and without menus
        const withMenus = Object.values(availability).filter(Boolean).length
        const withCurrentMealMenu = Object.values(mealAvail).filter(m => m.hasCurrentMealMenu).length

        const stats = { withMenus, total: data.restaurants.length, withCurrentMealMenu }

        setMenuAvailability(availability)
        setMealAvailability(mealAvail)
        setMenuStats(stats)

        localStorage.setItem('foodosys_home_data', JSON.stringify({
          restaurants: data.restaurants,
          menuAvailability: availability,
          mealAvailability: mealAvail,
          menuStats: stats,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  // Handle the card-to-page transition
  const handleCardTransition = useCallback((element: HTMLElement, court: any) => {
    const rect = element.getBoundingClientRect()

    // Store transition data in sessionStorage for the target page
    sessionStorage.setItem('cardTransition', JSON.stringify({
      name: court.name,
      location: court.location,
      imageUrl: court.heroImageUrl || court.imageUrl,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    }))

    setTransitionData({ rect, court })
    setIsTransitioning(true)

    // Navigate after short delay to let animation start
    setTimeout(() => {
      router.push(`/restaurants/${court.slug}`)
    }, 350)
  }, [router])

  // Calculate distance for each restaurant
  const restaurantsWithDistance = restaurants.map(restaurant => {
    if (!userLocation || userLocation.error) {
      return {
        ...restaurant,
        distance: '--'
      }
    }

    const lat = typeof restaurant.latitude === 'string' ? parseFloat(restaurant.latitude) : restaurant.latitude
    const lng = typeof restaurant.longitude === 'string' ? parseFloat(restaurant.longitude) : restaurant.longitude

    if (!lat || !lng) {
      return {
        ...restaurant,
        distance: '--'
      }
    }

    const distanceInMeters = calculateDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: lat, longitude: lng }
    )

    // Format as walking time in minutes
    const walkingTimeMinutes = Math.round(distanceInMeters / 80) // ~80m per minute walking
    const formattedDistance = walkingTimeMinutes < 1 ? '1m' : `${walkingTimeMinutes}m`

    return {
      ...restaurant,
      distance: formattedDistance
    }
  })

  // Sort by current meal menu availability first, then by distance
  const sortedRestaurants = [...restaurantsWithDistance].sort((a, b) => {
    const aMealInfo = mealAvailability[a.id]
    const bMealInfo = mealAvailability[b.id]

    const aHasCurrentMealMenu = aMealInfo?.hasCurrentMealMenu ? 1 : 0
    const bHasCurrentMealMenu = bMealInfo?.hasCurrentMealMenu ? 1 : 0

    if (aHasCurrentMealMenu !== bHasCurrentMealMenu) {
      return bHasCurrentMealMenu - aHasCurrentMealMenu
    }

    const aHasMenu = menuAvailability[a.id] ? 1 : 0
    const bHasMenu = menuAvailability[b.id] ? 1 : 0

    if (aHasMenu !== bHasMenu) {
      return bHasMenu - aHasMenu
    }

    // Sort by distance
    if (a.distance === '--') return 1
    if (b.distance === '--') return -1

    const aMinutes = parseInt(a.distance)
    const bMinutes = parseInt(b.distance)

    if (isNaN(aMinutes)) return 1
    if (isNaN(bMinutes)) return -1

    return aMinutes - bMinutes
  })

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0 && window.scrollY === 0) {
      const touchY = e.touches[0].clientY
      const diff = touchY - pullStartY
      if (diff > 0) {
        // Resistance effect
        setPullDistance(Math.min(diff * 0.5, 150))
      }
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 80) {
      await fetchRestaurants(true)
    }
    setPullStartY(0)
    setPullDistance(0)
  }

  // Show shimmer loading cards while data is loading
  if (isLoading || locationLoading) {
    return (
      <div className="card-stack">
        {[0, 1, 2, 3].map((i) => (
          <ShimmerCard key={i} delay={0.1 * (i + 1)} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div
        className="pull-to-refresh-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        ref={containerRef}
      >
        <div
          className="refresh-indicator"
          style={{
            height: pullDistance > 0 ? `${pullDistance}px` : isRefreshing ? '60px' : '0px',
            opacity: pullDistance > 0 || isRefreshing ? 1 : 0
          }}
        >
          <div className="refresh-spinner">
            {isRefreshing ? (
              <i className="ri-loader-4-line animate-spin"></i>
            ) : (
              <i className="ri-arrow-down-line" style={{ transform: `rotate(${pullDistance > 80 ? 180 : 0}deg)` }}></i>
            )}
          </div>
        </div>

        <div
          className="card-stack"
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
          }}
        >
          {sortedRestaurants.map((restaurant, index) => (
            <CourtCard
              key={restaurant.id}
              animationDelay={0.1 * (index + 1)}
              onCardClick={handleCardTransition}
              court={{
                id: parseInt(restaurant.id),
                name: restaurant.name,
                location: restaurant.location,
                distance: restaurant.distance,
                status: menuAvailability[restaurant.id] ? 'available' as const : 'missing' as const,
                imageUrl: getRestaurantThumbnailUrl(restaurant.id),
                heroImageUrl: getRestaurantImageUrl(restaurant.id),
                slug: restaurant.slug,
                hasCurrentMealMenu: mealAvailability[restaurant.id]?.hasCurrentMealMenu,
                availableMealTypes: mealAvailability[restaurant.id]?.availableMealTypes,
                lastUpdated: mealAvailability[restaurant.id]?.hasCurrentMealMenu ? getRandomTimeAgo() : undefined
              }}
            />
          ))}
        </div>
      </div>

      {/* Card Expansion Overlay - The Ghost Card */}
      {isTransitioning && transitionData.rect && transitionData.court && (
        <div
          className="ghost-card-overlay"
          style={{
            '--start-top': `${transitionData.rect.top}px`,
            '--start-left': `${transitionData.rect.left}px`,
            '--start-width': `${transitionData.rect.width}px`,
            '--start-height': `${transitionData.rect.height}px`,
          } as React.CSSProperties}
        >
          <div className="ghost-card expanding">
            {/* Mirror the card content */}
            <div className="ghost-card-content">
              <div className="card-top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={transitionData.court.imageUrl}
                  className="ghost-card-img"
                  alt={transitionData.court.name}
                />
                <div className="card-info">
                  <span className="mess-name">{transitionData.court.name}</span>
                  <span className="location-text">{transitionData.court.location}</span>
                </div>
              </div>
            </div>

            {/* Hero that fades in during expansion */}
            <div className="ghost-hero">
              <div className="ghost-hero-bg"></div>
              <div className="ghost-hero-content">
                <span className="ghost-hero-badge">{transitionData.court.location}</span>
                <h1 className="ghost-hero-title">{transitionData.court.name}</h1>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pull-to-refresh-container {
          position: relative;
          min-height: 100vh;
        }
        .refresh-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: height 0.2s ease-out, opacity 0.2s ease;
          z-index: 10;
        }
        .refresh-spinner {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2C3E2E;
          font-size: 20px;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ghost-card-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 9999;
          pointer-events: none;
        }
        
        .ghost-card {
          position: absolute;
          top: var(--start-top);
          left: var(--start-left);
          width: var(--start-width);
          height: var(--start-height);
          background: #F4F9F4;
          border-radius: var(--radius-lg, 28px);
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
        }
        
        .ghost-card.expanding {
          animation: expandToFull 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        @keyframes expandToFull {
          0% {
            top: var(--start-top);
            left: var(--start-left);
            width: var(--start-width);
            height: var(--start-height);
            border-radius: var(--radius-lg, 28px);
          }
          100% {
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 0;
          }
        }
        
        .ghost-card-content {
          padding: 16px;
          opacity: 1;
          transition: opacity 0.2s ease;
        }
        
        .ghost-card.expanding .ghost-card-content {
          animation: fadeOutContent 0.3s ease forwards;
        }
        
        @keyframes fadeOutContent {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        .ghost-card-img {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-md, 20px);
          object-fit: cover;
        }
        
        .ghost-hero {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 280px;
          opacity: 0;
          transition: opacity 0.3s ease 0.15s;
        }
        
        .ghost-card.expanding .ghost-hero {
          animation: fadeInHero 0.3s ease 0.2s forwards;
        }
        
        @keyframes fadeInHero {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        .ghost-hero-bg {
          position: absolute;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
          background-size: cover;
          background-position: center;
        }
        
        .ghost-hero-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(44,62,46,0) 0%, rgba(44,62,46,0.9) 100%);
        }
        
        .ghost-hero-content {
          position: absolute;
          bottom: 24px;
          left: 24px;
          right: 24px;
          color: white;
          z-index: 2;
        }
        
        .ghost-hero-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .ghost-hero-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: white;
        }
      `}</style>
    </>
  )
}

function getRandomTimeAgo(): string {
  const minutes = Math.floor(Math.random() * 30) + 5
  return `${minutes}m ago`
}
