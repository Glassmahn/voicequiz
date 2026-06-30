'use client'

import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: 600,
    letterSpacing: '0.01em',
    borderRadius: 10,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    color: variant === 'primary' ? '#fff' : variant === 'ghost' ? 'rgba(240,238,248,0.45)' : 'rgba(240,238,248,0.6)',
    background: variant === 'primary'
      ? 'linear-gradient(135deg, #FF2D9B, #7B4FFF)'
      : 'transparent',
    border: variant === 'secondary' ? '1px solid rgba(255,255,255,0.1)' : 'none',
    opacity: disabled || loading ? 0.4 : 1,
    transition: 'all 0.15s ease',
    ...(size === 'sm' ? { padding: '8px 18px', fontSize: '0.8rem' } : {}),
    ...(size === 'md' ? { padding: '12px 28px', fontSize: '0.85rem' } : {}),
    ...(size === 'lg' ? { padding: '14px 36px', fontSize: '0.9rem' } : {}),
    ...style,
  }

  return (
    <button
      style={base}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          if (variant === 'primary') {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,45,155,0.3)'
          } else if (variant === 'secondary') {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.color = 'rgba(240,238,248,0.8)'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'none'
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = 'none'
          } else if (variant === 'secondary') {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'rgba(240,238,248,0.6)'
          }
        }
      }}
      {...props}
    >
      {loading ? 'Loading\u2026' : children}
    </button>
  )
}
