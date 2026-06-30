'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'error' | 'success' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'error', onClose, duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const colors = {
    error: { bg: 'rgba(255,45,155,0.1)', border: 'rgba(255,45,155,0.3)' },
    success: { bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)' },
    info: { bg: 'rgba(110,198,255,0.1)', border: 'rgba(110,198,255,0.3)' },
  }

  const c = colors[type]

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '12'}px)`,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: '12px 20px',
        color: '#F0EEF8',
        fontSize: '0.85rem',
        fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        zIndex: 1000,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s, transform 0.2s',
        backdropFilter: 'blur(12px)',
        maxWidth: '90vw',
        textAlign: 'center',
        lineHeight: 1.4,
      }}
    >
      {message}
    </div>
  )
}
