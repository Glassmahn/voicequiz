'use client'

interface RoomCodeDisplayProps {
  code: string
  size?: 'sm' | 'lg'
}

export default function RoomCodeDisplay({ code, size = 'lg' }: RoomCodeDisplayProps) {
  const fontSize = size === 'lg' ? '1.8rem' : '0.7rem'

  return (
    <div aria-label={`Room code: ${code}`} style={{
      fontFamily: "var(--font-jetbrains), monospace",
      fontSize,
      letterSpacing: '0.12em',
      color: '#7B4FFF',
      textAlign: 'center',
    }}>
      <span style={{
        opacity: 0.35,
        fontSize: size === 'lg' ? '0.55rem' : '0.55rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: size === 'lg' ? 4 : 0,
        fontFamily: "'SF Pro Text', sans-serif",
      }}>
        Room code
      </span>
      {code}
    </div>
  )
}
