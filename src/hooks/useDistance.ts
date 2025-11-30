'use client'

// Source - https://stackoverflow.com/a/27943
// Posted by talkol, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-01, License - CC BY-SA 4.0

interface Coordinates {
  latitude: number
  longitude: number
}

export function useDistance() {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param lat1Deg - Latitude of point 1 in degrees
   * @param lon1Deg - Longitude of point 1 in degrees
   * @param lat2Deg - Latitude of point 2 in degrees
   * @param lon2Deg - Longitude of point 2 in degrees
   * @returns Distance in meters
   */
  const haversineDistanceMeters = (
    lat1Deg: number,
    lon1Deg: number,
    lat2Deg: number,
    lon2Deg: number
  ): number => {
    function toRad(degree: number): number {
      return degree * Math.PI / 180
    }

    const lat1 = toRad(lat1Deg)
    const lon1 = toRad(lon1Deg)
    const lat2 = toRad(lat2Deg)
    const lon2 = toRad(lon2Deg)

    const { sin, cos, sqrt, atan2 } = Math

    const R = 6371 // earth radius in km 
    const dLat = lat2 - lat1
    const dLon = lon2 - lon1
    const a = sin(dLat / 2) * sin(dLat / 2)
      + cos(lat1) * cos(lat2)
      * sin(dLon / 2) * sin(dLon / 2)
    const c = 2 * atan2(sqrt(a), sqrt(1 - a))
    const d = R * c

    // Convert km to meters
    return d * 1000
  }

  const calculateDistance = (
    userLocation: Coordinates,
    restaurantLocation: Coordinates
  ): number => {
    // Calculate distance in meters using haversine formula
    return haversineDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      restaurantLocation.latitude,
      restaurantLocation.longitude
    )
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