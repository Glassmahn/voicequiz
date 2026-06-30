'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/game-store'
import { usePlayerStore } from '@/lib/stores/player-store'
import Button from '@/components/ui/button'
import Avatar from '@/components/ui/avatar'
import { RoomSkeleton } from '@/components/ui/skeleton'
import confetti from 'canvas-confetti'

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function HostResultsPage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string
  const { playerId } = usePlayerStore()
  const { room, players, setPlayers, reset } = useGameStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId || !roomCode) return

    const load = async () => {
      const { data: roomData } = await getSupabase()
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .maybeSingle()

      if (!roomData || roomData.host_player_id !== playerId) {
        router.push('/')
        return
      }

      const { data: playersData } = await getSupabase()
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('score', { ascending: false })

      setPlayers(playersData || [])
      setLoading(false)

      const sorted = [...(playersData || [])].sort((a: any, b: any) => b.score - a.score)
      if (sorted[0]) {
        setTimeout(() => {
          confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } })
          setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.4 } }), 400)
          setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 } }), 800)
        }, 500)
      }
    }

    load()
  }, [playerId, roomCode])

  const handlePlayAgain = () => {
    reset()
    router.push('/host')
  }

  const handleHome = () => {
    reset()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RoomSkeleton />
      </div>
    )
  }

  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="host-results" style={{ minHeight: '100vh', background: 'var(--bg)', padding: 32 }}>
      <div className="results-content" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
        <h1 style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: 'clamp(2rem, 5vw, 2.5rem)',
          fontWeight: 700,
          color: '#F0EEF8',
          marginBottom: 4,
        }}>
          Game over
        </h1>

        <p style={{ color: 'rgba(240,238,248,0.3)', marginBottom: 32, fontSize: 'clamp(0.8rem, 3vw, 0.85rem)' }}>
          {room?.title}
        </p>

        <div style={{ marginBottom: 32 }}>
          {sorted[0] && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: 16,
              padding: 'clamp(24px, 5vw, 32px)',
              marginBottom: 20,
              position: 'relative',
              overflow: 'hidden',
              animation: 'scaleIn 0.4s ease both 0.1s',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                fontSize: '5rem', opacity: 0.1, lineHeight: 1,
                userSelect: 'none', pointerEvents: 'none',
              }}>
                &#127942;
              </div>
              <Avatar avatarKey={sorted[0].avatar} size={64} />
              <div style={{ fontSize: 'clamp(1rem, 4vw, 1.1rem)', fontWeight: 600, color: '#F0EEF8', marginTop: 12, marginBottom: 2 }}>
                {sorted[0].display_name}
              </div>
              <div style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 'clamp(1.5rem, 6vw, 2rem)',
                color: '#FFD700',
                fontWeight: 600,
              }}>
                {sorted[0].score.toLocaleString()}
              </div>
              <div style={{
                color: 'rgba(255,215,0,0.4)',
                fontSize: '0.7rem',
                marginTop: 4,
                fontFamily: "var(--font-jetbrains), monospace",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Winner
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.slice(1).map((p, i) => {
              const rank = i + 2
              const isMedal = rank <= 3
              return (
                <div key={p.player_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  animation: `fadeIn 0.3s ease both ${0.15 + i * 0.05}s`,
                }}>
                  <span style={{
                    color: isMedal ? MEDAL_COLORS[i] : 'rgba(240,238,248,0.2)',
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: '0.78rem',
                    fontWeight: isMedal ? 600 : 400,
                    width: 28,
                    textAlign: 'center',
                  }}>
                    {rank}
                  </span>
                  <Avatar avatarKey={p.avatar} size={28} />
                  <span style={{ color: '#F0EEF8', fontWeight: 500, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.display_name}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: '0.85rem',
                    color: 'rgba(240,238,248,0.35)',
                    flexShrink: 0,
                  }}>
                    {p.score.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="results-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={handlePlayAgain}>Host Another Quiz</Button>
          <Button variant="secondary" onClick={handleHome}>Home</Button>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .host-results { padding: 20px 16px !important; }
          .results-content { max-width: 100% !important; }
          .results-actions { flex-direction: column; align-items: center; }
          .results-actions button { width: 100%; max-width: 280px; }
        }
      `}</style>
    </div>
  )
}
