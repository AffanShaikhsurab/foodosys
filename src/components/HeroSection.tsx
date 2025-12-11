'use client'

import { useState, useEffect } from 'react'
import { LeaderboardButton } from './Leaderboard'

interface HeroSectionProps {
  location: any
  isLoading: boolean
  requestLocation: () => void
  stats?: { restaurantCount: number, menuCount: number }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning,'
  if (hour < 17) return 'Good Afternoon,'
  return 'Good Evening,'
}

function getMealQuestion(): string {
  const hour = new Date().getHours()
  if (hour < 11) return "What's for Breakfast?"
  if (hour < 16) return "What's for Lunch?"
  return "What's for Dinner?"
}

export default function HeroSection({ location, isLoading, requestLocation, stats: propStats }: HeroSectionProps) {
  const [locationText, setLocationText] = useState('Getting location...')

  useEffect(() => {
    if (location && !location.error) {
      setLocationText('Infosys Mysore')
    } else if (location?.error) {
      if (location.error.includes('permission denied')) {
        setLocationText('Location disabled')
      } else {
        setLocationText('Location unavailable')
      }
    } else {
      setLocationText('Detecting...')
    }
  }, [location])

  const [loading, setLoading] = useState(true)
  const [internalStats, setInternalStats] = useState({ restaurantCount: 0, menuCount: 0 })

  // Use prop stats if available, otherwise use internal stats
  const displayStats = propStats || internalStats
  const { restaurantCount, menuCount } = displayStats

  useEffect(() => {
    // If stats are provided via props, we don't need to fetch
    if (propStats) {
      setLoading(false)
      return
    }

    async function fetchStats() {
      try {
        const response = await fetch('/api/restaurants')
        const data = await response.json()
        if (data.restaurants) {
          setInternalStats({
            restaurantCount: data.restaurants.length,
            menuCount: data.restaurants.length
          })
        }
      } catch (e) {
        console.error('Error fetching stats:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [propStats])

  const handleLocationClick = () => {
    // If location was previously denied, show instructions
    if (location?.error && location.error.includes('permission denied')) {
      alert('To enable location:\n\n1. Click the lock/icon in your browser address bar\n2. Change location permission to "Allow"\n3. Refresh the page')
    } else {
      requestLocation()
    }
  }

  return (
    <section className="header-section">
      {/* Top Bar: Location Left, Leaderboard Right */}
      <div className="top-bar-new">
        {/* Location Pill */}
        <div className="location-pill step-location click-active" onClick={handleLocationClick}>
          <i className="ri-map-pin-line"></i>
          {isLoading ? (
            <span className="location-loading-text">
              <i className="ri-loader-4-line animate-spin"></i>
            </span>
          ) : (
            <>
              {location?.error && location.error.includes('permission denied') && (
                <i className="ri-error-warning-line"></i>
              )}
              {locationText}
            </>
          )}
        </div>

        {/* Leaderboard Pill */}
        <LeaderboardButton />
      </div>

      {/* Hero Title */}
      <div className="hero-title step-hero-title">
        <span className="hero-greeting">{getGreeting()}</span>
        <h1>{getMealQuestion()}</h1>
      </div>

      {/* Status Widget */}
      <section className="status-widget step-status-widget click-active">
        <div className="widget-content">
          {loading ? (
            <div className="hero-shimmer-container">
              <div className="shimmer-line title"></div>
              <div className="shimmer-line subtitle"></div>
            </div>
          ) : (
            <>
              <h2>{menuCount} of {restaurantCount} Menus Live</h2>
              <p>Don&apos;t walk 2km to be disappointed.</p>
            </>
          )}
        </div>
        <div className="widget-action">
          <i className="ri-fire-fill"></i>
        </div>
        {/* Decorative circle */}
        <div className="widget-deco"></div>
      </section>

      <style jsx>{`
        .hero-shimmer-container {
          width: 100%;
        }
        .shimmer-line {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        .shimmer-line.title {
          height: 24px;
          width: 80%;
          margin-bottom: 8px;
        }
        .shimmer-line.subtitle {
          height: 16px;
          width: 60%;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </section>
  )
}
