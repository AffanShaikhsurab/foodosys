'use client'

import { useState, useEffect } from 'react'
import CourtCard from './CourtCard'
import { useLocation } from '@/hooks/useLocation'
import { useDistance } from '@/hooks/useDistance'
import { getMenuAvailabilityForRestaurants } from '@/lib/menu-availability'

interface Restaurant {
  id: string
  name: string
  location: string
  latitude: number
  longitude: number
  slug: string
  // Add other fields as needed
}

interface CourtListProps {
  userLocation: any
  locationLoading: boolean
}

export default function CourtList({ userLocation, locationLoading }: CourtListProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [menuAvailability, setMenuAvailability] = useState<Record<string, boolean>>({})
  const [menuStats, setMenuStats] = useState({ withMenus: 0, total: 0 })
  const { calculateDistance, formatDistance } = useDistance()

  console.log('CourtList - userLocation prop:', userLocation)
  console.log('CourtList - locationLoading prop:', locationLoading)

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const response = await fetch('/api/restaurants', { cache: 'no-store' })
        const data = await response.json()

        if (data.restaurants) {
          setRestaurants(data.restaurants)
          
          // Check menu availability for all restaurants
          const restaurantIds = data.restaurants.map((r: Restaurant) => r.id)
          const availability = await getMenuAvailabilityForRestaurants(restaurantIds)
          console.log('Menu availability data:', availability)
          
          // Count restaurants with and without menus
          const withMenus = Object.values(availability).filter(Boolean).length
          const withoutMenus = Object.values(availability).filter(v => !v).length
          console.log(`Restaurants with menus: ${withMenus}, without menus: ${withoutMenus}`)
          
          setMenuAvailability(availability)
          setMenuStats({ withMenus, total: data.restaurants.length })
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  // Calculate distance for each restaurant
  const restaurantsWithDistance = restaurants.map(restaurant => {
    console.log('Processing restaurant:', restaurant.name, 'Lat:', restaurant.latitude, 'Lng:', restaurant.longitude);
    console.log('User location:', userLocation);

    if (!userLocation || userLocation.error) {
      console.log('No user location or error, setting distance to Unknown');
      return {
        ...restaurant,
        distance: 'Unknown'
      }
    }

    const lat = typeof restaurant.latitude === 'string' ? parseFloat(restaurant.latitude) : restaurant.latitude;
    const lng = typeof restaurant.longitude === 'string' ? parseFloat(restaurant.longitude) : restaurant.longitude;

    if (!lat || !lng) {
      console.log('Restaurant missing coordinates:', restaurant.name, restaurant);
      return {
        ...restaurant,
        distance: 'Unknown'
      }
    }

    const distanceInMeters = calculateDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: lat, longitude: lng }
    )

    const formattedDistance = formatDistance(distanceInMeters);
    console.log('Calculated distance:', formattedDistance);

    return {
      ...restaurant,
      distance: formattedDistance
    }
  })

  // Sort by menu availability first, then by distance
  const sortedRestaurants = [...restaurantsWithDistance].sort((a, b) => {
    // Check if restaurants have menus
    const aHasMenu = menuAvailability[a.id] ? 1 : 0
    const bHasMenu = menuAvailability[b.id] ? 1 : 0
    
    // Sort by menu availability first (restaurants with menus come first)
    if (aHasMenu !== bHasMenu) {
      return bHasMenu - aHasMenu // Descending: 1 (has menu) before 0 (no menu)
    }
    
    // If both have same menu status, sort by distance
    if (a.distance === 'Unknown') return 1
    if (b.distance === 'Unknown') return -1

    // Extract numeric value and unit for proper comparison
    const aMatch = a.distance.match(/([\d.]+)(km|m)$/)
    const bMatch = b.distance.match(/([\d.]+)(km|m)$/)
    
    if (!aMatch || !bMatch) return 0
    
    // Convert to meters for consistent comparison
    const aMeters = aMatch[2] === 'km' ? parseFloat(aMatch[1]) * 1000 : parseFloat(aMatch[1])
    const bMeters = bMatch[2] === 'km' ? parseFloat(bMatch[1]) * 1000 : parseFloat(bMatch[1])

    return aMeters - bMeters // Ascending order: nearest first
  })

  if (isLoading || locationLoading) {
    return (
      <div className="court-list">
        <div className="loading-message">
          {locationLoading ?
            "Waiting for location permission..." :
            "Loading restaurants..."
          }
        </div>
      </div>
    )
  }

  if (userLocation?.error) {
    return (
      <div className="court-list">
        <div className="location-error">
          <p>{userLocation.error}</p>
          <p>Showing restaurants without distance information.</p>
        </div>
        {restaurants.map((restaurant) => (
          <CourtCard
            key={restaurant.id}
            court={{
              id: parseInt(restaurant.id),
              name: restaurant.name,
              location: restaurant.location,
              distance: 'Unknown',
              status: menuAvailability[restaurant.id] ? 'available' as const : 'missing' as const,
              imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80`,
              slug: restaurant.slug
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="court-list">
      {menuStats.total > 0 && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '18px', marginRight: '8px' }}>🍽️</span>
          {menuStats.withMenus} of {menuStats.total} restaurants have live menus
        </div>
      )}
      {sortedRestaurants.map((restaurant) => (
        <CourtCard
          key={restaurant.id}
          court={{
            id: parseInt(restaurant.id),
            name: restaurant.name,
            location: restaurant.location,
            distance: restaurant.distance,
            status: menuAvailability[restaurant.id] ? 'available' as const : 'missing' as const,
            imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80`,
            slug: restaurant.slug
          }}
        />
      ))}
    </div>
  )
}