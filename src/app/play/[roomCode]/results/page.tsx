'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { usePlayerStore } from '@/lib/stores/player-store'
import Button from '@/components/ui/button'
import Avatar from '@/components/ui/avatar'
import { RoomSkeleton } from '@/components/ui/skeleton'
import html2canvas from 'html2canvas'
import confetti from 'canvas-confetti'

interface PlayerResult {
  avatar: string
  display_name: string
  score: number
  player_id: string
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function PlayerResultsPage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string
  const { playerId } = usePlayerStore()
  const [players, setPlayers] = useState<PlayerResult[]>([])
  const [roomTitle, setRoomTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const scoreCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!playerId || !roomCode) return

    const load = async () => {
      const { data: room } = await getSupabase()
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .maybeSingle()

      if (!room) {
        router.push('/')
        return
      }

      setRoomTitle(room.title)

      const { data: playersData } = await getSupabase()
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .order('score', { ascending: false })

      setPlayers(playersData || [])
      setLoading(false)

      const sorted = [...(playersData || [])].sort((a: any, b: any) => b.score - a.score)
      const myRank = sorted.findIndex((p: any) => p.player_id === playerId) + 1

      setTimeout(() => {
        if (myRank === 1) {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } })
          setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.5 } }), 300)
        } else if (myRank <= 3) {
          confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } })
        } else {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ['#7B4FFF', '#6EC6FF'] })
        }
      }, 500)
    }

    load()
  }, [playerId, roomCode, router])

  const me = players.find((p) => p.player_id === playerId)
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const myRank = sorted.findIndex((p) => p.player_id === playerId) + 1

  const handleShareImage = async () => {
    if (!scoreCardRef.current) return
    const canvas = await html2canvas(scoreCardRef.current, {
      backgroundColor: '#0F0D0D',
      scale: 2,
    })
    const link = document.createElement('a')
    link.download = `voicequiz-score-${roomCode}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const handleCopyResults = () => {
    const text = [
      `VoiceQuiz \u2014 ${roomTitle}`,
      `Room: ${roomCode}`,
      '',
      ...sorted.map((p, i) =>
        `${i + 1}. ${p.display_name} \u2014 ${p.score.toLocaleString()}${p.player_id === playerId ? ' (You)' : ''}`
      ),
    ].join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RoomSkeleton />
      </div>
    )
  }

  return (
    <div className="player-results" style={{ minHeight: '100vh', background: 'var(--bg)', padding: 32 }}>
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
          {roomTitle}
        </p>

        <div ref={scoreCardRef} className="score-card" style={{
          background: myRank === 1
            ? 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))'
            : 'rgba(255,255,255,0.02)',
          border: myRank === 1
            ? '1px solid rgba(255,215,0,0.2)'
            : '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 'clamp(24px, 5vw, 32px)',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          animation: 'scaleIn 0.4s ease both 0.1s',
        }}>
          {myRank === 1 && (
            <div style={{
              position: 'absolute', top: -20, right: -20,
              fontSize: '5rem', opacity: 0.1, lineHeight: 1,
              userSelect: 'none', pointerEvents: 'none',
            }}>
              &#127942;
            </div>
          )}
          <Avatar avatarKey={me?.avatar || 'a0'} size={56} />
          <div style={{ fontSize: 'clamp(1rem, 4vw, 1.1rem)', fontWeight: 600, color: '#F0EEF8', marginTop: 12, marginBottom: 4 }}>
            {me?.display_name || 'You'}
          </div>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 'clamp(2rem, 8vw, 2.5rem)',
            color: myRank === 1 ? '#FFD700' : 'rgba(240,238,248,0.6)',
            fontWeight: 600,
            marginTop: 8,
          }}>
            {me?.score.toLocaleString() || 0}
          </div>
          <div style={{
            color: myRank === 1 ? 'rgba(255,215,0,0.4)' : 'rgba(240,238,248,0.2)',
            fontSize: '0.82rem',
            marginTop: 8,
            fontFamily: "var(--font-jetbrains), monospace",
          }}>
            #{myRank} of {players.length}
          </div>
        </div>

        <div className="leaderboard-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {sorted.map((p, i) => {
            const isMedal = i < 3
            const isMe = p.player_id === playerId
            return (
              <div key={p.player_id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: isMe
                  ? 'rgba(123,79,255,0.08)'
                  : 'rgba(255,255,255,0.02)',
                border: isMe
                  ? '1px solid rgba(123,79,255,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 16px',
                animation: `fadeIn 0.3s ease both ${0.15 + i * 0.04}s`,
              }}>
                <span style={{
                  color: isMedal ? MEDAL_COLORS[i] : 'rgba(240,238,248,0.2)',
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: '0.78rem',
                  fontWeight: isMedal ? 600 : 400,
                  width: 28,
                  textAlign: 'center',
                }}>
                  {i + 1}
                </span>
                <Avatar avatarKey={p.avatar} size={28} />
                <span style={{
                  color: '#F0EEF8',
                  fontWeight: isMe ? 600 : 500,
                  flex: 1,
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {p.display_name}
                </span>
                {isMe && (
                  <span style={{
                    fontSize: '0.5rem', padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(123,79,255,0.15)', color: '#7B4FFF',
                    fontFamily: "var(--font-jetbrains), monospace",
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}>
                    You
                  </span>
                )}
                <span style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 'clamp(0.8rem, 3vw, 0.85rem)',
                  color: 'rgba(240,238,248,0.35)',
                  flexShrink: 0,
                }}>
                  {p.score.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>

        <div className="results-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={handleShareImage}>
            Share Score as Image
          </Button>
          <Button variant="secondary" onClick={handleCopyResults}>
            {copied ? 'Copied!' : 'Copy Results'}
          </Button>
        </div>

        <div className="results-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
          <Button
            variant="ghost"
            onClick={() => router.push('/join')}
          >
            Join Another Game
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Home
          </Button>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .player-results { padding: 20px 16px !important; }
          .results-content { max-width: 100% !important; }
          .results-actions { flex-direction: column; align-items: center; }
          .results-actions button { width: 100%; max-width: 280px; }
        }
      `}</style>
    </div>
  )
}
