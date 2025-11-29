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
          setMenuAvailability(availability)
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

  // Sort by distance (unknown distances go to the end)
  const sortedRestaurants = [...restaurantsWithDistance].sort((a, b) => {
    if (a.distance === 'Unknown') return 1
    if (b.distance === 'Unknown') return -1

    // Extract numeric value for comparison
    const aValue = parseFloat(a.distance.replace(/[^\d.]/g, ''))
    const bValue = parseFloat(b.distance.replace(/[^\d.]/g, ''))

    return aValue - bValue
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