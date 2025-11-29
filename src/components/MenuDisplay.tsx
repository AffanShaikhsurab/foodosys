'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { formatTimestamp, getEffectiveTimestamp } from '@/lib/utils'
import { ExtractedMenu, MenuSection, MenuItem, MenuImage, OCRResult } from '@/lib/types'

interface DisplayMenu extends MenuImage {
  ocr_results?: OCRResult
  menus?: {
    id: string
    menu_date: string
    content: ExtractedMenu
    created_at: string
  }
}

interface MenuDisplayProps {
  restaurantSlug: string
}

export default function MenuDisplay({ restaurantSlug }: MenuDisplayProps) {
  const [menus, setMenus] = useState<DisplayMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        console.log(`[MenuDisplay] Fetching menus for restaurant: ${restaurantSlug}`)
        const data = await apiClient.getRestaurantMenus(restaurantSlug)
        console.log(`[MenuDisplay] Received menus:`, data)
        setMenus(data.menus as unknown as DisplayMenu[])
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to fetch menus'
        console.error(`[MenuDisplay] Error fetching menus:`, errMsg)
        setError(errMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [restaurantSlug])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    )
  }

  if (menus.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-sm text-center">
        <div className="w-16 h-16 bg-subtle rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-restaurant-line text-2xl text-primary-dark"></i>
        </div>
        <p className="text-muted">No menus available for this restaurant yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {menus.map((menu) => (
        <div key={menu.id} className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">Menu Photo</h3>
              <div className="flex items-center gap-2 text-sm text-muted">
                <i className="ri-time-line"></i>
                <span>Photo taken: {formatTimestamp(getEffectiveTimestamp(menu))}</span>
              </div>
              {menu.photo_taken_at && (
                <div className="flex items-center gap-2 text-xs text-muted mt-1">
                  <i className="ri-upload-line"></i>
                  <span>Uploaded: {new Date(menu.created_at).toLocaleDateString()}</span>
                </div>
              )}
              {menu.ocr_results && (
                <div className="flex items-center gap-2 text-xs text-muted mt-1">
                  <i className="ri-cpu-line"></i>
                  <span>OCR Processing Time: {menu.ocr_results.processing_time_ms}ms</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button className="text-primary hover:text-primary-dark">
                <i className="ri-eye-line text-xl"></i>
              </button>
              <button className="text-primary hover:text-primary-dark">
                <i className="ri-download-line text-xl"></i>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${menu.storage_path}`}
              alt="Menu Photo"
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                console.error(`Failed to load image from ${menu.storage_path}`, e)
                  ; (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              }}
            />
          </div>

          {menu.menus && menu.menus.content ? (
            <div className="bg-subtle rounded-lg p-4">
              <h4 className="font-medium mb-4">Menu Items:</h4>
              {menu.menus.content.sections.map((section: MenuSection, sectionIndex: number) => (
                <div key={sectionIndex} className="mb-6 last:mb-0">
                  <h5 className="font-semibold text-lg mb-3 text-primary-dark">{section.name}</h5>
                  <div className="space-y-2">
                    {section.items.map((item: MenuItem, itemIndex: number) => (
                      <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-subtle last:border-0">
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          {item.description && (
                            <p className="text-sm text-muted mt-1">{item.description}</p>
                          )}
                        </div>
                        {item.price && (
                          <span className="font-semibold text-primary ml-4">{item.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {menu.menus.content.notes && (
                <div className="mt-4 pt-4 border-t border-subtle">
                  <p className="text-sm text-muted">{menu.menus.content.notes}</p>
                </div>
              )}
            </div>
          ) : menu.ocr_results && menu.ocr_results.text ? (
            <div className="bg-subtle rounded-lg p-4">
              <h4 className="font-medium mb-2">Extracted Text:</h4>
              <pre className="whitespace-pre-wrap text-sm">{menu.ocr_results.text}</pre>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <p>Menu processing not available for this menu.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}