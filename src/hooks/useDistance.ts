'use client'

import haversine from 'haversine-distance'

interface Coordinates {
  latitude: number
  longitude: number
}

export function useDistance() {
  const calculateDistance = (
    userLocation: Coordinates,
    restaurantLocation: Coordinates
  ): number => {
    // Calculate distance in meters using haversine formula
    return haversine(userLocation, restaurantLocation)
  }

  const formatDistance = (distanceInMeters: number): string => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`
    }
  }

  return { calculateDistance, formatDistance }
}