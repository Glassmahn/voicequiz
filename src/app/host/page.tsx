'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { usePlayerStore } from '@/lib/stores/player-store'
import { useGameStore } from '@/lib/stores/game-store'
import { generateRoomCode, sanitizeDisplayName } from '@/lib/utils'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { QuizSkeleton } from '@/components/ui/skeleton'
import Toast from '@/components/ui/toast'
import type { GeneratedQuestion } from '@/types'

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export default function HostSetupPage() {
  const router = useRouter()
  const { playerId, displayName, avatar } = usePlayerStore()
  const { setRoom, setQuestions, setPlayers, setHostPlayerId } = useGameStore()
  const { setRoomCode } = usePlayerStore()

  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [timer, setTimer] = useState(10)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }
    if (!playerId || !displayName) {
      router.push('/')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), questionCount, difficulty }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate quiz')
        setLoading(false)
        return
      }

      await createRoom(data.questions)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const createRoom = async (generatedQuestions: GeneratedQuestion[]) => {
    const supabase = getSupabase()

    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase.from('rooms').select('id').eq('code', code).limit(1).maybeSingle()
      if (!existing) break
      code = generateRoomCode()
      attempts++
    }
    if (attempts >= 10) {
      setError('Could not generate unique room code. Try again.')
      setLoading(false)
      return
    }

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({
        code,
        host_player_id: playerId,
        title: topic.trim(),
        status: 'waiting',
        question_count: questionCount,
        timer_seconds: timer,
        difficulty,
      })
      .select('*')
      .maybeSingle()

    if (roomErr || !room) {
      setError(`Failed to create room: ${roomErr?.message || 'Unknown error'}`)
      setLoading(false)
      return
    }

    const { error: playerErr } = await supabase.from('players').insert({
      room_id: room.id,
      player_id: playerId,
      display_name: sanitizeDisplayName(displayName) || 'Host',
      avatar,
      score: 0,
      is_host: true,
    }).select('*').maybeSingle()

    if (playerErr) {
      await supabase.from('rooms').delete().eq('id', room.id)
      setError(`Failed to create player: ${playerErr?.message || 'Unknown error'}`)
      setLoading(false)
      return
    }

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)

    const questionsToInsert = generatedQuestions.map((q, i) => ({
      room_id: room.id,
      question_number: i + 1,
      question_text: q.question,
      options: q.options,
      correct_answer: q.correctAnswer,
    }))

    const { data: insertedQuestions, error: qErr } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select('*')

    if (qErr || !insertedQuestions || insertedQuestions.length === 0) {
      await supabase.from('rooms').delete().eq('id', room.id)
      setError(`Failed to save questions: ${qErr?.message || 'Unknown error'}`)
      setLoading(false)
      return
    }

    setRoom(room)
    setQuestions(insertedQuestions)
    setPlayers(players || [])
    setHostPlayerId(playerId)
    setRoomCode(code)

    router.push(`/host/${code}/lobby`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {loading ? (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
          <div style={{
            fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            fontSize: '1.3rem',
            fontWeight: 600,
            color: '#F0EEF8',
            marginBottom: 4,
          }}>
            Generating quiz
          </div>
          <p style={{
            color: 'rgba(240,238,248,0.25)',
            fontSize: '0.8rem',
            marginBottom: 32,
          }}>
            {questionCount} {difficulty} questions about &ldquo;{topic}&rdquo;
          </p>
          <QuizSkeleton />
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{
            fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#F0EEF8',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Create a quiz
          </h1>
          <p style={{
            color: 'rgba(240,238,248,0.3)',
            fontSize: '0.8rem',
            textAlign: 'center',
            marginBottom: 32,
          }}>
            Pick a topic, we&rsquo;ll generate the questions
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{
                color: 'rgba(240,238,248,0.4)',
                fontSize: '0.75rem',
                fontWeight: 500,
                marginBottom: 6,
                display: 'block',
              }}>
                Topic
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. World History, Science, Pop Culture"
                maxLength={100}
              />
            </div>

            <div>
              <label style={{
                color: 'rgba(240,238,248,0.4)',
                fontSize: '0.75rem',
                fontWeight: 500,
                marginBottom: 8,
                display: 'block',
              }}>
                Questions
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 15].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8,
                      border: questionCount === n
                        ? '1px solid rgba(123,79,255,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: questionCount === n
                        ? 'rgba(123,79,255,0.1)'
                        : 'transparent',
                      color: questionCount === n ? '#F0EEF8' : 'rgba(240,238,248,0.4)',
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (questionCount !== n) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (questionCount !== n) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      }
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{
                color: 'rgba(240,238,248,0.4)',
                fontSize: '0.75rem',
                fontWeight: 500,
                marginBottom: 8,
                display: 'block',
              }}>
                Timer (seconds)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 15, 20].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimer(t)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8,
                      border: timer === t
                        ? '1px solid rgba(123,79,255,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: timer === t
                        ? 'rgba(123,79,255,0.1)'
                        : 'transparent',
                      color: timer === t ? '#F0EEF8' : 'rgba(240,238,248,0.4)',
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (timer !== t) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (timer !== t) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      }
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{
                color: 'rgba(240,238,248,0.4)',
                fontSize: '0.75rem',
                fontWeight: 500,
                marginBottom: 8,
                display: 'block',
              }}>
                Difficulty
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8,
                      border: difficulty === d
                        ? '1px solid rgba(123,79,255,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: difficulty === d
                        ? 'rgba(123,79,255,0.1)'
                        : 'transparent',
                      color: difficulty === d ? '#F0EEF8' : 'rgba(240,238,248,0.4)',
                      fontFamily: "'SF Pro Text', sans-serif",
                      fontSize: '0.8rem', fontWeight: 500,
                      textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (difficulty !== d) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (difficulty !== d) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      }
                    }}
                  >{d}</button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              loading={loading}
              style={{ marginTop: 4 }}
            >
              Generate & Create Room
            </Button>
          </div>
        </div>
      )}

      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
    </div>
  )
}
