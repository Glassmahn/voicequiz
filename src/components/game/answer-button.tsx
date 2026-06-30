'use client'

import { useState } from 'react'

export type AnswerState = 'default' | 'selected' | 'correct' | 'wrong'

interface AnswerButtonProps {
  letter: string
  text: string
  state: AnswerState
  onClick: () => void
  disabled: boolean
}

const STATE_STYLES: Record<AnswerState, { border: string; bg: string; color: string; letterColor: string }> = {
  default: {
    border: 'rgba(255,255,255,0.08)',
    bg: 'transparent',
    color: '#F0EEF8',
    letterColor: 'rgba(240,238,248,0.45)',
  },
  selected: {
    border: 'rgba(123,79,255,0.5)',
    bg: 'rgba(123,79,255,0.1)',
    color: '#F0EEF8',
    letterColor: '#7B4FFF',
  },
  correct: {
    border: 'rgba(0,255,136,0.4)',
    bg: 'rgba(0,255,136,0.08)',
    color: '#00FF88',
    letterColor: '#00FF88',
  },
  wrong: {
    border: 'rgba(255,45,155,0.3)',
    bg: 'rgba(255,45,155,0.06)',
    color: 'rgba(255,45,155,0.6)',
    letterColor: 'rgba(255,45,155,0.6)',
  },
}

export default function AnswerButton({ letter, text, state, onClick, disabled }: AnswerButtonProps) {
  const s = STATE_STYLES[state]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        borderRadius: 10,
        padding: '16px 20px',
        background: s.bg,
        cursor: disabled ? 'default' : 'pointer',
        border: `1px solid ${s.border}`,
        textAlign: 'left',
        fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 'clamp(0.85rem, 1.4vw, 0.95rem)',
        fontWeight: 500,
        color: state === 'wrong' ? 'rgba(255,45,155,0.5)' : s.color,
        letterSpacing: '0.01em',
        opacity: state === 'wrong' ? 0.5 : 1,
        transition: 'all 0.15s ease',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
      onMouseEnter={(e) => {
        if (state === 'default' && !disabled) {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        }
      }}
      onMouseLeave={(e) => {
        if (state === 'default' && !disabled) {
          e.currentTarget.style.borderColor = STATE_STYLES.default.border
          e.currentTarget.style.background = STATE_STYLES.default.bg
        }
      }}
    >
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: 8,
        background: state === 'default' ? 'rgba(255,255,255,0.06)' : undefined,
        border: state === 'default' ? '1px solid rgba(255,255,255,0.08)' : 'none',
        fontFamily: "var(--font-jetbrains), monospace",
        fontSize: '0.7rem',
        fontWeight: 600,
        color: state === 'default' ? 'rgba(240,238,248,0.45)' : s.letterColor,
        flexShrink: 0,
      }}>
        {letter}
      </span>
      {text}
    </button>
  )
}
