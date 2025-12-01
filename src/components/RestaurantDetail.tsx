'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { apiClient } from '@/lib/api'
import { formatTimestamp, getEffectiveTimestamp, groupImagesByMealType } from '@/lib/utils'
import { MenuImage, OCRResult } from '@/lib/types'
import ImageViewer from '@/components/ImageViewer'

interface DisplayMenu extends MenuImage {
  ocr_results?: OCRResult
}

interface Restaurant {
  id: string
  name: string
  location: string
  distance_estimate_m: number
  slug: string
  created_at: string
}

export default function RestaurantDetail({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menus, setMenus] = useState<DisplayMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOCR, setShowOCR] = useState<{ [key: string]: boolean }>({})
  const [helpfulVotes, setHelpfulVotes] = useState<{ [key: string]: number }>({})
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'helpful' | 'wrong' | null }>({})
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const restaurantsData = await apiClient.getRestaurants()
        const foundRestaurant = restaurantsData.restaurants.find((r: Restaurant) => r.slug === params.slug)

        if (!foundRestaurant) {
          setError('Restaurant not found')
          return
        }

        setRestaurant(foundRestaurant)

        const menusData = await apiClient.getRestaurantMenus(params.slug)
        setMenus(menusData.menus)

        const initialVotes: { [key: string]: number } = {}
        const initialUserVotes: { [key: string]: 'helpful' | 'wrong' | null } = {}
        menusData.menus.forEach((menu: DisplayMenu) => {
          initialVotes[menu.id] = Math.floor(Math.random() * 20) + 5
          initialUserVotes[menu.id] = null
        })
        setHelpfulVotes(initialVotes)
        setUserVotes(initialUserVotes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.slug])

  const handleVote = (menuId: string, voteType: 'helpful' | 'wrong') => {
    if (userVotes[menuId] === voteType) {
      setUserVotes(prev => ({ ...prev, [menuId]: null }))
      if (voteType === 'helpful') {
        setHelpfulVotes(prev => ({ ...prev, [menuId]: prev[menuId] - 1 }))
      }
    } else {
      const previousVote = userVotes[menuId]
      setUserVotes(prev => ({ ...prev, [menuId]: voteType }))

      if (previousVote === 'helpful') {
        setHelpfulVotes(prev => ({ ...prev, [menuId]: prev[menuId] - 1 }))
      } else if (voteType === 'helpful') {
        setHelpfulVotes(prev => ({ ...prev, [menuId]: prev[menuId] + 1 }))
      }
    }
  }

  const toggleOCRView = (menuId: string) => {
    setShowOCR(prev => ({ ...prev, [menuId]: !prev[menuId] }))
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="app-container">
        <div className="p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error || 'Restaurant not found'}</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  const isOpen = true

  return (
    <div className="app-container">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="fixed top-6 left-6 z-10 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z"></path>
        </svg>
      </button>

      {/* Hero Section */}
      <div className="hero-header">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badges">
            <span className="badge-translucent">{restaurant.location}</span>
            <span className="badge-translucent" style={{ background: 'var(--accent-lime)', color: 'var(--primary-dark)' }}>
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
          <div className="hero-title">{restaurant.name}</div>
          <div className="hero-subtitle">
            <i className="ri-map-pin-line"></i> {restaurant.location}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content-scroll">
        <div className="section-header">
          <h3 style={{ fontSize: '18px', color: 'var(--primary-dark)' }}>Menu Photos</h3>
          <span className="last-updated">{menus.length > 0 ? `${menus.length} photo${menus.length > 1 ? 's' : ''}` : 'No photos'}</span>
        </div>

        {/* Menu Cards */}
        {menus.length > 0 ? (
          <div className="menu-cards">
            {(() => {
              const groupedMenus = groupImagesByMealType(menus)
              const getMealOrder = (): Array<'Breakfast' | 'Lunch' | 'Dinner'> => {
                const hour = new Date().getHours()
                // Breakfast time: 5am - 11am
                if (hour >= 5 && hour < 11) {
                  return ['Breakfast', 'Lunch', 'Dinner']
                } 
                // Lunch time: 11am - 4pm
                else if (hour >= 11 && hour < 16) {
                  return ['Lunch', 'Dinner', 'Breakfast']
                } 
                // Dinner time: 4pm - 5am next day
                else {
                  return ['Dinner', 'Breakfast', 'Lunch']
                }
              }
              const mealOrder = getMealOrder()

              return mealOrder.map(mealType => {
                const mealMenus = groupedMenus[mealType]
                if (mealMenus.length === 0) return null

                return (
                  <div key={mealType}>
                    <div className="meal-type-header">
                      <i className={`ri-${mealType === 'Breakfast' ? 'sun' :
                        mealType === 'Lunch' ? 'restaurant' :
                          'moon'
                        }-line`}></i>
                      {mealType}
                    </div>
                    {mealMenus.map((menu) => (
                      <div key={menu.id} className="menu-card">
                        <div className="menu-image-container">
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${menu.storage_path}`}
                            alt="Menu Photo"
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${menu.storage_path}`
                              setSelectedImage({ url: imageUrl, alt: 'Menu Photo' })
                              setViewerOpen(true)
                            }}
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
                            }}
                          />
                          <div className="photo-timestamp">
                            <i className="ri-time-line"></i> {formatTimestamp(getEffectiveTimestamp(menu))}
                          </div>
                          <div
                            className="view-toggle"
                            onClick={() => toggleOCRView(menu.id)}
                          >
                            <i className={`ri-${showOCR[menu.id] ? 'image' : 'text'}`}></i>
                            View {showOCR[menu.id] ? 'Image' : 'Text'}
                          </div>
                        </div>

                        <div className="ocr-content">
                          {showOCR[menu.id] && menu.ocr_results ? (
                            <div className="ocr-text-block">
                              {(() => {
                                const text = menu.ocr_results?.text || ''
                                return text.split('\n').map((line, index) => (
                                  <div key={index}>{line}</div>
                                ))
                              })()}
                            </div>
                          ) : (
                            <div className="ocr-text-block">
                              {menu.ocr_results ? (
                                (() => {
                                  const text = menu.ocr_results?.text || ''
                                  return text.split('\n').map((line, index) => (
                                    <div key={index}>{line}</div>
                                  ))
                                })()
                              ) : (
                                <>
                                  • Masala Dosa - ₹45<br />
                                  • Idli Vada Set - ₹30<br />
                                  • Veg Pulao - ₹40<br />
                                  • Curd Rice - ₹25<br />
                                  • Filter Coffee - ₹10
                                </>
                              )}
                            </div>
                          )}

                          <div className="feedback-row">
                            <button
                              className={`btn-pill ${userVotes[menu.id] === 'helpful' ? 'active' : ''}`}
                              onClick={() => handleVote(menu.id, 'helpful')}
                            >
                              <i className="ri-thumb-up-line"></i> Helpful ({helpfulVotes[menu.id]})
                            </button>
                            <button
                              className={`btn-pill report ${userVotes[menu.id] === 'wrong' ? 'active' : ''}`}
                              onClick={() => handleVote(menu.id, 'wrong')}
                            >
                              <i className="ri-flag-line"></i> Wrong
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })
            })()}
          </div>
        ) : (
          <div className="menu-card" style={{ opacity: 0.6 }}>
            <div className="ocr-content" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <i className="ri-camera-line" style={{ fontSize: '24px', color: 'var(--text-muted)', marginBottom: '8px' }}></i>
              <h4 style={{ color: 'var(--primary-dark)' }}>No Menu Photos</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No menu photos have been uploaded yet.</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {selectedImage && (
        <ImageViewer
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false)
            setSelectedImage(null)
          }}
        />
      )}

      <style jsx>{`
        .hero-header {
          height: 280px;
          background-image: url('https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-end;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(44,62,46,0) 0%, rgba(44,62,46,0.9) 100%);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          padding: 24px;
          width: 100%;
          color: white;
        }

        .hero-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .badge-translucent {
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .hero-title { 
          font-size: 28px; 
          font-weight: 700; 
          margin-bottom: 4px; 
        }
        
        .hero-subtitle { 
          font-size: 14px; 
          opacity: 0.9; 
          display: flex; 
          align-items: center; 
          gap: 4px; 
        }

        .content-scroll {
          padding: 24px;
          padding-bottom: 100px;
          overflow-y: auto;
          height: calc(100vh - 280px);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .last-updated { 
          font-size: 12px; 
          color: var(--text-muted); 
          font-weight: 500; 
        }

        .menu-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .meal-type-header {
          font-size: 16px;
          font-weight: 700;
          color: var(--primary-dark);
          margin: 24px 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .meal-type-header:first-child {
          margin-top: 0;
        }

        .meal-type-header i {
          color: var(--accent-lime);
          background: var(--primary-dark);
          padding: 6px;
          border-radius: 8px;
          font-size: 14px;
        }

        .menu-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 8px;
          box-shadow: var(--shadow-sm);
          margin-bottom: 8px;
        }

        .menu-image-container {
          width: 100%;
          height: 200px;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
        }
        
        .menu-image-container img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }

        .view-toggle {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: var(--primary-dark);
          color: var(--accent-lime);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .photo-timestamp {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
        }

        .ocr-content {
          padding: 16px;
        }
        
        .ocr-text-block {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-main);
          background: #F9F9F9;
          padding: 12px;
          border-radius: 12px;
        }

        .feedback-row {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .btn-pill {
          flex: 1;
          padding: 10px;
          border-radius: 20px;
          border: 1px solid #eee;
          background: transparent;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          cursor: pointer;
        }

        .btn-pill.active { 
          background: #E8F5E9; 
          color: #2E7D32; 
          border-color: transparent; 
        }
        
        .btn-pill.report { 
          color: #D32F2F; 
        }
        
        .btn-pill.report.active { 
          background: #FFEBEE; 
          color: #D32F2F; 
        }
      `}</style>
    </div>
  )
}