'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface QRScannerProps {
    isOpen: boolean
    onClose: () => void
}

export default function QRScanner({ isOpen, onClose }: QRScannerProps) {
    const router = useRouter()
    const [isScanning, setIsScanning] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsScanning(true)
        } else {
            setIsScanning(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleClose = () => {
        setIsScanning(false)
        setTimeout(() => {
            onClose()
        }, 300)
    }

    return (
        <div className={`scan-overlay ${isScanning ? 'visible' : ''}`}>
            <h2 style={{ marginBottom: '20px', color: 'var(--primary-dark)', fontWeight: 700, fontSize: '24px' }}>
                Scan QR Code
            </h2>

            <div className="scan-frame">
                <div className="scan-line"></div>

                {/* Corner decorations */}
                <div className="scan-corner scan-corner-tl"></div>
                <div className="scan-corner scan-corner-tr"></div>
                <div className="scan-corner scan-corner-bl"></div>
                <div className="scan-corner scan-corner-br"></div>
            </div>

            <p style={{
                marginTop: '20px',
                fontWeight: 500,
                color: 'var(--primary-dark)',
                fontSize: '16px'
            }}>
                Point at any mess QR
            </p>

            <button
                onClick={handleClose}
                style={{
                    marginTop: '40px',
                    padding: '12px 24px',
                    background: 'var(--primary-dark)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 4px 12px rgba(44, 62, 46, 0.3)'
                }}
                onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)'
                }}
                onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                }}
            >
                Close Scanner
            </button>
        </div>
    )
}
