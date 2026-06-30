'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { usePlayerStore } from '@/lib/stores/player-store'
import RoomCodeDisplay from '@/components/game/room-code-display'
import { RoomSkeleton } from '@/components/ui/skeleton'

export default function PlayerLobbyPage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string
  const { playerId } = usePlayerStore()
  const [roomTitle, setRoomTitle] = useState('')
  const [playerCount, setPlayerCount] = useState(0)
  const [metadata, setMetadata] = useState<{ qCount: number; timer: number; difficulty: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const channelsRef = useRef<any[]>([])

  useEffect(() => {
    if (!playerId || !roomCode) return

    let cancelled = false

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

      if (cancelled) return

      setRoomTitle(room.title)
      setMetadata({
        qCount: room.question_count,
        timer: room.timer_seconds,
        difficulty: room.difficulty,
      })

      const { count } = await getSupabase()
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)

      if (cancelled) return

      setPlayerCount(count || 0)
      setLoading(false)

      const channel = getSupabase().channel(`room-${roomCode}`)
        .on('broadcast', { event: 'game:start' }, () => {
          router.push(`/play/${roomCode}/game`)
        })
        .subscribe()

      const dbChannel = getSupabase()
        .channel(`room-db-player-${roomCode}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, () => {
          setPlayerCount((c) => c + 1)
        })
        .subscribe()

      channelsRef.current = [channel, dbChannel]
    }

    load()

    return () => {
      cancelled = true
      channelsRef.current.forEach((ch) => getSupabase().removeChannel(ch))
      channelsRef.current = []
    }
  }, [playerId, roomCode, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RoomSkeleton />
      </div>
    )
  }

  return (
    <div className="player-lobby" style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="lobby-inner" style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
        <RoomCodeDisplay code={roomCode} />

        <h1 style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
          fontWeight: 700,
          color: '#F0EEF8',
          marginTop: 16,
          marginBottom: 8,
          padding: '0 16px',
        }}>
          {roomTitle}
        </h1>

        {metadata && (
          <div className="metadata-bar" style={{
            display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
            marginBottom: 28, fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
            color: 'rgba(240,238,248,0.25)',
            fontFamily: "var(--font-jetbrains), monospace",
            letterSpacing: '0.03em',
          }}>
            <span>{metadata.qCount} questions</span>
            <span>&middot;</span>
            <span>{metadata.timer}s timer</span>
          </div>
        )}

        <div className="count-card" style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 'clamp(24px, 6vw, 40px)',
          animation: 'scaleIn 0.4s ease both 0.15s',
        }}>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 'clamp(2rem, 8vw, 2.5rem)',
            color: '#F0EEF8',
            fontWeight: 500,
          }}>
            {playerCount}
          </div>
          <div style={{ color: 'rgba(240,238,248,0.3)', fontSize: 'clamp(0.8rem, 3vw, 0.85rem)', marginTop: 4 }}>
            player{playerCount !== 1 ? 's' : ''} in room
          </div>
        </div>

        <div style={{
          marginTop: 32,
          color: 'rgba(240,238,248,0.2)',
          fontSize: 'clamp(0.78rem, 3vw, 0.82rem)',
          animation: 'pulse 2s ease-in-out infinite',
          padding: '0 16px',
        }}>
          Waiting for host to start the game...
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .player-lobby { padding: 16px !important; }
          .lobby-inner { width: 100%; }
          .metadata-bar { gap: 4px !important; }
        }
      `}</style>
    </div>
  )
}
