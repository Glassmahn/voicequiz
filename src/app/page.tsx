'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayerStore } from '@/lib/stores/player-store'
import { sanitizeDisplayName } from '@/lib/utils'
import Avatar, { AVATAR_KEYS } from '@/components/ui/avatar'
import Logo from '@/components/ui/logo'

const GRADIENT = 'linear-gradient(135deg, #FF2D9B, #7B4FFF)'

export default function LandingPage() {
  const router = useRouter()
  const { displayName, avatar, setDisplayName, setAvatar, initialize } = usePlayerStore()
  const [name, setName] = useState(displayName)
  const [selectedAvatar, setSelectedAvatar] = useState(avatar)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { initialize() }, [initialize])
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setName(displayName)
    setSelectedAvatar(avatar)
  }, [displayName, avatar])

  useEffect(() => {
    if (showSetup && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showSetup])

  const handleContinue = (path: string) => {
    const cleaned = sanitizeDisplayName(name)
    if (!cleaned) {
      setError('Enter a name to continue')
      return
    }
    setError('')
    setDisplayName(cleaned)
    setAvatar(selectedAvatar)
    router.push(path)
  }

  const handleGetStarted = () => {
    setShowSetup(true)
  }

  if (!showSetup) {
    return (
      <div style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'fixed', top: 24, left: 28, zIndex: 10 }}>
          <Logo size="lg" />
        </div>

        {/* Hero */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 40, pointerEvents: 'none',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-bebas), sans-serif',
            fontSize: 'clamp(5rem, 18vw, 12rem)',
            lineHeight: 1, letterSpacing: '0.06em',
            background: 'linear-gradient(135deg, #fff 0%, #6EC6FF 28%, #7B4FFF 58%, #FF2D9B 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 35px rgba(255,45,155,0.75)) drop-shadow(0 0 90px rgba(123,79,255,0.45)) drop-shadow(0 0 160px rgba(110,198,255,0.25))',
            animation: 'glow 4s ease-in-out infinite',
            margin: 0,
          }}>
            VoiceQuiz
          </h1>

          <button
            onClick={handleGetStarted}
            aria-label="Get started with VoiceQuiz"
            style={{
              pointerEvents: 'all',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: '1rem', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '16px 48px', borderRadius: 12,
              border: 'none', cursor: 'pointer', color: '#fff',
              background: GRADIENT,
              boxShadow: '0 8px 32px rgba(255,45,155,0.45), 0 2px 8px rgba(0,0,0,0.5)',
              transition: 'transform 0.2s, box-shadow 0.2s, filter 0.2s',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 14px 44px rgba(255,45,155,0.7), 0 4px 14px rgba(0,0,0,0.5)'
              e.currentTarget.style.filter = 'brightness(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,45,155,0.45), 0 2px 8px rgba(0,0,0,0.5)'
              e.currentTarget.style.filter = 'none'
            }}
          >
            Get Started
          </button>
        </div>

        <style>{`
          @keyframes glow {
            0%, 100% { filter: drop-shadow(0 0 35px rgba(255,45,155,0.75)) drop-shadow(0 0 90px rgba(123,79,255,0.45)) drop-shadow(0 0 160px rgba(110,198,255,0.25)); }
            50% { filter: drop-shadow(0 0 55px rgba(255,45,155,1)) drop-shadow(0 0 120px rgba(123,79,255,0.7)) drop-shadow(0 0 200px rgba(110,198,255,0.4)); }
          }
          @media (max-width: 480px) {
            h1 { font-size: 3.5rem !important; }
          }
          @media (max-width: 360px) {
            h1 { font-size: 2.8rem !important; }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes glow { 0%, 100% { filter: none; } 50% { filter: none; } }
          }
        `}</style>
      </div>
    )
  }

  // ---- Setup panel (after clicking Get Started) ----
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
      }} />

      <div className="setup-panel" style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 420, padding: 24,
        animation: 'fadeUp 0.6s ease both',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding: '36px 32px 32px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <Logo size="lg" />
            </div>
            <p style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: '0.82rem', color: 'rgba(240,238,248,0.35)',
              margin: 0,
            }}>
              Pick your name and avatar
            </p>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.06em',
              color: 'rgba(240,238,248,0.3)',
              display: 'block', marginBottom: 8, textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}>
              Display name
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleContinue('/join')}
              placeholder="Enter your name"
              maxLength={20}
              aria-label="Display name"
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: error ? '1px solid rgba(255,45,155,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color: '#F0EEF8',
                fontSize: '0.9rem',
                fontWeight: 400,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                outline: 'none',
                transition: 'border-color 0.2s, background 0.2s',
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
            />
            {error && <p style={{ color: 'rgba(255,45,155,0.7)', fontSize: '0.75rem', marginTop: 6 }}>{error}</p>}
          </div>

          {/* Avatar */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.06em',
              color: 'rgba(240,238,248,0.3)',
              display: 'block', marginBottom: 12, textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}>
              Avatar
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="radiogroup" aria-label="Choose your avatar">
              {AVATAR_KEYS.map((key) => {
                const isSelected = selectedAvatar === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedAvatar(key)}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Avatar ${key}`}
                    style={{
                      width: 48, height: 48, borderRadius: 12,
                      border: isSelected ? '1px solid rgba(123,79,255,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      background: isSelected ? 'rgba(123,79,255,0.12)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      opacity: isSelected ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(123,79,255,0.3)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.opacity = '0.5'
                        e.currentTarget.style.transform = 'none'
                      }
                    }}
                  >
                    <Avatar avatarKey={key} size={26} />
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: -2, right: -2,
                        width: 14, height: 14, borderRadius: '50%',
                        background: '#7B4FFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none" aria-hidden="true">
                          <path d="M1.5 3.5L3 5l2.5-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => handleContinue('/host')}
              style={{
                width: '100%', padding: '14px 28px', borderRadius: 12,
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.85rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#fff',
                background: GRADIENT,
                boxShadow: '0 4px 20px rgba(255,45,155,0.2)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,45,155,0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,45,155,0.2)'
              }}
            >
              Host a quiz
            </button>

            <button
              onClick={() => handleContinue('/join')}
              style={{
                width: '100%', padding: '14px 28px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.85rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'rgba(240,238,248,0.4)',
                background: 'transparent',
                transition: 'border-color 0.15s, color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = 'rgba(240,238,248,0.7)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = 'rgba(240,238,248,0.4)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Join a game
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .setup-panel { padding: 16px !important; }
          .setup-panel > div { padding: 24px 16px !important; border-radius: 16px !important; }
        }
        @media (max-width: 360px) {
          .setup-panel { padding: 12px !important; }
          .setup-panel > div { padding: 20px 12px !important; }
        }
      `}</style>
    </div>
  )
}
