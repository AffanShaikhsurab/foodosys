'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentMealType } from '@/lib/meal-menu-availability'

interface Court {
    id: number
    name: string
    location: string
    distance: string
    status: 'available' | 'missing'
    imageUrl: string
    heroImageUrl?: string
    slug?: string
    hasCurrentMealMenu?: boolean
    availableMealTypes?: string[]
    menuSnippet?: string
    lastUpdated?: string
}

interface CourtCardProps {
    court: Court
    animationDelay?: number
    onCardClick?: (element: HTMLElement, court: Court) => void
}

function getCurrentMealTypeLabel(): string {
    return getCurrentMealType()
}

function getTimeAgo(minutes: number): string {
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
}

export default function CourtCard({ court, animationDelay = 0, onCardClick }: CourtCardProps) {
    const router = useRouter()
    const cardRef = useRef<HTMLElement>(null)
    const isMissing = court.status === 'missing'

    const handleCardClick = () => {
        if (court.slug && cardRef.current) {
            if (onCardClick) {
                onCardClick(cardRef.current, court)
            } else {
                router.push(`/restaurants/${court.slug}`)
            }
        }
    }

    const handleUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        router.push('/upload')
    }

    return (
        <article
            ref={cardRef}
            className={`mess-card click-active ${isMissing ? 'missing' : ''}`}
            style={{ animationDelay: `${animationDelay}s` }}
            onClick={handleCardClick}
        >
            {/* Card Top: Image + Info */}
            <div className="card-top">
                <img
                    src={court.imageUrl}
                    className="card-img"
                    alt={court.name}
                    style={isMissing ? { filter: 'grayscale(1)', opacity: 0.6 } : {}}
                />
                <div className="card-info">
                    <div className="card-header">
                        <span className={`mess-name ${isMissing ? 'muted' : ''}`}>
                            {court.name}
                        </span>
                        <div className="walk-badge">
                            <i className="ri-walk-line"></i> {court.distance}
                        </div>
                    </div>
                    <span className="location-text">{court.location}</span>
                </div>
            </div>

            {/* Menu Snippet */}
            <div className="menu-snippet">
                {isMissing ? (
                    <>
                        <i className="ri-error-warning-fill"></i> No {getCurrentMealTypeLabel().toLowerCase()} menu uploaded yet.
                    </>
                ) : court.menuSnippet ? (
                    <>
                        Today: <strong>{court.menuSnippet}</strong>
                    </>
                ) : court.hasCurrentMealMenu ? (
                    <>
                        <i className="ri-check-line" style={{ color: 'var(--status-success-txt)' }}></i> {getCurrentMealTypeLabel()} menu is available
                    </>
                ) : (
                    <>
                        <i className="ri-time-line"></i> Menu available for other meals
                    </>
                )}
            </div>

            {/* Card Footer */}
            <div className="card-footer">
                {isMissing ? (
                    <>
                        <span className="location-text">Are you nearby?</span>
                        <button className="upload-cta-small" onClick={handleUploadClick}>
                            <i className="ri-camera-lens-line"></i> Upload
                        </button>
                    </>
                ) : (
                    <>
                        <div className={`status-indicator ${court.hasCurrentMealMenu ? 'live' : ''}`}>
                            {court.hasCurrentMealMenu && <div className="dot"></div>}
                            <span>{court.hasCurrentMealMenu ? 'Live Menu' : 'Menu Available'}</span>
                            {court.lastUpdated && (
                                <span className="time-ago">{court.lastUpdated}</span>
                            )}
                        </div>
                        <i className="ri-arrow-right-circle-line card-arrow"></i>
                    </>
                )}
            </div>
        </article>
    )
}