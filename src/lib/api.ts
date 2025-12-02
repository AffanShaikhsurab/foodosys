import { Restaurant, MenuImage, OCRResult, Menu, PhotoUploadData } from './types'
import { supabase } from './supabase-browser'
import { logSupabase, logger } from './logger'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

class ApiClient {
  private async getAuthHeaders(token?: string | null): Promise<Record<string, string>> {
    const startTime = Date.now()

    logSupabase('Getting auth headers', {
      operation: 'get_auth_headers_start',
      hasProvidedToken: !!token
    })

    // If a Clerk token is provided, use it directly
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      }
    }

    try {
      // For client-side usage, we can't access Supabase auth session
      // The token should be provided by the calling component
      logSupabase('No token provided for client-side API call', {
        operation: 'get_auth_headers_no_token',
        processingTime: Date.now() - startTime
      })
      return {}
    } catch (error) {
      const processingTime = Date.now() - startTime

      logSupabase('Exception getting auth headers', {
        operation: 'get_auth_headers_exception',
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      })

      console.error('Error getting auth headers:', error)
      return {}
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit, token?: string | null): Promise<T> {
    const startTime = Date.now()
    const url = `${API_BASE_URL}/api${endpoint}`
    const authHeaders = await this.getAuthHeaders(token)

    logSupabase('API request started', {
      operation: 'api_request_start',
      endpoint,
      method: options?.method || 'GET',
      url: url.substring(0, 50) + '...',
      hasAuthHeaders: Object.keys(authHeaders).length > 0
    })

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const processingTime = Date.now() - startTime
      const errorData = await response.json().catch(() => ({}))

      logSupabase('API request failed', {
        operation: 'api_request_failed',
        endpoint,
        method: options?.method || 'GET',
        statusCode: response.status,
        statusText: response.statusText,
        processingTime,
        error: errorData.error || response.statusText
      })

      throw new Error(errorData.error || `Request failed: ${response.statusText}`)
    }

    const processingTime = Date.now() - startTime
    logSupabase('API request completed successfully', {
      operation: 'api_request_success',
      endpoint,
      method: options?.method || 'GET',
      statusCode: response.status,
      processingTime
    })

    return response.json()
  }

  // Restaurants
  async getRestaurants(): Promise<{ restaurants: Restaurant[] }> {
    return this.request('/restaurants')
  }

  // Menus
  async getRestaurantMenus(slug: string, token?: string | null): Promise<{ menus: (MenuImage & { ocr_results?: OCRResult })[] }> {
    return this.request(`/restaurants/${slug}/menus`, undefined, token)
  }

  // Upload
  async uploadMenuImage(file: File, restaurantSlug: string, token?: string | null): Promise<{
    success: boolean
    menuImage: MenuImage
    ocrResult: OCRResult
  }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('restaurantSlug', restaurantSlug)

    const authHeaders = await this.getAuthHeaders(token)
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Upload base64 image with timestamp
  async uploadMenuImageFromBase64(photoData: PhotoUploadData, restaurantSlug: string, token?: string | null): Promise<{
    success: boolean
    menuImage: MenuImage
    ocrResult: OCRResult
  }> {
    const authHeaders = await this.getAuthHeaders(token)
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        base64: photoData.base64,
        timestamp: photoData.timestamp,
        fileName: photoData.fileName || 'menu-photo.jpg',
        restaurantSlug
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Admin: Delete menu image
  async deleteMenuImage(imageId: string, reason?: string, token?: string | null): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/delete-image/${imageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }, token)
  }
}

export const apiClient = new ApiClient()