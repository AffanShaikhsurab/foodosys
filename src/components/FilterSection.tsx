'use client'

import { useState } from 'react'

export default function FilterSection() {
  const [activeFilter, setActiveFilter] = useState('Nearest First')
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  
  const filters = ['Nearest First', 'Vegetarian', 'Wait Time']
  
  const handleFilterClick = (filter: string) => {
    if (filter === 'Wait Time' || filter === 'Vegetarian') {
      setSelectedFeature(filter)
      setShowComingSoon(true)
    } else {
      setActiveFilter(filter)
    }
  }

  const getModalContent = () => {
    if (selectedFeature === 'Wait Time') {
      return {
        emoji: '⏱️',
        title: 'Coming Soon',
        description: 'Wait time tracking is under development. We\'re working hard to bring this feature to you soon!'
      }
    } else if (selectedFeature === 'Vegetarian') {
      return {
        emoji: '🥗',
        title: 'Coming Soon',
        description: 'Vegetarian menu filtering is on its way. Soon you\'ll be able to filter and find vegetarian options easily!'
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
      <div className="filter-scroller">
        {filters.map((filter) => (
          <div
            key={filter}
            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => handleFilterClick(filter)}
            style={{ cursor: 'pointer', opacity: (filter === 'Wait Time' || filter === 'Vegetarian') ? 0.7 : 1 }}
          >
            {filter}
          </div>
        ))}
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '320px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#DCEB66',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px'
            }}>
              {modalContent.emoji}
            </div>
            
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#2C3E2E',
              marginBottom: '8px'
            }}>
              {modalContent.title}
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: '#889287',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              {modalContent.description}
            </p>
            
            <button
              onClick={() => setShowComingSoon(false)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#2C3E2E',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a2620'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2C3E2E'}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}