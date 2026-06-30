'use client'

const AVATAR_DESIGNS: Record<string, (color: string) => React.ReactNode> = {
  a0: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={c} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" fill={c} />
    </svg>
  ),
  a1: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M6 26L16 4l10 22H6z" stroke={c} strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="17" r="2" fill={c} />
    </svg>
  ),
  a2: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="6" y="6" width="20" height="20" rx="3" stroke={c} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2" fill={c} />
    </svg>
  ),
  a3: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M16 4l10 7v10l-10 7-10-7V11l10-7z" stroke={c} strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="16" r="2" fill={c} />
    </svg>
  ),
  a4: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="6" y="12" width="20" height="8" rx="2" stroke={c} strokeWidth="1.5" />
      <circle cx="12" cy="16" r="1.5" fill={c} />
      <circle cx="20" cy="16" r="1.5" fill={c} />
    </svg>
  ),
  a5: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" stroke={c} strokeWidth="1.5" />
      <circle cx="16" cy="11" r="2" fill={c} />
      <circle cx="16" cy="21" r="2" fill={c} />
      <circle cx="11" cy="16" r="2" fill={c} />
      <circle cx="21" cy="16" r="2" fill={c} />
    </svg>
  ),
  a6: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M16 4l3.5 7h7.5l-6 5.5 2.5 8L16 20l-7.5 4.5 2.5-8L5 11h7.5L16 4z" stroke={c} strokeWidth="1.3" fill="none" />
    </svg>
  ),
  a7: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="11" stroke={c} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="5" stroke={c} strokeWidth="1.5" />
    </svg>
  ),
  a8: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M16 4v24M4 16h24" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2" fill={c} />
    </svg>
  ),
  a9: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M4 20c4-8 8-8 12 0s8 8 12 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="20" r="2" fill={c} />
      <circle cx="22" cy="20" r="2" fill={c} />
    </svg>
  ),
}

const COLORS = ['#FF2D9B', '#7B4FFF', '#6EC6FF', '#00FF88', '#FF6B35', '#00D4FF', '#FF4081', '#651FFF', '#00E676', '#FFD700']

export function getAvatarColor(key: string): string {
  const idx = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length
  return COLORS[idx]
}

export function getAvatarDesign(key: string): React.ReactNode | null {
  const design = AVATAR_DESIGNS[key]
  if (!design) return null
  return design(getAvatarColor(key))
}

export const AVATAR_KEYS = Object.keys(AVATAR_DESIGNS)

export function getRandomAvatarKey(): string {
  return AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)]
}

interface AvatarProps {
  avatarKey: string
  size?: number
  label?: string
}

export default function Avatar({ avatarKey, size = 32, label }: AvatarProps) {
  const design = AVATAR_DESIGNS[avatarKey]
  const color = getAvatarColor(avatarKey)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${color}12`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
      }}
      title={label}
    >
      {design ? (
        <div style={{ width: size * 0.6, height: size * 0.6, color }}>
          {design(color)}
        </div>
      ) : (
        <span style={{
          fontFamily: "'SF Pro Text', sans-serif",
          fontSize: size * 0.35,
          fontWeight: 600,
          color,
        }}>
          ?
        </span>
      )}
    </div>
  )
}
