'use client'

import { useState } from 'react'

export type DietFilter = 'all' | 'veg' | 'nonveg'

interface FilterSectionProps {
  onFilterChange?: (filter: DietFilter) => void
}

export default function FilterSection({ onFilterChange }: FilterSectionProps) {
  const [activeFilter, setActiveFilter] = useState<DietFilter>('all')
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const handleFilterClick = (filter: DietFilter) => {
    // For now, veg and nonveg trigger coming soon modal
    if (filter === 'veg' || filter === 'nonveg') {
      setSelectedFeature(filter)
      setShowComingSoon(true)
    } else {
      setActiveFilter(filter)
      onFilterChange?.(filter)
      // Haptic feedback simulation
      if (navigator.vibrate) navigator.vibrate(5)
    }
  }

  const getModalContent = () => {
    if (selectedFeature === 'veg') {
      return {
        emoji: '🥗',
        title: 'Coming Soon',
        description: 'Vegetarian filtering is on its way. Soon you\'ll be able to filter and find vegetarian options easily!'
      }
    } else if (selectedFeature === 'nonveg') {
      return {
        emoji: '🍗',
        title: 'Coming Soon',
        description: 'Non-vegetarian filtering is under development. We\'re working hard to bring this feature to you soon!'
      }
    }
    return {
      emoji: '🚀',
      title: 'Coming Soon',
      description: 'This feature is coming soon!'
    }
  }

  const modalContent = getModalContent()

  return (
    <>
      <section className="toggle-container step-filter-section">
        <button
          className={`toggle-btn click-active ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          <i className="ri-restaurant-line"></i> All
        </button>
        <button
          className={`toggle-btn veg click-active ${activeFilter === 'veg' ? 'active' : ''}`}
          onClick={() => handleFilterClick('veg')}
        >
          <i className="ri-leaf-line"></i> Veg
        </button>
        <button
          className={`toggle-btn nonveg click-active ${activeFilter === 'nonveg' ? 'active' : ''}`}
          onClick={() => handleFilterClick('nonveg')}
        >
          <i className="ri-chicken-line"></i> Non-Veg
        </button>
      </section>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="modal-overlay" onClick={() => setShowComingSoon(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              {modalContent.emoji}
            </div>

            <h3>{modalContent.title}</h3>

            <p>{modalContent.description}</p>

            <button
              className="modal-btn"
              onClick={() => setShowComingSoon(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}