'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { apiClient } from '@/lib/api'
import { formatTimestamp, getEffectiveTimestamp, groupImagesByMealType } from '@/lib/utils'
import { MenuImage, OCRResult } from '@/lib/types'
import RestaurantImageViewer from '@/components/RestaurantImageViewer'
import { useUser } from '@clerk/nextjs'
import { getRestaurantImageUrl } from '@/lib/image-preloader'
import { getStaticRestaurantBySlug, StaticRestaurantData } from '@/lib/data-cache'

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

interface CardTransitionData {
  name: string
  location: string
  imageUrl: string
}

export default function RestaurantDetail({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { user } = useUser()

  // Try to get cached static data first for instant rendering
  const [cachedStatic] = useState<StaticRestaurantData | null>(() => {
    if (typeof window !== 'undefined') {
      return getStaticRestaurantBySlug(params.slug)
    }
    return null
  })

  const [restaurant, setRestaurant] = useState<Restaurant | null>(() => {
    // Convert cached static data to Restaurant format for backward compatibility
    if (cachedStatic) {
      return {
        id: cachedStatic.id,
        name: cachedStatic.name,
        location: cachedStatic.location,
        slug: cachedStatic.slug,
        distance_estimate_m: 0,
        created_at: ''
      }
    }
    return null
  })
  const [menus, setMenus] = useState<DisplayMenu[]>([])
  // If we have cached data, hero can render immediately - no loading state needed
  const [loading, setLoading] = useState(() => !cachedStatic)
  const [menusLoading, setMenusLoading] = useState(true)
  const [transitionData, setTransitionData] = useState<CardTransitionData | null>(() => {
    // Read transition data synchronously on first render to avoid flash
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('cardTransition')
      if (storedData) {
        try {
          const data = JSON.parse(storedData)
          sessionStorage.removeItem('cardTransition')
          return data
        } catch (e) {
          console.error('Failed to parse transition data:', e)
        }
      }
    }
    return null
  })
  const [error, setError] = useState<string | null>(null)
  const [helpfulVotes, setHelpfulVotes] = useState<{ [key: string]: number }>({})
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'helpful' | 'wrong' | null }>({})
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [swipeState, setSwipeState] = useState<{ [key: string]: number }>({})
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'photo' | 'text'>('photo')
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)

  // Transition data is now read synchronously in useState initializer above

  useEffect(() => {
    const fetchData = async () => {
      try {
        // OPTIMIZATION: Fetch single restaurant by slug instead of ALL restaurants
        const restaurantsData = await apiClient.getRestaurantBySlug(params.slug)
        const foundRestaurant = restaurantsData.restaurant

        if (!foundRestaurant) {
          setError('Restaurant not found')
          return
        }

        setRestaurant(foundRestaurant)
        setLoading(false)

        const menusData = await apiClient.getRestaurantMenus(params.slug)
        setMenus(menusData.menus)
        setMenusLoading(false)

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
  }, [params.slug]) // eslint-disable-line react-hooks/exhaustive-deps
  // NOTE: Removed `user` from deps - Clerk's user object changes reference frequently causing excessive API calls

  // Separate effect for admin status - uses stable primitive values instead of object reference
  useEffect(() => {
    const adminStatus = user?.publicMetadata?.role === 'admin' || false
    setIsAdminUser(adminStatus)
  }, [user?.id, user?.publicMetadata?.role])

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

  const handleTouchStart = (e: React.TouchEvent, menuId: string) => {
    if (!isAdminUser) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setIsDragging(menuId)
  }

  const handleTouchMove = (e: React.TouchEvent, menuId: string) => {
    if (!isAdminUser || isDragging !== menuId) return

    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY
    const deltaX = touchX - touchStartX.current
    const deltaY = touchY - touchStartY.current

    if (Math.abs(deltaY) < Math.abs(deltaX) && deltaX < 0) {
      setSwipeState(prev => ({ ...prev, [menuId]: Math.max(-100, deltaX) }))
    }
  }

  const handleTouchEnd = (menuId: string) => {
    if (!isAdminUser) return

    const swipeDistance = swipeState[menuId] || 0

    if (swipeDistance < -60) {
      handleDeleteImage(menuId)
    } else {
      setSwipeState(prev => ({ ...prev, [menuId]: 0 }))
    }
    setIsDragging(null)
  }

  const handleDeleteImage = async (menuId: string) => {
    if (!isAdminUser) return

    const confirmed = window.confirm('Are you sure you want to delete this menu image? This action cannot be undone.')
    if (!confirmed) {
      setSwipeState(prev => ({ ...prev, [menuId]: 0 }))
      return
    }

    try {
      const reason = window.prompt('Reason for deletion (optional):')
      await apiClient.deleteMenuImage(menuId, reason || undefined)

      setMenus(prev => prev.filter(m => m.id !== menuId))
      setSwipeState(prev => ({ ...prev, [menuId]: 0 }))

      alert('Image deleted successfully')
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('Failed to delete image: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setSwipeState(prev => ({ ...prev, [menuId]: 0 }))
    }
  }

  // Show loading only if we have NO data sources (no cache, no transition data)
  if (loading && !transitionData && !cachedStatic) {
    return (
      <div className="app-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Only show error state when loading is complete AND there's an actual error
  // AND we don't have any data to display (prevents flash of "not found")
  if (!loading && (error || !restaurant) && !transitionData && !cachedStatic) {
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
  // Priority: cached static data > transition data > fetched restaurant data > fallback
  const heroImage = cachedStatic?.imageUrl || transitionData?.imageUrl || (restaurant ? getRestaurantImageUrl(restaurant.id) : 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1000')
  const heroName = cachedStatic?.name || transitionData?.name || restaurant?.name
  const heroLocation = cachedStatic?.location || transitionData?.location || restaurant?.location

  return (
    <div className="restaurant-detail-container">
      {/* Immersive Hero Section */}
      <header className="hero-container">
        {/* Floating Navigation */}
        <div className="top-nav">
          <button className="nav-btn" onClick={() => router.back()}>
            <i className="ri-arrow-left-line"></i>
          </button>
          <button className="nav-btn">
            <i className="ri-share-forward-line"></i>
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          className="hero-img"
          alt={heroName || 'Restaurant'}
        />

        <div className="hero-overlay-gradient">
          <span className="status-badge">{isOpen ? 'Open Now' : 'Closed'}</span>
          <h1 className="court-title">{heroName}</h1>
          <div className="court-meta">
            <i className="ri-map-pin-line"></i> {heroLocation}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* View Toggle */}
        <div className="view-toggle-container">
          <button
            className={`toggle-opt ${viewMode === 'photo' ? 'active' : ''}`}
            onClick={() => setViewMode('photo')}
          >
            Photo
          </button>
          <button
            className={`toggle-opt ${viewMode === 'text' ? 'active' : ''}`}
            onClick={() => setViewMode('text')}
          >
            Text View
          </button>
        </div>

        {/* Menu Cards */}
        {menusLoading ? (
          // Shimmer loading
          <div className="menu-card">
            <div className="menu-header">
              <div className="shimmer h-5 w-32"></div>
              <div className="shimmer h-4 w-24"></div>
            </div>
            <div className="shimmer menu-image-shimmer"></div>
            <div className="contributor-row">
              <div className="shimmer h-10 w-40"></div>
            </div>
            <div className="action-grid">
              <div className="shimmer h-12"></div>
              <div className="shimmer h-12"></div>
            </div>
          </div>
        ) : menus.length > 0 ? (
          <>
            {(() => {
              const groupedMenus = groupImagesByMealType(menus)
              const getMealOrder = (): Array<'Breakfast' | 'Lunch' | 'Dinner'> => {
                const hour = new Date().getHours()
                if (hour >= 5 && hour < 11) return ['Breakfast', 'Lunch', 'Dinner']
                else if (hour >= 11 && hour < 16) return ['Lunch', 'Dinner', 'Breakfast']
                else return ['Dinner', 'Breakfast', 'Lunch']
              }
              const mealOrder = getMealOrder()

              return mealOrder.map(mealType => {
                const mealMenus = groupedMenus[mealType]
                if (mealMenus.length === 0) return null

                const mealIcon = mealType === 'Breakfast' ? 'sun-line' : mealType === 'Lunch' ? 'sun-line' : 'moon-line'
                const iconColor = mealType === 'Dinner' ? '#6366F1' : '#F59E0B'

                return mealMenus.map((menu) => (
                  <div
                    key={menu.id}
                    className="menu-card-wrapper"
                  >
                    {isAdminUser && (
                      <div className="delete-action-bg">
                        <i className="ri-delete-bin-line"></i>
                      </div>
                    )}
                    <div
                      className="menu-card"
                      style={{
                        transform: `translateX(${swipeState[menu.id] || 0}px)`,
                        transition: isDragging === menu.id ? 'none' : 'transform 0.3s ease'
                      }}
                      onTouchStart={(e) => handleTouchStart(e, menu.id)}
                      onTouchMove={(e) => handleTouchMove(e, menu.id)}
                      onTouchEnd={() => handleTouchEnd(menu.id)}
                    >
                      {/* Card Header */}
                      <div className="menu-header">
                        <div className="meal-type">
                          <i className={`ri-${mealIcon}`} style={{ color: iconColor }}></i>
                          <span>{mealType} Menu</span>
                        </div>
                        <span className="upload-time">
                          Updated {formatTimestamp(getEffectiveTimestamp(menu))}
                        </span>
                      </div>

                      {/* Photo View */}
                      {viewMode === 'photo' && (
                        <div
                          className="menu-image-container"
                          onClick={() => {
                            const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${menu.storage_path}`
                            setSelectedImage({ url: imageUrl, alt: 'Menu Photo' })
                            setViewerOpen(true)
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${menu.storage_path}`}
                            alt="Menu Photo"
                            className="menu-img"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
                            }}
                          />
                          <div className="zoom-hint">
                            <i className="ri-zoom-in-line"></i> Pinch to zoom
                          </div>
                          {isAdminUser && (
                            <div className="admin-badge-overlay">
                              <i className="ri-shield-user-line"></i> ADMIN
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text View */}
                      {viewMode === 'text' && (
                        <div className="text-view-container">
                          {menu.ocr_results ? (
                            menu.ocr_results.text.split('\n').map((line, index) => (
                              <div key={index} className="menu-item-row">
                                <span className="item-name">{line}</span>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="menu-item-row">
                                <span className="item-name">North Indian Thali</span>
                                <span className="item-price">₹75</span>
                              </div>
                              <div className="menu-item-row">
                                <span className="item-name">Paneer Butter Masala</span>
                                <span className="item-price">₹45</span>
                              </div>
                              <div className="menu-item-row">
                                <span className="item-name">Gobi Manchurian</span>
                                <span className="item-price">₹40</span>
                              </div>
                              <div className="menu-item-row">
                                <span className="item-name">Curd Rice + Pickle</span>
                                <span className="item-price">₹35</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Contributor Section */}
                      <div className="contributor-row">
                        <div className="user-profile">
                          {menu.contributor ? (
                            <>
                              {menu.contributor.is_anonymous ? (
                                <div className="user-avatar anonymous-avatar">
                                  <i className="ri-user-incognito-line"></i>
                                </div>
                              ) : menu.contributor.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={menu.contributor.avatar_url} className="user-avatar" alt={menu.contributor.display_name} />
                              ) : (
                                <div className="user-avatar avatar-placeholder">
                                  {menu.contributor.display_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                              <div className="user-text">
                                <span className="user-name">Thanks to {menu.contributor.display_name || 'Anonymous'}</span>
                                <span className="user-role">Top Contributor 🏆</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="user-avatar avatar-placeholder">U</div>
                              <div className="user-text">
                                <span className="user-name">Thanks to Contributor</span>
                                <span className="user-role">Community Member</span>
                              </div>
                            </>
                          )}
                        </div>
                        <i className="ri-more-2-fill" style={{ color: 'var(--text-muted)' }}></i>
                      </div>

                      {/* Action Buttons */}
                      <div className="action-grid">
                        <button
                          className={`btn-action btn-helpful ${userVotes[menu.id] === 'helpful' ? 'voted' : ''}`}
                          onClick={() => handleVote(menu.id, 'helpful')}
                        >
                          <i className={userVotes[menu.id] === 'helpful' ? 'ri-heart-fill' : 'ri-thumb-up-line'}></i>
                          Helpful ({helpfulVotes[menu.id]})
                        </button>
                        <button
                          className={`btn-action btn-report ${userVotes[menu.id] === 'wrong' ? 'voted' : ''}`}
                          onClick={() => handleVote(menu.id, 'wrong')}
                        >
                          <i className="ri-flag-line"></i> Wrong
                        </button>
                      </div>

                      {/* Admin Delete Button */}
                      {isAdminUser && (
                        <button
                          className="admin-delete-btn"
                          onClick={() => handleDeleteImage(menu.id)}
                        >
                          <i className="ri-delete-bin-line"></i> Delete Image
                        </button>
                      )}
                    </div>
                  </div>
                ))
              })
            })()}

            {/* Archive Section */}
            <div className="archive-section">
              <button className="accordion-btn">
                <span>See Yesterday&apos;s Menu</span>
                <i className="ri-arrow-down-s-line"></i>
              </button>
            </div>
          </>
        ) : (
          <div className="menu-card empty-state">
            <div className="empty-content">
              <i className="ri-camera-line"></i>
              <h4>No Menu Photos</h4>
              <p>No menu photos have been uploaded yet.</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {selectedImage && (
        <RestaurantImageViewer
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          isOpen={viewerOpen}
          isAdmin={isAdminUser}
          imageId={menus.find(m => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${m.storage_path}` === selectedImage.url)?.id}
          onDelete={async (imageId) => {
            const confirmed = window.confirm('Are you sure you want to delete this menu image? This action cannot be undone.')
            if (!confirmed) return

            try {
              const reason = window.prompt('Reason for deletion (optional):')
              await apiClient.deleteMenuImage(imageId, reason || undefined)

              setMenus(prev => prev.filter(m => m.id !== imageId))
              setViewerOpen(false)
              setSelectedImage(null)

              alert('Image deleted successfully')
            } catch (error) {
              console.error('Failed to delete image:', error)
              alert('Failed to delete image: ' + (error instanceof Error ? error.message : 'Unknown error'))
            }
          }}
          onClose={() => {
            setViewerOpen(false)
            setSelectedImage(null)
          }}
        />
      )}

      <style jsx>{`
        /* Design Tokens */
        .restaurant-detail-container {
          --bg-body: #FDFDE8;
          --bg-card: #F4F9F4;
          --primary-dark: #2C3E2E;
          --primary-light: #4A5D4C;
          --accent-lime: #DCEB66;
          --text-main: #1F291F;
          --text-muted: #889287;
          --radius-lg: 28px;
          --radius-pill: 999px;
          --shadow-float: 0 10px 30px rgba(44, 62, 46, 0.15);
          
          min-height: 100vh;
          background-color: var(--bg-body);
          font-family: 'DM Sans', sans-serif;
          color: var(--text-main);
          padding-bottom: 100px;
        }

        /* Animations */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Hero Section */
        .hero-container {
          position: relative;
          height: 260px;
          overflow: hidden;
          border-bottom-right-radius: 40px;
          border-bottom-left-radius: 40px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-overlay-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(to top, rgba(0,0,0,0.75), transparent);
          padding: 20px 20px 28px;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .top-nav {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          z-index: 10;
        }

        .nav-btn {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        
        .nav-btn:active {
          transform: scale(0.9);
          background: rgba(255, 255, 255, 0.4);
        }

        .status-badge {
          background: var(--accent-lime);
          color: var(--primary-dark);
          padding: 5px 12px;
          border-radius: var(--radius-pill);
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          width: fit-content;
          letter-spacing: 0.5px;
        }

        .court-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .court-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          opacity: 0.9;
        }

        /* Main Content */
        .content-wrapper {
          padding: 0 20px;
          margin-top: -28px;
          position: relative;
          z-index: 5;
        }

        /* View Toggle */
        .view-toggle-container {
          background: var(--bg-card);
          padding: 6px;
          border-radius: var(--radius-pill);
          display: flex;
          box-shadow: 0 4px 15px rgba(0,0,0,0.06);
          margin-bottom: 20px;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }

        .toggle-opt {
          padding: 10px 28px;
          border-radius: var(--radius-pill);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-opt.active {
          background: var(--primary-dark);
          color: white;
          box-shadow: 0 2px 10px rgba(44, 62, 46, 0.25);
        }

        /* Menu Card */
        .menu-card-wrapper {
          position: relative;
          overflow: visible;
          margin-bottom: 16px;
        }

        .delete-action-bg {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 100px;
          background: #EF4444;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg);
          color: white;
          font-size: 24px;
          z-index: 0;
        }

        .menu-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 16px;
          box-shadow: 0 8px 25px rgba(44, 62, 46, 0.08);
          animation: slideUp 0.5s ease-out;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }

        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .meal-type {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-dark);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .meal-type i {
          font-size: 20px;
        }

        .upload-time {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Photo View */
        .menu-image-container {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
        }

        .menu-img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.3s ease;
        }

        .menu-image-container:hover .menu-img {
          transform: scale(1.02);
        }

        .zoom-hint {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
        }

        .admin-badge-overlay {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 5px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Text View */
        .text-view-container {
          padding: 12px;
          animation: slideUp 0.3s ease-out;
        }

        .menu-item-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px dashed #E5E7EB;
          color: var(--primary-dark);
        }

        .menu-item-row:last-child {
          border-bottom: none;
        }

        .item-name {
          font-weight: 500;
          font-size: 15px;
        }

        .item-price {
          font-weight: 700;
          color: var(--primary-light);
        }

        /* Contributor Row */
        .contributor-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent-lime);
          color: var(--primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .anonymous-avatar {
          background: #E0E0E0 !important;
          color: #666666 !important;
          font-size: 18px;
        }

        .user-text {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--primary-dark);
        }

        .user-role {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Action Buttons */
        .action-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        .btn-action {
          padding: 14px;
          border-radius: 16px;
          border: none;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-action:active {
          transform: scale(0.97);
        }

        .btn-helpful {
          background: var(--accent-lime);
          color: var(--primary-dark);
        }

        .btn-helpful.voted {
          background: #2E7D32;
          color: white;
          animation: pop 0.3s ease;
        }

        .btn-report {
          background: #FFE4E1;
          color: #C62828;
        }

        .btn-report.voted {
          background: #D32F2F;
          color: white;
        }

        .admin-delete-btn {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: #EF4444;
          color: white;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        /* Archive Section */
        .archive-section {
          margin-top: 24px;
          padding: 0 8px;
        }

        .accordion-btn {
          width: 100%;
          background: transparent;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 600;
          padding: 16px 0;
          border-top: 1px solid rgba(0,0,0,0.06);
          cursor: pointer;
        }

        /* Empty State */
        .empty-state {
          opacity: 0.7;
        }

        .empty-content {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-content i {
          font-size: 32px;
          color: var(--text-muted);
          margin-bottom: 12px;
          display: block;
        }

        .empty-content h4 {
          color: var(--primary-dark);
          margin-bottom: 6px;
        }

        .empty-content p {
          font-size: 13px;
          color: var(--text-muted);
        }

        /* Shimmer Effect */
        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }

        .menu-image-shimmer {
          height: 200px;
          width: 100%;
          border-radius: 20px;
          margin-bottom: 16px;
        }

        .h-4 { height: 16px; }
        .h-5 { height: 20px; }
        .h-10 { height: 40px; }
        .h-12 { height: 48px; }
        .w-24 { width: 96px; }
        .w-32 { width: 128px; }
        .w-40 { width: 160px; }
      `}</style>
    </div>
  )
}
