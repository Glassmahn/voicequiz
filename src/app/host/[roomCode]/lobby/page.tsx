'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/game-store'
import { usePlayerStore } from '@/lib/stores/player-store'
import Button from '@/components/ui/button'
import RoomCodeDisplay from '@/components/game/room-code-display'
import Avatar from '@/components/ui/avatar'
import { RoomSkeleton } from '@/components/ui/skeleton'

interface PlayerRow {
  display_name: string
  avatar: string
  player_id: string
  id: string
  room_id: string
  score: number
  is_host: boolean
  created_at: string
}

export default function HostLobbyPage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string
  const { playerId } = usePlayerStore()
  const { room, players, setRoom, setPlayers, addPlayer, removePlayer, setPhase } = useGameStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId || !roomCode) return

    let roomId: string | null = null

    const loadRoom = async () => {
      const { data: roomData } = await getSupabase()
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .maybeSingle()

      if (!roomData || roomData.host_player_id !== playerId) {
        router.push('/')
        return
      }

      setRoom(roomData)
      setPhase('lobby')
      roomId = roomData.id

      const { data: playersData } = await getSupabase()
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)

      setPlayers(playersData || [])
      setLoading(false)

      const sub = getSupabase()
        .channel(`room-db-${roomCode}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players', filter: `room_id=eq.${roomData.id}` }, (payload: any) => {
          addPlayer(payload.new as PlayerRow)
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players', filter: `room_id=eq.${roomData.id}` }, (payload: any) => {
          removePlayer(payload.old.player_id)
        })
        .subscribe()

      return () => {
        getSupabase().removeChannel(sub)
      }
    }

    loadRoom()

    return () => {
      if (roomId) getSupabase().removeChannel(getSupabase().channel(`room-db-${roomCode}`))
    }
  }, [playerId, roomCode])

  const handleStart = async () => {
    if (!room) return

    await getSupabase()
      .from('rooms')
      .update({ status: 'active', current_question: 1 })
      .eq('id', room.id)

    await getSupabase().channel(`room-${roomCode}`).send({
      type: 'broadcast',
      event: 'game:start',
      payload: {},
    })

    router.push(`/host/${roomCode}/game`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RoomSkeleton />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 32 }}>
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
        <div style={{ marginBottom: 24 }}>
          <RoomCodeDisplay code={roomCode} />
        </div>

        <h1 style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
          fontWeight: 700,
          color: '#F0EEF8',
          marginBottom: 4,
        }}>
          {room?.title || 'Quiz'}
        </h1>

        <p style={{
          color: 'rgba(240,238,248,0.3)',
          fontSize: '0.8rem',
          marginBottom: 32,
          fontFamily: "var(--font-jetbrains), monospace",
          letterSpacing: '0.02em',
        }}>
          {room?.question_count} questions &middot; {room?.timer_seconds}s &middot; {room?.difficulty}
        </p>

        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(240,238,248,0.2)',
            marginBottom: 16,
          }}>
            Players ({players.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360, margin: '0 auto' }}>
            {players.map((p, i) => (
              <div key={p.player_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: '0.85rem',
                animation: `fadeIn 0.3s ease both ${i * 0.05}s`,
              }}>
                <Avatar avatarKey={p.avatar} size={28} />
                <span style={{ color: '#F0EEF8', fontWeight: 500, flex: 1, textAlign: 'left' }}>
                  {p.display_name}
                </span>
                {p.is_host && (
                  <span style={{
                    fontSize: '0.55rem', padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(123,79,255,0.15)', color: '#7B4FFF',
                    fontFamily: "var(--font-jetbrains), monospace", letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    Host
                  </span>
                )}
              </div>
            ))}
            {players.length === 0 && (
              <p style={{ color: 'rgba(240,238,248,0.2)', fontSize: '0.8rem', animation: 'pulse 2s ease-in-out infinite' }}>
                Waiting for players to join...
              </p>
            )}
          </div>
        </div>

        <Button
          size="lg"
          onClick={handleStart}
          disabled={players.length < 1}
          style={{ minWidth: 200 }}
        >
          Start Game
        </Button>
      </div>
    </div>
  )
}
