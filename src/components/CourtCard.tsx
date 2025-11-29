'use client'

import { useRouter } from 'next/navigation'

interface Court {
  id: number
  name: string
  location: string
  distance: string
  status: 'available' | 'missing'
  imageUrl: string
  slug?: string
}

interface CourtCardProps {
  court: Court
}

export default function CourtCard({ court }: CourtCardProps) {
  const router = useRouter()
  const isMissing = court.status === 'missing'
  
  const handleCardClick = () => {
    if (court.slug) {
      router.push(`/restaurants/${court.slug}`)
    }
  }
  
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMissing) {
      router.push('/upload')
    } else if (court.slug) {
      router.push(`/restaurants/${court.slug}`)
    }
  }
  
  return (
    <div 
      className={`court-card ${isMissing ? 'missing-card' : ''}`}
      style={isMissing ? { background: '#F8F8F4', border: '1px dashed #d1d1d1' } : {}}
      onClick={handleCardClick}
    >
      <div 
        className="court-image" 
        style={{ 
          backgroundImage: `url('${court.imageUrl}')`,
          ...(isMissing ? { filter: 'grayscale(100%)', opacity: '0.6' } : {})
        }}
      />
      <div className="court-info">
        <div className="court-header">
          <span className="court-name" style={isMissing ? { color: '#666' } : {}}>
            {court.name}
          </span>
          <span className="distance-badge">{court.distance}</span>
        </div>
        <div className="court-location">{court.location}</div>
        <div className={`court-status status-${court.status}`}>
          <div className="status-dot"></div>
          {court.status === 'available' ? 'Menu Available' : 'Needs Update'}
        </div>
      </div>
      <button 
        className="btn-mini" 
        style={isMissing ? { background: 'var(--accent-lime)', color: 'var(--primary-dark)' } : {}}
        onClick={handleActionClick}
      >
        <i className={isMissing ? 'ri-camera-line' : 'ri-arrow-right-line'}></i>
      </button>
    </div>
  )
}