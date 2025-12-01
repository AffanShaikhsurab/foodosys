'use client'

import { useState, useEffect, useRef } from 'react'

interface ImageViewerProps {
    imageUrl: string
    alt: string
    isOpen: boolean
    onClose: () => void
}

export default function ImageViewer({ imageUrl, alt, isOpen, onClose }: ImageViewerProps) {
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const imageRef = useRef<HTMLDivElement>(null)

    // Reset zoom and position when modal opens
    useEffect(() => {
        if (isOpen) {
            setScale(1)
            setPosition({ x: 0, y: 0 })
        }
    }, [isOpen])

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault()
                handleZoomIn()
            } else if (e.key === '-') {
                e.preventDefault()
                handleZoomOut()
            } else if (e.key === '0') {
                e.preventDefault()
                handleResetZoom()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, scale])

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.5, 5))
    }

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.5, 0.5))
    }

    const handleResetZoom = () => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setScale(prev => Math.max(0.5, Math.min(5, prev + delta)))
    }

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

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scale > 1 && e.touches.length === 1) {
            setIsDragging(true)
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            })
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && scale > 1 && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            })
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/30 transition-colors"
                    aria-label="Go back"
                >
                    <i className="ri-arrow-left-line text-xl"></i>
                </button>
                <div className="text-white text-sm font-medium">
                    {alt}
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/30 transition-colors"
                    aria-label="Close viewer"
                >
                    <i className="ri-close-line text-xl"></i>
                </button>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-4 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleZoomOut()
                    }}
                    className="text-white hover:text-gray-300 transition-colors p-2"
                    aria-label="Zoom out"
                >
                    <i className="ri-subtract-line text-xl"></i>
                </button>

                <div className="text-white text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleZoomIn()
                    }}
                    className="text-white hover:text-gray-300 transition-colors p-2"
                    aria-label="Zoom in"
                >
                    <i className="ri-add-line text-xl"></i>
                </button>

                <div className="w-px h-6 bg-white/30"></div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleResetZoom()
                    }}
                    className="text-white hover:text-gray-300 transition-colors p-2"
                    aria-label="Reset zoom"
                >
                    <i className="ri-refresh-line text-xl"></i>
                </button>
            </div>

            {/* Image Container */}
            <div
                ref={imageRef}
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
            >
                <img
                    src={imageUrl}
                    alt={alt}
                    className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        transformOrigin: 'center center'
                    }}
                    draggable={false}
                />
            </div>

            {/* Help Text */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs z-10 opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                    <span>Scroll to zoom</span>
                    <span>•</span>
                    <span>Drag to pan</span>
                    <span>•</span>
                    <span>ESC to close</span>
                </div>
            </div>
        </div>
    )
}
