'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const SIZES = { sm: 28, md: 36, lg: 44 }
const ICON_SIZES = { sm: 14, md: 18, lg: 22 }
const TEXT_SIZES = { sm: '1rem', md: '1.25rem', lg: '1.5rem' }

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const box = SIZES[size]
  const iconSize = ICON_SIZES[size]
  const textSize = TEXT_SIZES[size]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        aria-hidden="true"
        style={{
          width: box,
          height: box,
          borderRadius: box * 0.28,
          background: 'linear-gradient(135deg, #FF2D9B, #7B4FFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 18px rgba(255,45,155,0.4)',
          flexShrink: 0,
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 17V7l7 5-7 5z" fill="white" opacity={0.9} />
          <path d="M13 17V7l7 5-7 5z" fill="white" opacity={0.55} />
        </svg>
      </div>
      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-bebas), sans-serif',
            fontSize: textSize,
            letterSpacing: '0.08em',
            background: 'linear-gradient(90deg, #FF2D9B, #7B4FFF, #6EC6FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
          }}
        >
          VoiceQuiz
        </span>
      )}
    </div>
  )
}
