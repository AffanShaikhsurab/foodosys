'use client'

import { useState, useEffect } from 'react'
import { useLocation } from '@/hooks/useLocation'

export default function LocationPermissionPrompt() {
  const { location, isLoading, requestLocation } = useLocation()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Show prompt if location is not available and hasn't been dismissed
    if (!isDismissed && !location && !isLoading) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 1500) // Show after 1.5 seconds
      
      return () => clearTimeout(timer)
    } else if (!isDismissed && location?.error) {
      setShowPrompt(true)
    } else if (location && !location.error) {
      setShowPrompt(false)
    }
  }, [location, isLoading, isDismissed])

  const handleRequestLocation = () => {
    requestLocation()
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setIsDismissed(true)
  }

  if (!showPrompt) {
    return null
  }

  return (
    <>
      <div className="location-prompt-overlay" onClick={handleDismiss}></div>
      <div className="location-permission-popup">
        <button className="popup-close" onClick={handleDismiss}>
          <i className="ri-close-line"></i>
        </button>
        <div className="popup-icon">
          <i className="ri-map-pin-line"></i>
        </div>
        <h3>Enable Location</h3>
        <p>
          {location?.error ? 
            'Please allow location permissions so you can see how far you are from each restaurant.' :
            'Please allow location permissions so you can see how far you are from each restaurant.'
          }
        </p>
        <button 
          className="btn-primary"
          onClick={handleRequestLocation}
          disabled={isLoading}
        >
          {isLoading ? 'Getting Location...' : 'Allow Location'}
        </button>
        {location?.error && (
          <p className="error-text" style={{ fontSize: '12px', marginTop: '8px', color: '#dc2626' }}>{location.error}</p>
        )}
      </div>
      <style jsx>{`
        .location-prompt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          backdrop-filter: blur(4px);
        }
        
        .location-permission-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 20px;
          padding: 32px 24px;
          max-width: 340px;
          width: 90%;
          z-index: 1000;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        
        .popup-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          font-size: 24px;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-center;
          transition: color 0.2s;
        }
        
        .popup-close:hover {
          color: #4b5563;
        }
        
        .popup-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #84cc16, #65a30d);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 32px;
          color: white;
        }
        
        .location-permission-popup h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }
        
        .location-permission-popup p {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        
        .btn-primary {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #84cc16, #65a30d);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(132, 204, 22, 0.3);
        }
        
        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}