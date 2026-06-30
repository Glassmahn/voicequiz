'use client'

import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export default function Input({ error, style, ...props }: InputProps) {
  return (
    <div>
      <input
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: error
            ? '1px solid rgba(255,45,155,0.5)'
            : '1px solid rgba(255,255,255,0.08)',
          color: '#F0EEF8',
          fontSize: '0.9rem',
          fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
          ...style,
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = 'rgba(123,79,255,0.4)'
            e.target.style.background = 'rgba(255,255,255,0.06)'
          }
        }}
        onBlur={(e) => {
          e.target.style.background = 'rgba(255,255,255,0.04)'
          if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.08)'
        }}
        {...props}
      />
      {error && (
        <p style={{ color: 'rgba(255,45,155,0.7)', fontSize: '0.78rem', marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  )
}
