/**
 * Formats a timestamp in a user-friendly way
 * @param timestamp - The timestamp to format (ISO string)
 * @returns A formatted string like "Today at 2:30 PM", "Yesterday", "2 days ago", etc.
 */
export function formatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Unknown time'
  
  const date = new Date(timestamp)
  const now = new Date()
  
  // Reset time to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  // Check if it's today
  if (inputDate.getTime() === today.getTime()) {
    return `Today at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`
  }
  
  // Check if it's yesterday
  if (inputDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  }
  
  // Check if it's within the last week
  const daysDiff = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff < 7) {
    return `${daysDiff} days ago`
  }
  
  // Check if it's within the last month
  if (daysDiff < 30) {
    const weeksDiff = Math.floor(daysDiff / 7)
    return `${weeksDiff} week${weeksDiff > 1 ? 's' : ''} ago`
  }
  
  // Otherwise, return the full date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Gets the effective timestamp for a menu image
 * Uses photo_taken_at if available, otherwise falls back to created_at
 * @param menuImage - The menu image object
 * @returns The effective timestamp string
 */
export function getEffectiveTimestamp(menuImage: { photo_taken_at?: string | null; created_at: string }): string {
  return menuImage.photo_taken_at || menuImage.created_at
}

/**
 * Groups menu images by date
 * @param menuImages - Array of menu images
 * @returns Object with date strings as keys and arrays of menu images as values
 */
export function groupImagesByDate(menuImages: Array<{ photo_taken_at?: string | null; created_at: string }>): Record<string, Array<any>> {
  const grouped: Record<string, Array<any>> = {}
  
  menuImages.forEach(image => {
    const timestamp = getEffectiveTimestamp(image)
    const date = new Date(timestamp)
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    
    grouped[dateKey].push(image)
  })
  
  return grouped
}