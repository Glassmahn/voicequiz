'use client'

import Avatar from '@/components/ui/avatar'

interface LeaderboardProps {
  players: Array<{
    avatar: string
    display_name: string
    score: number
    player_id: string
  }>
  currentPlayerId?: string
}

const MEDALS = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  if (players.length === 0) return null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px 32px' }}>
      <div style={{
        fontFamily: "var(--font-jetbrains), monospace",
        fontSize: '0.6rem',
        letterSpacing: '0.12em',
        color: 'rgba(240,238,248,0.2)',
        marginBottom: 12,
        textTransform: 'uppercase',
      }}>
        Live scores
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        background: 'rgba(255,255,255,0.015)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.04)',
        padding: 10,
      }}>
        {sorted.slice(0, 8).map((p, i) => {
          const isMe = p.player_id === currentPlayerId
          const isMedal = i < 3
          return (
            <div
              key={p.player_id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                borderRadius: 8,
                padding: '8px 12px',
                background: isMe ? 'rgba(123,79,255,0.08)' : 'transparent',
                border: isMe ? '1px solid rgba(123,79,255,0.15)' : '1px solid transparent',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              {/* Rank */}
              <span style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: '0.7rem',
                fontWeight: isMedal ? 600 : 400,
                color: isMedal ? MEDALS[i] : 'rgba(240,238,248,0.25)',
                width: 20,
                textAlign: 'center',
              }}>
                {i + 1}
              </span>

              <Avatar avatarKey={p.avatar} size={22} />

              <span style={{
                flex: 1,
                fontSize: '0.78rem',
                fontWeight: isMe ? 600 : 500,
                color: '#F0EEF8',
                textAlign: 'left',
              }}>
                {p.display_name}
              </span>

              <span style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: '0.72rem',
                fontWeight: 500,
                color: isMe ? 'rgba(123,79,255,0.8)' : 'rgba(240,238,248,0.35)',
              }}>
                {p.score.toLocaleString()}
              </span>
            </div>
          )
        })}
        {sorted.length > 8 && (
          <div style={{
            textAlign: 'center', fontSize: '0.7rem',
            color: 'rgba(240,238,248,0.2)',
            padding: '4px 0',
            fontFamily: "var(--font-jetbrains), monospace",
          }}>
            +{sorted.length - 8} more
          </div>
        )}
      </div>
    </div>
  )
}
