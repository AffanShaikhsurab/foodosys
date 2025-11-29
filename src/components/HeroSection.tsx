'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export default function HeroSection() {
  const [menuCount, setMenuCount] = useState(0)
  const [restaurantCount, setRestaurantCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch restaurants
        const restaurantsData = await apiClient.getRestaurants()
        setRestaurantCount(restaurantsData.restaurants.length)

        // Fetch all menus from all restaurants
        let totalMenus = 0
        for (const restaurant of restaurantsData.restaurants) {
          try {
            const menusData = await apiClient.getRestaurantMenus(restaurant.slug)
            totalMenus += menusData.menus.length
          } catch (error) {
            console.error(`Error fetching menus for ${restaurant.slug}:`, error)
          }
        }
        setMenuCount(totalMenus)
      } catch (error) {
        console.error('Error fetching data:', error)
        setMenuCount(0)
        setRestaurantCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <section className="hero-section" style={{ paddingTop: '24px' }}>
      <div className="status-card">
        <div className="status-header">
          <span className="status-pill">Live Updates</span>
          <i className="ri-restaurant-2-line" style={{ fontSize: '20px', opacity: '0.8' }}></i>
        </div>
        <div className="status-main">
          {loading ? (
            <>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                Loading...
              </h2>
              <p style={{ opacity: '0.85', fontSize: '15px' }}>Fetching menu data...</p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                {menuCount} Menu{menuCount !== 1 ? 's' : ''} Live
              </h2>
              <p style={{ opacity: '0.85', fontSize: '15px', lineHeight: '1.5' }}>
                {restaurantCount} food court{restaurantCount !== 1 ? 's' : ''} available.
              </p>
            </>
          )}
        </div>
        {/* SVG Wave decoration */}
        <svg className="deco-line" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: 'absolute', bottom: '20px', right: '0', width: '100%', height: '40px', opacity: '0.3', zIndex: '1' }}>
          <path d="M0 10 Q 25 20 50 10 T 100 10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </section>
  )
}