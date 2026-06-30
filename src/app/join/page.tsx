'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { usePlayerStore } from '@/lib/stores/player-store'
import { sanitizeDisplayName, generateSuggestionName } from '@/lib/utils'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Toast from '@/components/ui/toast'

export default function JoinPage() {
  const router = useRouter()
  const { playerId, displayName, avatar, setDisplayName, setAvatar, setRoomCode: persistRoomCode } = usePlayerStore()
  const [name, setName] = useState(displayName)
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    const cleaned = sanitizeDisplayName(name)
    if (!cleaned) {
      setError('Please enter a display name')
      return
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    const code = roomCode.trim().toUpperCase()
    setLoading(true)
    setError(null)

    try {
      const { data: room, error: roomErr } = await getSupabase()
        .from('rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      if (roomErr || !room) {
        setError('Room not found. Check the code and try again.')
        setLoading(false)
        return
      }

      if (room.status === 'finished') {
        setError('This game has already ended.')
        setLoading(false)
        return
      }

      if (room.status === 'active') {
        const { data: wasInRoom } = await getSupabase()
          .from('players')
          .select('id')
          .eq('room_id', room.id)
          .eq('player_id', playerId)
          .maybeSingle()
        if (!wasInRoom) {
          setError('This game has already started.')
          setLoading(false)
          return
        }
      }

      persistRoomCode(code)

      const { count } = await getSupabase()
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)

      if (count && count >= 30) {
        setError('This room is full (max 30 players).')
        setLoading(false)
        return
      }

      const { data: existingNames } = await getSupabase()
        .from('players')
        .select('display_name')
        .eq('room_id', room.id)

      const takenNames = new Set(existingNames?.map((p) => p.display_name) || [])
      let finalName = cleaned
      let attempts = 0

      while (takenNames.has(finalName) && attempts < 10) {
        attempts++
        finalName = generateSuggestionName(cleaned, attempts)
      }

      if (attempts >= 10) {
        finalName = `${cleaned}_${Math.random().toString(36).slice(2, 5)}`
      }

      setDisplayName(finalName)
      setAvatar(avatar)

      const { data: existingPlayer } = await getSupabase()
        .from('players')
        .select('id')
        .eq('room_id', room.id)
        .eq('player_id', playerId)
        .maybeSingle()

      if (existingPlayer) {
        const { error: uErr } = await getSupabase()
          .from('players')
          .update({ display_name: finalName, avatar })
          .eq('id', existingPlayer.id)

        if (uErr) {
          setError('Failed to rejoin room. Please try again.')
          setLoading(false)
          return
        }
      } else {
        const { error: pErr } = await getSupabase().from('players').insert({
          room_id: room.id,
          player_id: playerId,
          display_name: finalName,
          avatar,
          score: 0,
          is_host: false,
        })

        if (pErr) {
          setError('Failed to join room. Please try again.')
          setLoading(false)
          return
        }
      }

      if (finalName !== cleaned) {
        setError(`"${cleaned}" was taken. You joined as "${finalName}".`)
      }

      router.push(`/play/${code}/lobby`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="join-page" style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="join-card" style={{ width: '100%', maxWidth: 360 }}>
        <h1 style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
          fontWeight: 700,
          color: '#F0EEF8',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Join a game
        </h1>
        <p style={{
          color: 'rgba(240,238,248,0.3)',
          fontSize: '0.8rem',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          Enter the room code from the host
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />

          <Input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={6}
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              letterSpacing: '0.12em',
              textAlign: 'center',
              textTransform: 'uppercase',
              fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />

          <Button onClick={handleJoin} loading={loading} style={{ minHeight: 48 }}>
            Join Room
          </Button>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .join-page { padding: 16px !important; }
          .join-card { max-width: 100% !important; }
        }
      `}</style>

      {error && (
        <Toast
          message={error}
          type={error.includes('taken') ? 'info' : 'error'}
          onClose={() => setError(null)}
          duration={error.includes('taken') ? 6000 : 5000}
        />
      )}
    </div>
  )
}
