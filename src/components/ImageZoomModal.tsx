'use client'

import { useState, useEffect, useRef } from 'react'

interface ImageZoomModalProps {
    imageUrl: string
    altText?: string
    onClose: () => void
}

export default function ImageZoomModal({ imageUrl, altText = 'Menu Image', onClose }: ImageZoomModalProps) {
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const imageRef = useRef<HTMLDivElement>(null)
    const touchStartDistance = useRef<number>(0)

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    // Handle keyboard events (ESC to close)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // Calculate distance between two touch points
    const getTouchDistance = (touches: React.TouchList) => {
        if (touches.length < 2) return 0
        const dx = touches[0].clientX - touches[1].clientX
        const dy = touches[0].clientY - touches[1].clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    // Handle pinch zoom
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            touchStartDistance.current = getTouchDistance(e.touches)
        } else if (e.touches.length === 1) {
            setIsDragging(true)
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            })
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch zoom
            const currentDistance = getTouchDistance(e.touches)
            const scaleChange = currentDistance / touchStartDistance.current
            const newScale = Math.min(Math.max(scale * scaleChange, 1), 5)
            setScale(newScale)
            touchStartDistance.current = currentDistance
        } else if (e.touches.length === 1 && isDragging && scale > 1) {
            // Pan
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            })
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        touchStartDistance.current = 0
    }

    // Handle mouse events for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true)
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            })
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Handle wheel zoom for desktop
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const newScale = Math.min(Math.max(scale * delta, 1), 5)
        setScale(newScale)

        // Reset position when zooming out to 1x
        if (newScale === 1) {
            setPosition({ x: 0, y: 0 })
        }
    }

    // Zoom controls
    const handleZoomIn = () => {
        const newScale = Math.min(scale + 0.5, 5)
        setScale(newScale)
    }

    const handleZoomOut = () => {
        const newScale = Math.max(scale - 0.5, 1)
        setScale(newScale)
        if (newScale === 1) {
            setPosition({ x: 0, y: 0 })
        }
    }

    const handleReset = () => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
    }

    return (
        <div className="image-zoom-modal" onClick={onClose}>
            {/* Header */}
            <div className="zoom-header" onClick={(e) => e.stopPropagation()}>
                <button className="zoom-close-btn" onClick={onClose}>
                    <i className="ri-close-line"></i>
                </button>
                <div className="zoom-controls">
                    <button className="zoom-control-btn" onClick={handleZoomOut} disabled={scale <= 1}>
                        <i className="ri-subtract-line"></i>
                    </button>
                    <span className="zoom-level">{Math.round(scale * 100)}%</span>
                    <button className="zoom-control-btn" onClick={handleZoomIn} disabled={scale >= 5}>
                        <i className="ri-add-line"></i>
                    </button>
                    <button className="zoom-control-btn" onClick={handleReset}>
                        <i className="ri-refresh-line"></i>
                    </button>
                </div>
            </div>

            {/* Image Container */}
            <div
                ref={imageRef}
                className="zoom-image-container"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
            >
                <img
                    src={imageUrl}
                    alt={altText}
                    className="zoom-image"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                    draggable={false}
                />
            </div>

            {/* Instructions */}
            {scale === 1 && (
                <div className="zoom-instructions" onClick={(e) => e.stopPropagation()}>
                    <i className="ri-information-line"></i>
                    <span>Pinch to zoom • Scroll to zoom • Drag to pan</span>
                </div>
            )}

            <style jsx>{`
        .image-zoom-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          touch-action: none;
        }

        .zoom-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10000;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
        }

        .zoom-close-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .zoom-close-btn:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.3);
        }

        .zoom-controls {
          display: flex;
          gap: 8px;
          align-items: center;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 12px;
          border-radius: 24px;
        }

        .zoom-control-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .zoom-control-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .zoom-control-btn:not(:disabled):active {
          transform: scale(0.9);
          background: rgba(255, 255, 255, 0.3);
        }

        .zoom-level {
          color: white;
          font-size: 14px;
          font-weight: 600;
          min-width: 50px;
          text-align: center;
        }

        .zoom-image-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .zoom-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-select: none;
          transform-origin: center center;
        }

        .zoom-instructions {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 20px;
          border-radius: 24px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 10000;
        }

        .zoom-instructions i {
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .zoom-header {
            padding: 12px;
          }

          .zoom-controls {
            padding: 6px 10px;
          }

          .zoom-control-btn {
            width: 28px;
            height: 28px;
            font-size: 16px;
          }

          .zoom-level {
            font-size: 12px;
            min-width: 45px;
          }

          .zoom-instructions {
            font-size: 11px;
            padding: 10px 16px;
            bottom: 16px;
          }
        }
      `}</style>
        </div>
    )
}
